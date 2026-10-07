"""
Builds the talent UI's client textures from the retail interface art export.

    py modules/talentui/tools/build_assets.py [retail Interface folder]

Retail talent art is too new for the 3.3.5 client (uncompressed BLP2
variants, 2048px atlases with hundreds of unused pieces), so this tool:
  - decodes the retail BLPs,
  - packs the frame pieces the UI uses into one small atlas,
  - crops every class's specialization backgrounds to 1024x512,
  - writes the parts as a lossless 32-bit TGA to preserve thin borders,
  - writes backgrounds as DXT1 BLP2 files with mipmaps, which 3.3.5 reads,
  - generates addon/ui/TalentArt.ts with the atlas coordinates and
    background paths, so the addon and the textures cannot drift apart.

Requires Pillow 11.2.1 or later (DXT encoding).
"""
import sys
from pathlib import Path

from PIL import Image

MODULE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE.parents[1] / 'tools'))
from retail_art import DEFAULT_RETAIL_INTERFACE, decode_blp, dxt_payload, write_blp, write_tga, ts_string  # noqa: E402

TEXTURE_DIR = MODULE / 'assets' / 'Interface' / 'TalentUI'
GENERATED_TS = MODULE / 'addon' / 'ui' / 'TalentArt.ts'
CLIENT_TEXTURE_DIR = 'Interface\\TalentUI'

PARTS_FILENAME = 'Parts.tga'

ATLAS_SIZE = (512, 512)
NODE_CELL = 64
# Transparent space around every piece, so texture filtering and mipmaps
# never pull a neighbor's pixels into a piece's edges.
GUTTER = 8
TALENTS = 'TALENTFRAME/Talents.BLP'
FRAME = 'FrameGeneral/UIFrameMetal2x.BLP'
FRAME_HORIZONTAL = 'FrameGeneral/UIFrameMetalHorizontal2x.BLP'
FRAME_VERTICAL = 'FrameGeneral/UIFrameMetalVertical2x.BLP'

# Node frames: source, crop box (x, y, w, h) and atlas position; stored at NODE_CELL size.
NODE_PIECES = {
    'squareLocked': (TALENTS, (1872, 1, 78, 79)),
    'squareAvailable': (TALENTS, (1606, 84, 78, 78)),
    'squareLearned': (TALENTS, (1684, 84, 78, 78)),
    # Starts below the dark panel that ends at row 567 of the retail atlas.
    'circleLocked': (TALENTS, (218, 568, 53, 52)),
    'circleAvailable': (TALENTS, (218, 620, 53, 52)),
    'circleLearned': (TALENTS, (1841, 113, 51, 51)),
}
UNDO_PIECE = (TALENTS, (1896, 117, 38, 36))

# The modern retail window frame (2x art, shown at half size). Every rail has
# the same profile: it starts at its outer line and its shadow trails right
# and down, 12px in all. The frame's edge is placed 6px into the rail, so
# `outset` is how far (display pixels) a piece reaches past the frame edge
# on its anchored side: (crop end - rail start - 6) / 2.
FRAME_SCALE = 0.5
FRAME_PIECES = {
    # Top corners carry the stone title bar (rows 34-85) and the side rails down to row 151.
    # The source piece is a short complete title bar; its right-hand rail (from x 288) is left out.
    'frameTopLeft': (FRAME, (25, 34, 250, 118), (0, 0)),
    'frameTopRight': (FRAME, (304, 34, 148, 118), (3, 0)),
    # The bottom corners are the two halves of one U-shaped piece; its rails start at x 177 and 268, y 202.
    'frameBottomLeft': (FRAME, (177, 152, 51, 62), (0, 3)),
    'frameBottomRight': (FRAME, (228, 152, 54, 62), (4, 3)),
    'frameTitle': (FRAME_HORIZONTAL, (0, 34, 64, 52), (0, 0)),
    'frameBottom': (FRAME_HORIZONTAL, (0, 202, 64, 12), (0, 3)),
    'frameLeft': (FRAME_VERTICAL, (25, 0, 13, 32), (0, 0)),
    'frameRight': (FRAME_VERTICAL, (288, 0, 14, 32), (4, 0)),
}
# Height of the title bar's opaque stone, in display pixels (rows 34-76 of the art).
TITLE_BAR_HEIGHT = 21


def atlas_layout():
    """Positions every piece in the atlas, row by row, with gutters; returns name -> (source, crop, cell, scale)."""
    pieces = {}
    x, y, row_height = GUTTER, GUTTER, 0

    def place(name, source, crop, size, scale):
        nonlocal x, y, row_height
        if x + size[0] + GUTTER > ATLAS_SIZE[0]:
            x, y, row_height = GUTTER, y + row_height + GUTTER, 0
        pieces[name] = (source, crop, (x, y) + size, scale)
        x += size[0] + GUTTER
        row_height = max(row_height, size[1])

    for name, (source, crop, _) in FRAME_PIECES.items():
        place(name, source, crop, crop[2:], FRAME_SCALE)
    for name, (source, crop) in NODE_PIECES.items():
        place(name, source, crop, (NODE_CELL, NODE_CELL), 1)
    place('undo', *UNDO_PIECE, UNDO_PIECE[1][2:], 1)
    if y + row_height + GUTTER > ATLAS_SIZE[1]:
        raise ValueError('atlas pieces do not fit')
    return pieces


RETAIL_CLASSES = ['DeathKnight', 'Druid', 'Hunter', 'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman',
                  'Warlock', 'Warrior']
# Retail stacks each class's spec backgrounds in its files at this size.
SPEC_ART_SIZE = (1614, 776)
BACKGROUND_SIZE = (1024, 512)


# ---------------------------------------------------------------- textures

def build_atlas(interface: Path, layout):
    atlas = Image.new('RGBA', ATLAS_SIZE, (0, 0, 0, 0))
    sources = {}
    for source, (x, y, w, h), (cx, cy, cw, ch), _ in layout.values():
        if source not in sources:
            sources[source] = decode_blp(interface / source)
        piece = sources[source].crop((x, y, x + w, y + h))
        if piece.size != (cw, ch):
            piece = piece.resize((cw, ch), Image.LANCZOS)
        atlas.alpha_composite(piece, (cx, cy))
    write_tga(atlas, TEXTURE_DIR / PARTS_FILENAME)


def spec_regions(image: Image.Image):
    """The spec backgrounds in a class file, top to bottom: 1614x776 images stacked from the top."""
    used = image.getchannel('A').point(lambda value: 255 if value > 8 else 0).getbbox()
    count = round(used[3] / SPEC_ART_SIZE[1])
    return [(0, index * SPEC_ART_SIZE[1], SPEC_ART_SIZE[0], (index + 1) * SPEC_ART_SIZE[1]) for index in range(count)]


def build_backgrounds(interface: Path):
    backgrounds = {}
    for retail_class in RETAIL_CLASSES:
        paths = []
        for part in (1, 2):
            source = interface / 'TALENTFRAME' / f'TalentsClassBackground{retail_class}{part}.BLP'
            image = decode_blp(source)
            for box in spec_regions(image):
                index = len(paths) + 1
                write_blp(image.crop(box).resize(BACKGROUND_SIZE, Image.LANCZOS), TEXTURE_DIR / 'Backgrounds' / f'{retail_class}{index}.blp',
                          with_alpha=False)
                paths.append(f'{CLIENT_TEXTURE_DIR}\\Backgrounds\\{retail_class}{index}')
        backgrounds[retail_class] = paths
    return backgrounds


# ---------------------------------------------------------------- generated TypeScript

def write_typescript(layout, backgrounds):
    width, height = ATLAS_SIZE
    lines = [
        '// Generated by tools/build_assets.py from the retail interface art; do not edit.',
        '',
        '/**',
        ' * A piece of the parts atlas: its display size and texture coordinates',
        ' * (inset half a texel). Frame pieces also give how far they reach past',
        ' * the frame edge on the sides they are anchored to.',
        ' */',
        'export interface AtlasPiece {',
        '    width: number;',
        '    height: number;',
        '    left: number;',
        '    right: number;',
        '    top: number;',
        '    bottom: number;',
        '    outsetX: number;',
        '    outsetY: number;',
        '}',
        '',
        f'export const PARTS_TEXTURE = {ts_string(CLIENT_TEXTURE_DIR + chr(92) + PARTS_FILENAME)};',
        '',
        'export const ATLAS = {',
    ]
    for name, (_, _, (x, y, w, h), scale) in layout.items():
        outset_x, outset_y = FRAME_PIECES[name][2] if name in FRAME_PIECES else (0, 0)
        lines.append(
            f'    {name}: {{ width: {w * scale:g}, height: {h * scale:g},'
            f' left: {(x + 0.5) / width:.6f}, right: {(x + w - 0.5) / width:.6f},'
            f' top: {(y + 0.5) / height:.6f}, bottom: {(y + h - 0.5) / height:.6f},'
            f' outsetX: {outset_x:g}, outsetY: {outset_y:g} }},')
    lines += [
        '};',
        '',
        '/** Height of the title bar of the frame. */',
        f'export const TITLE_BAR_HEIGHT = {TITLE_BAR_HEIGHT};',
        '',
        '/** Retail specialization backgrounds of each class, in retail specialization order. */',
        'export const RETAIL_SPEC_BACKGROUNDS = {',
    ]
    for retail_class, paths in backgrounds.items():
        lines.append(f'    {retail_class}: [{", ".join(ts_string(path) for path in paths)}],')
    lines += ['};', '', 'export type RetailClass = keyof typeof RETAIL_SPEC_BACKGROUNDS;', '']
    GENERATED_TS.write_text('\n'.join(lines), encoding='utf-8', newline='\n')


def main():
    interface = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_RETAIL_INTERFACE
    # Fail before changing assets if this Python cannot encode the backgrounds.
    dxt_payload(Image.new('RGBA', (4, 4)), 'DXT1')
    layout = atlas_layout()
    build_atlas(interface, layout)
    backgrounds = build_backgrounds(interface)
    write_typescript(layout, backgrounds)
    for retail_class, paths in backgrounds.items():
        print(f'{retail_class}: {len(paths)} backgrounds')


if __name__ == '__main__':
    main()
