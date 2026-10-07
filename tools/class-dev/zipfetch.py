"""Extract chosen entries from a remote zip with HTTP range requests (via curl)."""
import struct, subprocess, sys, zlib, os
URL, OUT = sys.argv[1], sys.argv[2]
WANTED = [w.lower() for w in sys.argv[3:]]

def rng(start, end):
    return subprocess.run(['curl', '-sS', '-L', '-m', '600', '-r', f'{start}-{end}', URL], check=True, capture_output=True).stdout

size = int([l for l in subprocess.run(['curl', '-sSIL', URL], capture_output=True, text=True).stdout.splitlines()
            if l.lower().startswith('content-length') and l.split(':')[1].strip() != '0'][-1].split(':')[1])
tail = rng(size - 70000, size - 1)
eocd = tail.rfind(b'PK\x05\x06')
cd_size, cd_off = struct.unpack_from('<II', tail, eocd + 12)
if cd_off == 0xFFFFFFFF:  # zip64
    loc = tail.rfind(b'PK\x06\x07')
    z64_off = struct.unpack_from('<Q', tail, loc + 8)[0]
    z64 = rng(z64_off, z64_off + 100)
    cd_size, cd_off = struct.unpack_from('<QQ', z64, 40)
cd = rng(cd_off, cd_off + cd_size - 1)
p, entries = 0, []
while p < len(cd) and cd[p:p+4] == b'PK\x01\x02':
    method, = struct.unpack_from('<H', cd, p + 10)
    csize, usize = struct.unpack_from('<II', cd, p + 20)
    nlen, xlen, clen = struct.unpack_from('<HHH', cd, p + 28)
    loff, = struct.unpack_from('<I', cd, p + 42)
    name = cd[p+46:p+46+nlen].decode('utf8', 'replace')
    extra = cd[p+46+nlen:p+46+nlen+xlen]
    q = 0
    while q < len(extra):
        hid, hlen = struct.unpack_from('<HH', extra, q)
        if hid == 1:
            vals = list(struct.unpack_from('<' + 'Q' * (hlen // 8), extra, q + 4)); i = 0
            if usize == 0xFFFFFFFF: usize = vals[i]; i += 1
            if csize == 0xFFFFFFFF: csize = vals[i]; i += 1
            if loff == 0xFFFFFFFF: loff = vals[i]; i += 1
        q += 4 + hlen
    entries.append((name, method, csize, usize, loff))
    p += 46 + nlen + xlen + clen
print('entries', len(entries))
os.makedirs(OUT, exist_ok=True)
for name, method, csize, usize, loff in entries:
    base = name.replace('\\', '/').split('/')[-1].lower()
    if base not in WANTED:
        continue
    head = rng(loff, loff + 29)
    nlen, xlen = struct.unpack_from('<HH', head, 26)
    data = rng(loff + 30 + nlen + xlen, loff + 30 + nlen + xlen + csize - 1)
    raw = data if method == 0 else zlib.decompress(data, -15)
    open(os.path.join(OUT, name.replace('\\', '/').split('/')[-1]), 'wb').write(raw)
    print(name, usize, len(raw))
