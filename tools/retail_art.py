"""
Reading retail interface art and writing textures the 3.3.5 client accepts.

Shared by the asset tools of the modules that reuse retail UI art. Requires
Pillow 11.2.1 or later (DXT encoding).
"""
import io
import struct
from pathlib import Path

from PIL import Image

DEFAULT_RETAIL_INTERFACE = Path(r'C:\Allt\Spel\World of Warcraft\_retail_\BlizzardInterfaceArt\Interface')


def decode_blp(path: Path) -> Image.Image:
    data = path.read_bytes()
    if data[:4] != b'BLP2':
        raise ValueError(f'{path}: not a BLP2 file')
    compression, alpha_type = data[8], data[10]
    width, height = struct.unpack_from('<II', data, 12)
    offset = struct.unpack_from('<I', data, 20)[0]
    size = struct.unpack_from('<I', data, 84)[0]
    raw = data[offset:offset + size]
    if compression == 3:
        return Image.frombytes('RGBA', (width, height), raw, 'raw', 'BGRA')
    if compression == 2:
        bcn = {0: 1, 1: 2, 7: 3}[alpha_type]
        return Image.frombytes('RGBA', (width, height), raw, 'bcn', bcn)
    raise ValueError(f'{path}: unsupported BLP compression {compression}')


def dxt_payload(image: Image.Image, pixel_format: str) -> bytes:
    # DXT works on 4x4 blocks; the smallest mipmaps still take one block.
    block_size = (max(4, image.width), max(4, image.height))
    if block_size != image.size:
        image = image.resize(block_size)
    buffer = io.BytesIO()
    image.save(buffer, 'DDS', pixel_format=pixel_format)
    data = buffer.getvalue()
    # Older Pillow versions silently ignore pixel_format and write raw pixels.
    # Never label that payload as DXT in a BLP header.
    block_bytes = 8 if pixel_format == 'DXT1' else 16
    expected_size = ((image.width + 3) // 4) * ((image.height + 3) // 4) * block_bytes
    if (data[:4] != b'DDS ' or data[84:88] != pixel_format.encode('ascii')
            or len(data) != 128 + expected_size):
        raise RuntimeError(
            f'Pillow {Image.__version__} did not produce valid {pixel_format} data. '
            'Use Pillow 11.2.1 or later with DDS encoding support.')
    return data[128:]


def write_blp(image: Image.Image, path: Path, with_alpha: bool):
    """BLP2 with DXT5 (8-bit alpha) or DXT1 (opaque) data and a full mipmap chain."""
    pixel_format = 'DXT5' if with_alpha else 'DXT1'
    image = image.convert('RGBA')
    mips = []
    level = image
    while True:
        mips.append(dxt_payload(level, pixel_format))
        if level.width == 1 and level.height == 1:
            break
        level = level.resize((max(1, level.width // 2), max(1, level.height // 2)), Image.LANCZOS)
    header_size = 4 + 4 + 4 + 8 + 16 * 4 * 2 + 256 * 4
    offsets, sizes, cursor = [], [], header_size
    for mip in mips:
        offsets.append(cursor)
        sizes.append(len(mip))
        cursor += len(mip)
    header = b'BLP2' + struct.pack('<I', 1)
    header += struct.pack('<BBBB', 2, 8 if with_alpha else 0, 7 if with_alpha else 0, 1)
    header += struct.pack('<II', image.width, image.height)
    header += struct.pack('<16I', *(offsets + [0] * (16 - len(offsets))))
    header += struct.pack('<16I', *(sizes + [0] * (16 - len(sizes))))
    header += bytes(256 * 4)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + b''.join(mips))


def write_tga(image: Image.Image, path: Path):
    """Lossless 32-bit TGA: DXT's shared block colors speckle thin, antialiased UI lines."""
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert('RGBA').save(path, format='TGA', compression=None)


def ts_string(value: str) -> str:
    return "'" + value.replace('\\', '\\\\') + "'"
