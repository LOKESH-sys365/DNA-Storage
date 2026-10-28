#!/usr/bin/env python3
'''
DNA Storage Simulation Codec
============================
Encode : file bytes -> Reed-Solomon (adds backup/parity bytes)
         -> XOR keystream scramble (breaks AAAAAA runs, balances GC ~50%)
         -> 2-bits-per-base mapping (00=A, 01=C, 10=G, 11=T) -> DNA strand
Damage : simulated mutations, insertions/deletions, lost chunks (set to "N")
Decode : reverse mapping (with base re-alignment) -> un-XOR -> Reed-Solomon
         repair (uses known "N" erasure positions) -> original bytes

Usage:
  python dna_codec.py run --file hi.txt [--seed 42] [--mut-rate 0.02]
      [--indel-rate 0.005] [--chunk-losses 1] [--chunk-size 24]
'''
import argparse
import json
import random

from reedsolo import RSCodec, ReedSolomonError

# 2 bits -> 1 base  (matches the spec example: "Hi" -> CAGA CGGC)
BASE_MAP = {"00": "A", "01": "C", "10": "G", "11": "T"}
INV_MAP = {v: k for k, v in BASE_MAP.items()}
BASES = "ACGT"

KEY_SEED = 1337        # deterministic PRNG seed => sender & receiver share the key
DATA_PER_BLOCK = 223   # data bytes per RS block (223 + 32 parity = 255 max codeword)
NSYM = 32              # parity bytes per block -> repairs up to 16 errors / 32 erasures


def keystream(n):
    """Repeatable, random-looking byte pattern = the biological 'shuffler'."""
    r = random.Random(KEY_SEED)
    return bytes(r.randrange(256) for _ in range(n))


def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


def rs_encode(data):
    rs = RSCodec(NSYM)
    return b"".join(rs.encode(data[i:i + DATA_PER_BLOCK])
                    for i in range(0, len(data), DATA_PER_BLOCK))


def rs_decode(data, erase_pos=None):
    """Reverse the math: locate damaged symbols and flip them back."""
    rs = RSCodec(NSYM)
    out, fixed = bytearray(), 0
    for i in range(0, len(data), DATA_PER_BLOCK + NSYM):
        block = data[i:i + DATA_PER_BLOCK + NSYM]
        ep = [p - i for p in (erase_pos or []) if i <= p < i + len(block)]
        msg, _, errata = rs.decode(block, erase_pos=ep or None)
        out += msg
        fixed += len(errata)
    return bytes(out), fixed


def bytes_to_dna(data):
    bits = "".join("%08d" % int(bin(b)[2:]) for b in data)
    bits = "".join(f"{b:08b}" for b in data)
    return "".join(BASE_MAP[bits[i:i + 2]] for i in range(0, len(bits), 2))


def dna_to_bytes(dna):
    bits = "".join(INV_MAP.get(b, "00") for b in dna)   # "N" -> placeholder byte
    bits = bits[: len(bits) - len(bits) % 8]
    return bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))


def gc_content(dna):
    return round(sum(b in "GC" for b in dna) / len(dna), 4) if dna else 0.0


def longest_homopolymer(dna):
    best = run = 0
    prev = None
    for b in dna:
        run = run + 1 if b == prev else 1
        best = max(best, run)
        prev = b
    return best


def simulate_damage(dna, seed, mut_rate, indel_rate, chunk_losses, chunk_size):
    """Fake the real world: mutations, indels, and whole lost chunks."""
    s = list(dna)
    r = random.Random(seed)
    dmg = {"mutations": 0, "insertions": 0, "deletions": 0, "lostBases": 0}
    chunk_size = max(2, chunk_size - chunk_size % 2)          # keep byte alignment
    for _ in range(chunk_losses):                              # lost strand chunk
        start = r.randrange(0, max(1, len(s) - chunk_size))
        start -= start % 2
        for i in range(start, min(len(s), start + chunk_size)):
            s[i] = "N"
        dmg["lostBases"] += chunk_size
    for i in range(len(s)):                                    # point mutations
        if s[i] != "N" and r.random() < mut_rate:
            s[i] = r.choice([b for b in BASES if b != s[i]])
            dmg["mutations"] += 1
    out = []
    for i in range(len(s)):                                    # insertions/deletions
        if s[i] != "N" and r.random() < indel_rate:
            if r.random() < 0.5:
                out.append(r.choice(BASES))
                dmg["insertions"] += 1
            else:
                dmg["deletions"] += 1
                continue
        out.append(s[i])
    return "".join(out), dmg


def recover(damaged, expected_bases, expected_len):
    """Unscramble + Reed-Solomon repair. Tries both base alignments (indels
    shift the reading frame by one base)."""
    for cut in (0, 1):
        sub = damaged[cut:]
        erase = sorted({i // 2 for i, b in enumerate(sub) if b == "N" and i % 2 == 0})
        raw = dna_to_bytes(sub)
        want = (expected_bases - cut) // 2
        if len(raw) < want:
            raw += b"\x00" * (want - len(raw))
        raw = raw[:want]
        try:
            data, fixed = rs_decode(xor_bytes(raw, keystream(len(raw))), erase_pos=erase)
        except ReedSolomonError:
            continue
        if len(data) == expected_len:
            return data, fixed
    return None, 0


def run(path, seed, mut_rate, indel_rate, chunk_losses, chunk_size):
    raw = open(path, "rb").read()
    # ENCODE: RS backup -> XOR scramble -> DNA letters
    rs_data = rs_encode(raw)
    scrambled = xor_bytes(rs_data, keystream(len(rs_data)))
    dna = bytes_to_dna(scrambled)
    # SIMULATE DAMAGE
    damaged, dmg = simulate_damage(dna, seed, mut_rate, indel_rate, chunk_losses, chunk_size)
    # DECODE: reverse map -> un-XOR -> RS repair
    recovered, fixed = recover(damaged, len(dna), len(raw))
    total = sum(dmg.values())
    return {
        "fileName": path.replace("\\", "/").rsplit("/", 1)[-1],
        "originalSizeBytes": len(raw),
        "rsEncodedBytes": len(rs_data),
        "dnaLength": len(dna),
        "dnaPreview": dna[:240],
        "damagedPreview": damaged[:240],
        "recoveredPerfectly": recovered == raw,
        "recoveredBytes": len(recovered) if recovered else 0,
        "stats": {
            "gcContent": gc_content(dna),
            "gcBalanced": 0.4 <= gc_content(dna) <= 0.6,
            "longestHomopolymer": longest_homopolymer(dna),
            "damage": dmg,
            "damageRate": round(total / len(dna), 4) if dna else 0.0,
            "errorsFixed": fixed,
            "totalDamageEvents": total,
        },
    }


def main():
    ap = argparse.ArgumentParser(description="DNA storage simulation codec")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("run", help="full encode -> damage -> decode pipeline")
    p.add_argument("--file", required=True)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--mut-rate", type=float, default=0.02)
    p.add_argument("--indel-rate", type=float, default=0.005)
    p.add_argument("--chunk-losses", type=int, default=1)
    p.add_argument("--chunk-size", type=int, default=24)
    a = ap.parse_args()
    if a.cmd == "run":
        print(json.dumps(run(a.file, a.seed, a.mut_rate, a.indel_rate,
                             a.chunk_losses, a.chunk_size)))


if __name__ == "__main__":
    main()
