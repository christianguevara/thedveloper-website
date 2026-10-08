#!/usr/bin/env python3
"""Reconstruct a eufy T8400 weekly media-encryption key with angr.

The video-storage AES key is produced by `create_pic_code_v1` inside the eufy
Android app's `libcrypto-security.so`. We cannot just call that function: it is
built for Android (packed relocations) so a normal loader (glibc/QEMU) refuses
it, and it hashes/obfuscates with its own statically-linked crypto. So we load
the library in angr and *concretely execute* the single function, hooking the
few libc helpers it calls and, crucially, hooking its internal random generator
so it returns the per-week value stored on the SD card.

Inputs per the USENIX WOOT'24 paper "Reverse Engineering the Eufy Ecosystem"
(Goeman et al.) and our own tracing:

    create_pic_code_v1(char *serial, int l, char *ppcs_id,
                       char *out_rand[10], char *out_key[32])

  - serial    : camera serial, e.g. "T8400P3223020166"
  - l         : 0x10 (prefix length of the serial used in the base code)
  - ppcs_id   : device PPCS id from flash, e.g. "EUPRCAM-254464-NVXDH"
  - out_rand  : 10-byte buffer; the function needs strlen(out_rand) == 10
  - out_key   : 32-byte buffer; the AES-128 key is its first 16 ASCII bytes

The "random" is generated internally; we hook it (sub at file-offset 0x22af60)
to return `rand`, where rand = int(weekcode[2:]) and weekcode is the 10-digit
code stored next to each filename in `continuefilelink.dat` (e.g. "0163419399"
-> rand 63419399). The resulting key, used as AES-128-ECB, decrypts that week's
keyframes to `00 00 00 01 27 64 00 2a` (a valid H.264 SPS).

Usage:
    python3 derive_key.py libcrypto-security.so \
        --serial T8400P3223020166 --ppcs EUPRCAM-254464-NVXDH --rand 63419399

Needs: angr (pip install angr). Function offsets below are for
libcrypto-security.so from Anker eufy 6.1.10_30612 (firmware 2.2.0.0).
"""
import argparse
import hashlib
import angr

# file-offsets inside libcrypto-security.so (add to mapped_base).
# OFF_CREATE_PIC_CODE_V1 already has the thumb bit set (it is odd), so we call
# it as-is -- do NOT add 1.
OFF_CREATE_PIC_CODE_V1 = 0x2209a5
OFF_INTERNAL_RANDOM    = 0x22af60   # the rand source we override


def build_project(lib_path):
    p = angr.Project(lib_path, auto_load_libs=False)
    base = p.loader.main_object.mapped_base

    def cstr(st, ptr, maxn=256):
        out = b""
        for i in range(maxn):
            b = st.solver.eval(st.memory.load(ptr + i, 1), cast_to=bytes)
            if b == b"\x00":
                break
            out += b
        return out

    def argN(st, i):
        if i < 4:
            return st.solver.eval(getattr(st.regs, "r%d" % i))
        sp = st.solver.eval(st.regs.sp)
        return st.solver.eval(st.memory.load(sp + 4 * (i - 4), 4, endness=st.arch.memory_endness))

    # --- minimal printf-family + string helpers the function calls ---
    def do_fmt(st, fmt, first):
        out, ai, i = b"", first, 0
        while i < len(fmt):
            c = fmt[i:i + 1]
            if c != b"%":
                out += c; i += 1; continue
            j = i + 1; spec = b""
            while j < len(fmt) and fmt[j:j + 1] not in b"diouxXscp%":
                spec += fmt[j:j + 1]; j += 1
            conv = fmt[j:j + 1] if j < len(fmt) else b""
            if conv == b"%":
                out += b"%"
            elif conv == b"s":
                out += cstr(st, argN(st, ai)); ai += 1
            elif conv in b"diou":
                v = argN(st, ai) & 0xffffffff; ai += 1
                if conv in b"di" and v >= 0x80000000:
                    v -= 0x100000000
                out += (("%" + spec.decode() + "d") % v).encode()
            elif conv in b"xXp":
                v = argN(st, ai) & 0xffffffff; ai += 1
                cc = "x" if conv in b"xp" else "X"
                out += (("%" + spec.decode() + cc) % v).encode()
            elif conv == b"c":
                out += bytes([argN(st, ai) & 0xff]); ai += 1
            i = j + 1
        return out

    class Sprintf(angr.SimProcedure):
        FMT = 1; VA = 2
        def run(self, *a):
            st = self.state; buf = argN(st, 0); fmt = cstr(st, argN(st, self.FMT))
            r = do_fmt(st, fmt, self.VA) + b"\x00"; st.memory.store(buf, r); return len(r) - 1

    class Snprintf(Sprintf):    FMT = 2; VA = 3
    class SprintfChk(Sprintf):  FMT = 3; VA = 4
    class SnprintfChk(Sprintf): FMT = 4; VA = 5

    class VsnprintfChk(angr.SimProcedure):
        # __vsnprintf_chk(buf, size, flag, maxlen, fmt, va_list)
        FMTi = 3; VAi = 4
        def run(self, *a):
            st = self.state; buf = argN(st, 0)
            fmt = cstr(st, argN(st, self.FMTi)); va = argN(st, self.VAi)
            out, i, k = b"", 0, [0]
            def nv():
                v = st.solver.eval(st.memory.load(va + 4 * k[0], 4, endness=st.arch.memory_endness))
                k[0] += 1; return v
            while i < len(fmt):
                c = fmt[i:i + 1]
                if c != b"%":
                    out += c; i += 1; continue
                j = i + 1; spec = b""
                while j < len(fmt) and fmt[j:j + 1] not in b"diouxXscp%":
                    spec += fmt[j:j + 1]; j += 1
                conv = fmt[j:j + 1] if j < len(fmt) else b""
                if conv == b"%":
                    out += b"%"
                elif conv == b"s":
                    out += cstr(st, nv())
                elif conv in b"diou":
                    v = nv() & 0xffffffff
                    if conv in b"di" and v >= 0x80000000:
                        v -= 0x100000000
                    out += (("%" + spec.decode() + "d") % v).encode()
                elif conv in b"xXp":
                    v = nv() & 0xffffffff; cc = "x" if conv in b"xp" else "X"
                    out += (("%" + spec.decode() + cc) % v).encode()
                elif conv == b"c":
                    out += bytes([nv() & 0xff])
                i = j + 1
            st.memory.store(buf, out + b"\x00"); return len(out)

    class VsprintfChk(VsnprintfChk):
        FMTi = 3; VAi = 4

    class Md5(angr.SimProcedure):
        def run(self, d, n, md):
            st = self.state; dd = st.solver.eval(d); nn = st.solver.eval(n)
            data = st.solver.eval(st.memory.load(dd, nn), cast_to=bytes) if 0 < nn < 4096 else b""
            st.memory.store(md, hashlib.md5(data).digest()); return md

    class Sha256(angr.SimProcedure):
        def run(self, d, n, md):
            st = self.state; dd = st.solver.eval(d); nn = st.solver.eval(n)
            data = st.solver.eval(st.memory.load(dd, nn), cast_to=bytes) if 0 < nn < 4096 else b""
            st.memory.store(md, hashlib.sha256(data).digest()); return md

    class Sscanf(angr.SimProcedure):
        def run(self, s_ptr, fmt_ptr):
            st = self.state; s = cstr(st, s_ptr); fmt = cstr(st, fmt_ptr)
            outs = [argN(st, 2), argN(st, 3), argN(st, 4), argN(st, 5)]
            if b"%[^-]" in fmt:
                n = 0
                for i, part in enumerate(s.split(b"-")[:3]):
                    st.memory.store(outs[i], part + b"\x00"); n += 1
                return n
            if b"%x" in fmt or b"%d" in fmt:
                try: v = int(s, 16) if b"%x" in fmt else int(s)
                except Exception: v = 0
                st.memory.store(outs[0], (v & 0xffffffff).to_bytes(4, "little")); return 1
            return 0

    SP = angr.SIM_PROCEDURES

    class mcpy(angr.SimProcedure):
        def run(s, d, x, n, dl): s.inline_call(SP["libc"]["memcpy"], d, x, n); return d
    class mset(angr.SimProcedure):
        def run(s, d, c, n, dl): s.inline_call(SP["libc"]["memset"], d, c, n); return d
    class slen(angr.SimProcedure):
        def run(s, x, m): return s.inline_call(SP["libc"]["strlen"], x).ret_expr
    class scpy(angr.SimProcedure):
        def run(s, d, x, dl): s.inline_call(SP["libc"]["strcpy"], d, x); return d
    class sncpy(angr.SimProcedure):
        def run(s, d, x, n, dl): s.inline_call(SP["libc"]["strncpy"], d, x, n); return d
    class scat(angr.SimProcedure):
        def run(s, d, x, dl): s.inline_call(SP["libc"]["strcat"], d, x); return d
    class retz(angr.SimProcedure):
        def run(s): return 0

    hooks = {
        "__memcpy_chk": mcpy, "__memset_chk": mset, "__strlen_chk": slen,
        "__strcpy_chk": scpy, "__strncpy_chk": sncpy, "__strcat_chk": scat,
        "__stack_chk_fail": retz, "sscanf": Sscanf, "__isoc99_sscanf": Sscanf,
        "sprintf": Sprintf, "snprintf": Snprintf,
        "__sprintf_chk": SprintfChk, "__snprintf_chk": SnprintfChk,
        "__vsnprintf_chk": VsnprintfChk, "__vsprintf_chk": VsprintfChk,
        "MD5": Md5, "SHA256": Sha256,
    }
    for name, proc in hooks.items():
        try: p.hook_symbol(name, proc())
        except Exception: pass

    return p, base, cstr


def derive_key(lib_path, serial, ppcs, rand):
    p, base, cstr = build_project(lib_path)

    # override the internal random so the key is reproducible for a known file
    class RandHook(angr.SimProcedure):
        def run(self, *a): return rand
    p.hook(base + OFF_INTERNAL_RANDOM, RandHook())

    RET = 0x30000000
    p.hook(RET, angr.SIM_PROCEDURES["stubs"]["PathTerminator"]())

    st = p.factory.blank_state(add_options={
        angr.options.ZERO_FILL_UNCONSTRAINED_MEMORY,
        angr.options.ZERO_FILL_UNCONSTRAINED_REGISTERS,
    })
    # scratch buffers
    SER, PPCS = 0x20000000, 0x20000400
    OUT_RAND, OUT_KEY = 0x28000000, 0x28001000
    st.memory.store(SER, serial.encode() + b"\x00")
    st.memory.store(PPCS, ppcs.encode() + b"\x00")
    st.memory.store(OUT_RAND, b"0" * 10 + b"\x00")   # strlen == 10 required
    st.memory.store(OUT_KEY, b"0" * 32 + b"\x00")

    call = p.factory.call_state(
        base + OFF_CREATE_PIC_CODE_V1,  # offset already encodes thumb (odd)
        SER, 0x10, PPCS, OUT_RAND, OUT_KEY,
        base_state=st, ret_addr=RET,
    )
    sm = p.factory.simgr(call)
    sm.explore(find=RET, num_find=1, n=200000)
    if not sm.found:
        raise RuntimeError("function did not return")
    s = sm.found[0]
    out_key = s.solver.eval(s.memory.load(OUT_KEY, 32), cast_to=bytes)
    return out_key[:16]  # 16 ASCII bytes = the AES-128 key


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lib", help="path to libcrypto-security.so")
    ap.add_argument("--serial", required=True)
    ap.add_argument("--ppcs", required=True)
    ap.add_argument("--rand", required=True, type=int,
                    help="int(weekcode[2:]) from continuefilelink.dat")
    args = ap.parse_args()
    key = derive_key(args.lib, args.serial, args.ppcs, args.rand)
    print("AES-128-ECB key (ASCII):", key.decode(errors="replace"))
    print("AES-128-ECB key (hex)  :", key.hex())


if __name__ == "__main__":
    main()
