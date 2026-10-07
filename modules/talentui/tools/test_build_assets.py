"""Regression checks for client texture encoding; no retail art is required."""
import io
import math
import struct
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

import build_assets


class AtlasEncodingTests(unittest.TestCase):
    def test_atlas_preserves_colored_ring_and_alpha_in_uncompressed_tga(self):
        source = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        for y in range(16):
            for x in range(16):
                distance = math.hypot(x - 7.5, y - 7.5)
                alpha = 255 if 4.5 <= distance <= 6 else 96 if 4 <= distance <= 6.5 else 0
                if alpha:
                    color = (32, 250, 48) if x < 8 else (255, 224, 16)
                    source.putpixel((x, y), color + (alpha,))
        expected = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
        expected.paste(source, (8, 8))
        layout = {'ring': ('fixture.blp', (0, 0, 16, 16), (8, 8, 16, 16), 1)}

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            with patch.object(build_assets, 'TEXTURE_DIR', output), \
                    patch.object(build_assets, 'ATLAS_SIZE', (32, 32)), \
                    patch.object(build_assets, 'decode_blp', return_value=source):
                build_assets.build_atlas(Path('unused-retail-directory'), layout)

            path = output / 'Parts.tga'
            header = path.read_bytes()[:18]
            self.assertEqual(header[1], 0, 'TGA must not use a color palette')
            self.assertEqual(header[2], 2, 'Client atlas must use uncompressed true-color TGA')
            self.assertEqual(struct.unpack_from('<HH', header, 12), (32, 32))
            self.assertEqual(header[16], 32)
            self.assertEqual(header[17] & 0x0F, 8, 'All eight alpha bits must be retained')
            with Image.open(path) as actual:
                self.assertEqual(actual.mode, 'RGBA')
                self.assertEqual(actual.tobytes(), expected.tobytes())


class DdsValidationTests(unittest.TestCase):
    @staticmethod
    def fake_dds(fourcc, payload_size):
        header = bytearray(128)
        header[:4] = b'DDS '
        struct.pack_into('<I', header, 4, 124)
        header[84:88] = fourcc
        return bytes(header) + bytes(payload_size)

    def test_rejects_silently_uncompressed_or_wrong_codec_dds(self):
        image = Image.new('RGBA', (8, 8))
        for fourcc in (bytes(4), b'DXT3'):
            with self.subTest(fourcc=fourcc):
                data = self.fake_dds(fourcc, 64)
                with patch.object(Image.Image, 'save', side_effect=lambda buffer, *args, **kwargs: buffer.write(data)):
                    with self.assertRaises(RuntimeError):
                        build_assets.dxt_payload(image, 'DXT5')

    def test_rejects_truncated_or_oversized_compressed_payload(self):
        image = Image.new('RGBA', (8, 8))
        for size in (63, 65):
            with self.subTest(payload_size=size):
                data = self.fake_dds(b'DXT5', size)
                with patch.object(Image.Image, 'save', side_effect=lambda buffer, *args, **kwargs: buffer.write(data)):
                    with self.assertRaises(RuntimeError):
                        build_assets.dxt_payload(image, 'DXT5')

    def test_supported_encoder_produces_valid_dxt_payloads_including_smallest_mip(self):
        probe = io.BytesIO()
        Image.new('RGBA', (4, 4)).save(probe, 'DDS', pixel_format='DXT5')
        if probe.getvalue()[84:88] != b'DXT5':
            self.skipTest('Installed Pillow lacks DDS compression; fail-closed behavior is tested separately')

        for pixel_format, block_bytes in (('DXT1', 8), ('DXT5', 16)):
            for size in ((8, 8), (1, 1)):
                with self.subTest(pixel_format=pixel_format, size=size):
                    image = Image.new('RGBA', size, (64, 192, 32, 160))
                    payload = build_assets.dxt_payload(image, pixel_format)
                    expected_bytes = max(1, (size[0] + 3) // 4) * max(1, (size[1] + 3) // 4) * block_bytes
                    self.assertEqual(len(payload), expected_bytes)


if __name__ == '__main__':
    unittest.main()
