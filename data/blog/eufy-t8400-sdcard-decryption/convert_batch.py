#!/usr/bin/env python3
"""Batch-convert eufy T8400 .dat recordings to MP4 once the weekly AES keys are known.

keys.json format (produced by keytool/capture_keys.js or written by hand):
  {"keys": [{"key": "<32 hex>", "mode": "ecb"|"cbc"}, ...]}
Each file's first keyframe is tried against every key; the one that yields a valid
H.264 header (00 00 00 01 67) is used for that file. Files whose key is unknown are
skipped and listed in the summary, so the run is safe to repeat as more keys arrive.

Usage:
  python3 convert_batch.py --source <dir with .dat> --dest <out dir> --keys keys.json \
      [--index activity_index.csv --tiers high,medium] [--audio-only-fallback] [--limit N]
Video is remuxed without re-encoding (H.264 + AAC copy), so output is roughly the input size.
"""
import argparse, csv, json, os, pathlib, subprocess, sys, time
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from eufy_dat import split, aes_decrypt, decrypt_iframe  # noqa: E402

H264_START = b'\x00\x00\x00\x01'

def find_key(frag0, keys):
    """frag0 = first fragment of the first keyframe; its first 128 bytes are
    the encrypted region, so the first 64 are enough to recognise the key."""
    for k in keys:
        try:
            pt = aes_decrypt(k['key'], frag0[:64], k['mode'])
        except subprocess.CalledProcessError:
            continue
        if pt.startswith(H264_START) and (pt[4] & 0x1f) in (7, 5, 8):
            return k
    return None

def convert_file(path, out_mp4, keys, audio_only_fallback=False, forced_keyhex=None):
    data = pathlib.Path(path).read_bytes()
    video, audio = split(data)
    frags0 = next((f for is_i, f in video if is_i), None)
    if forced_keyhex:
        key = {'key': forced_keyhex, 'mode': 'ecb'}
    else:
        key = find_key(frags0[0], keys) if frags0 else None
    tmp = out_mp4.with_suffix('')
    v, a = tmp.with_suffix('.h264'), tmp.with_suffix('.aac')
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    if key is None:
        if not audio_only_fallback or not audio:
            return 'no-key'
        a.write_bytes(audio)
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(a), '-c:a', 'copy', str(out_mp4.with_suffix('.m4a'))]
        r = subprocess.run(cmd, capture_output=True, text=True); a.unlink(missing_ok=True)
        return 'audio-only' if r.returncode == 0 else 'ffmpeg-error: ' + r.stderr.strip()[:120]
    h264 = bytearray()
    for is_i, frags in video:
        h264 += decrypt_iframe(frags, key['key'], key['mode']) if is_i else b''.join(frags)
    # a file can begin mid-keyframe; drop anything before the first NAL start code
    s0 = h264.find(H264_START)
    if s0 > 0:
        h264 = h264[s0:]
    v.write_bytes(h264)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-r', '15', '-f', 'h264', '-i', str(v)]
    if audio:
        a.write_bytes(audio); cmd += ['-itsoffset', '0', '-i', str(a)]
    cmd += ['-c:v', 'copy'] + (['-c:a', 'copy'] if audio else []) + ['-movflags', '+faststart', str(out_mp4)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    v.unlink(missing_ok=True); a.unlink(missing_ok=True)
    return 'ok' if r.returncode == 0 else 'ffmpeg-error: ' + r.stderr.strip()[:120]

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--source', required=True); ap.add_argument('--dest', required=True)
    ap.add_argument('--keys', required=True, help='keys.json')
    ap.add_argument('--keymap', help='optional JSON map {"<name>.dat": keyhex} to assign keys by filename')
    ap.add_argument('--index', help='activity_index.csv to select files by tier')
    ap.add_argument('--tiers', default='high,medium')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--audio-only-fallback', action='store_true', help='write .m4a for files whose key is unknown')
    args = ap.parse_args()
    keys = json.load(open(args.keys))['keys']
    keymap = json.load(open(args.keymap)) if args.keymap else {}
    src, dest = pathlib.Path(args.source), pathlib.Path(args.dest).expanduser()
    names = sorted(p.name for p in src.glob('*.dat'))
    if args.index:
        tiers = set(args.tiers.split(','))
        wanted = {r['name'] for r in csv.DictReader(open(args.index)) if r['tier'] in tiers}
        names = [n for n in names if n in wanted]
    if args.limit: names = names[:args.limit]
    print(f'{len(names)} files to convert, {len(keys)} key(s) known')
    stats, failures, t0 = {}, [], time.time()
    for i, n in enumerate(names, 1):
        out = dest / (n[:8] + '/' + n[:14] + '.mp4')
        if out.exists():
            stats['skipped-existing'] = stats.get('skipped-existing', 0) + 1; continue
        res = convert_file(src / n, out, keys, args.audio_only_fallback, keymap.get(n))
        tag = res.split(':')[0]; stats[tag] = stats.get(tag, 0) + 1
        if tag not in ('ok', 'audio-only'): failures.append((n, res))
        if i % 25 == 0 or i == len(names):
            print(f'[{i}/{len(names)}] {stats} ({time.time()-t0:.0f}s)', flush=True)
    json.dump({'stats': stats, 'failures': failures, 'keys_used': len(keys)}, open(dest / 'convert_summary.json', 'w'), indent=2)
    print('summary:', stats, '-> ', dest / 'convert_summary.json')

if __name__ == '__main__':
    main()
