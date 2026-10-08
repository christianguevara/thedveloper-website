#!/usr/bin/env python3
"""eufy Indoor Cam 2K (T8400) .dat continuous-recording parser.

Record layout (little endian), each record starts with magic b'XZYH':
  0  4  magic 'XZYH'
  4  1  stream type: 0x14 video, 0x15 audio
  5  1  version (5)
  6  4  record size minus 16  (next record = offset + this + 16)
 10  2  frame type: 1 = P-frame, 3 = I-frame (|0x100 = more fragments follow), 2 = audio
 16  4  payload length
 20  4  flags (bit0 keyframe/independent, bit8 video)
 24  2  fps      (video only)
 26  2  width    (video only)
 28  2  height   (video only)
 then timestamp(4) + sequence(4); header is 38 bytes for video, 32 for audio.
Video payload: Annex-B H.264. P-frames are plaintext; I-frames (all fragments
joined) are AES-128 encrypted with a per-camera key that rotates weekly.
Audio payload: plaintext AAC-LC ADTS, 16 kHz mono.
"""
import struct, subprocess, sys, argparse, pathlib

def records(data):
    i = 0
    while True:
        i = data.find(b'XZYH', i)
        if i == -1 or i + 20 > len(data): return
        f6 = struct.unpack_from('<I', data, i+6)[0]
        ftype = struct.unpack_from('<H', data, i+10)[0]
        plen = struct.unpack_from('<I', data, i+16)[0]
        hdr = f6 + 16 - plen
        yield data[i+4], ftype, data[i+hdr:i+hdr+plen]
        nxt = i + f6 + 16
        i = nxt if nxt > i + 4 else i + 4

# Only the first KF_ENC_PREFIX bytes of each keyframe *fragment* are AES
# encrypted; the rest of the fragment is plaintext H.264 (same as the live
# stream). Keyframes arrive split into fragments, so decryption must be done
# per fragment, before they are joined.
KF_ENC_PREFIX = 128

def split(data):
    """-> (list of (is_iframe, [fragment_bytes, ...]) video frames, aac bytes)

    For an I-frame the second element is the list of its encrypted fragments
    (keyframes are fragmented); for a P-frame it is a single-element list.
    """
    video, audio, pending = [], bytearray(), []
    for st, ftype, pay in records(data):
        if st == 0x15: audio += pay
        elif st == 0x14:
            if (ftype & 0xff) == 3:
                pending.append(pay)
                if not ftype & 0x100:
                    video.append((True, pending)); pending = []
            else:
                video.append((False, [pay]))
    return video, bytes(audio)

def decrypt_iframe(fragments, key_hex, mode='ecb'):
    """Decrypt a keyframe: only the first KF_ENC_PREFIX bytes of each fragment
    are encrypted; concatenate the decrypted prefixes with the plaintext rest."""
    out = bytearray()
    for frag in fragments:
        if len(frag) >= KF_ENC_PREFIX:
            out += aes_decrypt(key_hex, frag[:KF_ENC_PREFIX], mode) + frag[KF_ENC_PREFIX:]
        else:
            out += aes_decrypt(key_hex, frag, mode)
    return bytes(out)

def aes_decrypt(key_hex, blob, mode='ecb'):
    n = len(blob) - len(blob) % 16
    cmd = ['openssl', 'enc', '-d', f'-aes-128-{mode}', '-K', key_hex, '-nopad'] + (['-iv', '00'*16] if mode == 'cbc' else [])
    out = subprocess.run(cmd, input=blob[:n], capture_output=True, check=True).stdout
    return out + blob[n:]

def try_key(path, key_hex):
    video, _ = split(pathlib.Path(path).read_bytes())
    frag0 = next(f for k, f in video if k)[0]  # first fragment of first keyframe
    for mode in ('ecb', 'cbc'):
        pt = aes_decrypt(key_hex, frag0[:64], mode)
        ok = pt.startswith(b'\x00\x00\x00\x01\x67') or pt.startswith(b'\x00\x00\x00\x01')
        print(f"{mode}: {pt[:24].hex(' ')}  {'<-- VALID H.264 START' if ok else ''}")
        if ok: return mode
    return None

def convert(path, out_mp4, key_hex=None, mode='ecb'):
    video, audio = split(pathlib.Path(path).read_bytes())
    h264 = bytearray()
    for is_i, frags in video:
        if is_i and key_hex:
            h264 += decrypt_iframe(frags, key_hex, mode)
        else:
            h264 += b''.join(frags)
    start = h264.find(b'\x00\x00\x00\x01')
    if start > 0: h264 = h264[start:]
    tmp = pathlib.Path(out_mp4).with_suffix('')
    v, a = tmp.with_suffix('.h264'), tmp.with_suffix('.aac')
    v.write_bytes(h264); a.write_bytes(audio)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-r', '15', '-f', 'h264', '-i', str(v)]
    if audio: cmd += ['-i', str(a)]
    cmd += ['-c:v', 'copy'] + (['-c:a', 'copy'] if audio else []) + ['-movflags', '+faststart', str(out_mp4)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    v.unlink(); a.unlink(missing_ok=True)
    return r.returncode == 0, r.stderr

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('file'); ap.add_argument('--key', help='AES-128 key as 32 hex chars')
    ap.add_argument('--mode', default='ecb'); ap.add_argument('--out', help='write mp4 here (needs --key for video)')
    ap.add_argument('--audio-only', help='write extracted AAC here')
    a = ap.parse_args()
    if a.audio_only:
        _, aud = split(pathlib.Path(a.file).read_bytes()); pathlib.Path(a.audio_only).write_bytes(aud); print('wrote', a.audio_only, len(aud), 'bytes')
    elif a.key and not a.out:
        print('mode:', try_key(a.file, a.key))
    elif a.out:
        ok, err = convert(a.file, a.out, a.key, a.mode); print('ok' if ok else err)
