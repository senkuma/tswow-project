"""
Builds the growing weapon tooltip and level-up textures from the retail interface art export.

    py modules/growingweapons/tools/build_assets.py [retail Interface folder]

The look borrows from Legion's artifact weapons: the gold glass ring of an
artifact trait holds the weapon level, the retail experience bar (in its gold
artifact power color) shows progress, and the Monk artifact backdrop and its
bamboo rod frame the panel. Level-ups reuse the gold line and glow of the
retail level-up banner.

Pieces are cropped from the retail atlases, the bars are rebuilt at their
display proportions (pointed caps kept, middle stretched), and everything is
packed into one lossless TGA atlas; the backdrop is a separate DXT1 BLP.
Generates addon/ui/WeaponArt.ts with the atlas coordinates, so the addon and
the textures cannot drift apart.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

MODULE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE.parents[1] / 'tools'))
from retail_art import DEFAULT_RETAIL_INTERFACE, decode_blp, dxt_payload, write_blp, write_tga, ts_string  # noqa: E402

TEXTURE_DIR = MODULE / 'assets' / 'Interface' / 'GrowingWeapons'
GENERATED_TS = MODULE / 'addon' / 'ui' / 'WeaponArt.ts'
CLIENT_TEXTURE_DIR = 'Interface\\GrowingWeapons'
PARTS_FILENAME = 'Parts.tga'
BACKDROP_FILENAME = 'Backdrop.blp'

ARTIFACTS = 'Artifacts/Artifacts.BLP'
MONK_ARTIFACT = 'Artifacts/ArtifactUIMonk.BLP'
EXPERIENCE_BAR = 'HUD/UIExperienceBar2x.BLP'
LEVEL_UP = 'LEVELUP/LEVELUPTEX.BLP'

ATLAS_SIZE = (512, 512)
# Transparent space around every piece, so filtering and mipmaps never pull
# a neighbor's pixels into a piece's edges.
GUTTER = 8
# Atlas pieces are stored at twice their display size.
DISPLAY_SCALE = 0.5

# The gold glass ring of an artifact trait, centered in its crop; its opaque
# inner edge is 38px from the center, and the badge disc fills it.
RING_CROP = (625, 577, 108, 108)
RING_INNER_RADIUS = 38
BADGE_SIZE = (88, 88)
BADGE_DISC_CENTER = (20, 58, 50)
BADGE_DISC_EDGE = (4, 18, 16)

BAMBOO_CROP = (196, 640, 508, 30)
BAMBOO_SIZE = (488, 28)

# Experience bar rows of the 2x art: the gold artifact power fill, the dark
# track and the ticked frame. The frame is centered on the fill, as in retail.
BAR_FILL_CROP = (0, 1, 1126, 19)
BAR_TRACK_CROP = (0, 21, 1126, 19)
BAR_FRAME_CROP = (0, 200, 1134, 28)
BAR_CAP_WIDTH = 24
BAR_SIZE = (336, 20)

GOLD_LINE_CROP = (11, 15, 397, 4)
GLOW_CROP = (290, 252, 216, 113)

# The dragon relief of the Monk artifact backdrop, at about the panel's proportions.
BACKDROP_CROP = (0, 90, 898, 440)
BACKDROP_SIZE = (512, 256)


def crop(image: Image.Image, box):
    x, y, w, h = box
    return image.crop((x, y, x + w, y + h))


def badge(artifacts: Image.Image) -> Image.Image:
    """The ring around a dark jade disc; the 3.3.5 client cannot mask a texture into a circle itself."""
    ring = crop(artifacts, RING_CROP)
    badge_image = Image.new('RGBA', ring.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge_image)
    center = ring.width / 2
    # Concentric circles from the edge inwards make a radial gradient.
    steps = RING_INNER_RADIUS + 2
    for step in range(steps):
        radius = RING_INNER_RADIUS + 1 - step
        t = step / (steps - 1)
        color = tuple(round(edge + (inner - edge) * t) for edge, inner in zip(BADGE_DISC_EDGE, BADGE_DISC_CENTER))
        draw.ellipse((center - radius, center - radius, center + radius, center + radius), fill=color + (255,))
    badge_image.alpha_composite(ring)
    return badge_image.resize(BADGE_SIZE, Image.LANCZOS)


def three_slice(piece: Image.Image, height: int, width: int, cap_width: int) -> Image.Image:
    """Scales a horizontal bar to `height`, keeping its end caps' proportions and stretching the middle to `width`."""
    cap = max(1, round(cap_width * height / piece.height))
    left = piece.crop((0, 0, cap_width, piece.height)).resize((cap, height), Image.LANCZOS)
    right = piece.crop((piece.width - cap_width, 0, piece.width, piece.height)).resize((cap, height), Image.LANCZOS)
    middle = piece.crop((cap_width, 0, piece.width - cap_width, piece.height)) \
        .resize((width - 2 * cap, height), Image.LANCZOS)
    bar = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    bar.paste(left, (0, 0))
    bar.paste(middle, (cap, 0))
    bar.paste(right, (width - cap, 0))
    return bar


def bar_frame(bar: Image.Image) -> Image.Image:
    """The frame at the fill's scale, so its border sits where it does around the retail bar."""
    scale = BAR_SIZE[1] / BAR_FILL_CROP[3]
    width = round(BAR_SIZE[0] + (BAR_FRAME_CROP[2] - BAR_FILL_CROP[2]) * scale)
    return three_slice(crop(bar, BAR_FRAME_CROP), round(BAR_FRAME_CROP[3] * scale), width, BAR_CAP_WIDTH)


def build_pieces(interface: Path):
    artifacts = decode_blp(interface / ARTIFACTS)
    monk = decode_blp(interface / MONK_ARTIFACT)
    bar = decode_blp(interface / EXPERIENCE_BAR)
    level_up = decode_blp(interface / LEVEL_UP)
    pieces = {
        'badge': badge(artifacts),
        'bamboo': crop(monk, BAMBOO_CROP).resize(BAMBOO_SIZE, Image.LANCZOS),
        'barFill': three_slice(crop(bar, BAR_FILL_CROP), BAR_SIZE[1], BAR_SIZE[0], BAR_CAP_WIDTH),
        'barTrack': three_slice(crop(bar, BAR_TRACK_CROP), BAR_SIZE[1], BAR_SIZE[0], BAR_CAP_WIDTH),
        'barFrame': bar_frame(bar),
        'goldLine': crop(level_up, GOLD_LINE_CROP),
        'glow': crop(level_up, GLOW_CROP),
    }
    backdrop = crop(monk, BACKDROP_CROP).resize(BACKDROP_SIZE, Image.LANCZOS)
    return pieces, backdrop


def pack(pieces):
    """Shelf-packs the pieces, tallest first, with gutters; returns name -> (x, y, w, h)."""
    layout = {}
    x, y, shelf_height = GUTTER, GUTTER, 0
    for name, image in sorted(pieces.items(), key=lambda item: -item[1].height):
        w, h = image.size
        if x + w + GUTTER > ATLAS_SIZE[0]:
            x, y, shelf_height = GUTTER, y + shelf_height + GUTTER, 0
        if y + h + GUTTER > ATLAS_SIZE[1]:
            raise ValueError(f'atlas pieces do not fit; {name} overflows')
        layout[name] = (x, y, w, h)
        x += w + GUTTER
        shelf_height = max(shelf_height, h)
    return layout


def write_atlas(pieces, layout):
    atlas = Image.new('RGBA', ATLAS_SIZE, (0, 0, 0, 0))
    for name, (x, y, _, _) in layout.items():
        atlas.alpha_composite(pieces[name], (x, y))
    write_tga(atlas, TEXTURE_DIR / PARTS_FILENAME)
    return atlas


def write_typescript(layout):
    width, height = ATLAS_SIZE
    lines = [
        '// Generated by tools/build_assets.py from the retail interface art; do not edit.',
        '',
        '/** A piece of the parts atlas: its display size and texture coordinates (inset half a texel). */',
        'export interface AtlasPiece {',
        '    width: number;',
        '    height: number;',
        '    left: number;',
        '    right: number;',
        '    top: number;',
        '    bottom: number;',
        '}',
        '',
        f'export const PARTS_TEXTURE = {ts_string(CLIENT_TEXTURE_DIR + chr(92) + PARTS_FILENAME)};',
        f'export const BACKDROP_TEXTURE = {ts_string(CLIENT_TEXTURE_DIR + chr(92) + Path(BACKDROP_FILENAME).stem)};',
        '',
        'export const ATLAS = {',
    ]
    for name, (x, y, w, h) in sorted(layout.items()):
        lines.append(
            f'    {name}: {{ width: {w * DISPLAY_SCALE:g}, height: {h * DISPLAY_SCALE:g},'
            f' left: {(x + 0.5) / width:.6f}, right: {(x + w - 0.5) / width:.6f},'
            f' top: {(y + 0.5) / height:.6f}, bottom: {(y + h - 0.5) / height:.6f} }},')
    lines += ['};', '']
    GENERATED_TS.write_text('\n'.join(lines), encoding='utf-8', newline='\n')


def main():
    interface = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_RETAIL_INTERFACE
    # Fail before changing assets if this Python cannot encode the backdrop.
    dxt_payload(Image.new('RGBA', (4, 4)), 'DXT1')
    pieces, backdrop = build_pieces(interface)
    layout = pack(pieces)
    write_atlas(pieces, layout)
    write_blp(backdrop, TEXTURE_DIR / BACKDROP_FILENAME, with_alpha=False)
    write_typescript(layout)
    for name, (x, y, w, h) in layout.items():
        print(f'{name}: {w}x{h} at {x},{y}')


if __name__ == '__main__':
    main()
