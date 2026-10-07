"""
Rebuilds the Details! addon's small class icon sheets for this server's classes.

    py modules/detailscompat/tools/build_details_icons.py [client folder]

Details draws class icons from its own 4x4 sheets, which have no cells for
custom classes, and some of its windows look icons up with the client's
CLASS_ICON_TCOORDS, which TSWoW rewrites to an 8x8 layout that includes the
custom classes. This tool redraws the four small sheets (normal, alpha and
their black and white versions) in that 8x8 layout: Details' own icons for
the stock classes, each custom class's module icon, and Details' other icons
(pets, enemies, factions...) in the free cells. It generates
addon/DetailsIconLayout.ts, which the addon gives Details as its icon
coordinates. Details' original sheets are kept in images/tswow-original.

Run it again after adding a class (TSWoW then moves classes in CLASS_ICON_TCOORDS).
"""
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

MODULE = Path(__file__).resolve().parents[1]
INSTALL = MODULE.parents[1]
sys.path.insert(0, str(INSTALL / 'tools'))
from retail_art import write_tga  # noqa: E402

DEFAULT_CLIENT = Path(r'C:\Allt\WoW335')
CONSTANTS_LUA = INSTALL / 'modules' / 'default' / 'datasets' / 'dataset' / 'luaxml' / 'Interface' / 'FrameXML' / 'Constants.lua'
GENERATED_TS = MODULE / 'addon' / 'DetailsIconLayout.ts'

VARIANTS = ['classes_small', 'classes_small_alpha', 'classes_small_bw', 'classes_small_alpha_bw']
ORIGINAL_SIZE = 128
GRID = 8
CELL = 32
SHEET_SIZE = GRID * CELL

# Each custom class's icon, as its module gives it to the character creation screen.
CUSTOM_CLASS_ICONS = {
    'BATTLEMAGE': INSTALL / 'modules' / 'battlemage' / 'images' / 'battle-mage-icon.png',
    'MARAUDER': INSTALL / 'modules' / 'marauder' / 'images' / 'marauder-icon.png',
    'MONK': INSTALL / 'modules' / 'monk' / 'images' / 'monk-icon.png',
    'MOUNTAINKING': INSTALL / 'modules' / 'mountainking' / 'images' / 'mountain-king-icon.png',
    'PLAGUEDOCTOR': INSTALL / 'modules' / 'plaguedoctor' / 'images' / 'plague-doctor-icon.png',
}

# Where Details' original sheets hold each icon (its default profile's class_coords).
DETAILS_COORDS = {
    'WARRIOR': (0, 0.25, 0, 0.25),
    'MAGE': (0.25, 0.49609375, 0, 0.25),
    'ROGUE': (0.49609375, 0.7421875, 0, 0.25),
    'DRUID': (0.7421875, 0.98828125, 0, 0.25),
    'HUNTER': (0, 0.25, 0.25, 0.5),
    'SHAMAN': (0.25, 0.49609375, 0.25, 0.5),
    'PRIEST': (0.49609375, 0.7421875, 0.25, 0.5),
    'WARLOCK': (0.7421875, 0.98828125, 0.25, 0.5),
    'PALADIN': (0, 0.25, 0.5, 0.75),
    'DEATHKNIGHT': (0.25, 0.5, 0.5, 0.75),
    'ENEMY': (0, 0.25, 0.75, 1),
    'MONSTER': (0, 0.25, 0.75, 1),
    'PET': (0.25, 0.49609375, 0.75, 1),
    'UNKNOW': (0.5, 0.75, 0.75, 1),
    'UNGROUPPLAYER': (0.5, 0.75, 0.75, 1),
    'Alliance': (0.49609375, 0.7421875, 0.75, 1),
    'Horde': (0.7421875, 0.98828125, 0.75, 1),
}


def class_icon_coords(constants_lua: Path):
    """CLASS_ICON_TCOORDS as TSWoW wrote it into FrameXML's Constants.lua."""
    text = constants_lua.read_text(encoding='utf-8')
    block = re.search(r'CLASS_ICON_TCOORDS\s*=\s*\{(.*?)\n\};', text, re.S)
    if block is None:
        raise ValueError(f'{constants_lua}: no CLASS_ICON_TCOORDS table')
    coords = {}
    for name, values in re.findall(r'\["(\w+)"\]\s*=\s*\{([^}]*)\}', block.group(1)):
        coords[name] = tuple(float(value) for value in values.split(','))
    return coords


def cell_of(coords):
    left, _, top, _ = coords
    return round(left * GRID), round(top * GRID)


def layout(class_coords):
    """Every icon's cell: classes where CLASS_ICON_TCOORDS puts them, Details' other icons in free cells."""
    cells = {name: cell_of(coords) for name, coords in class_coords.items()}
    used = set(cells.values())
    free = [(x, y) for y in range(GRID) for x in range(GRID) if (x, y) not in used]
    others = [name for name in DETAILS_COORDS if name not in cells]
    if len(others) > len(free):
        raise ValueError('the icon sheet has no room for all of Details\' icons')
    cells.update(zip(others, free))
    missing = [name for name in cells if name not in DETAILS_COORDS and name not in CUSTOM_CLASS_ICONS]
    if missing:
        raise ValueError(f'no icon for classes {missing}; add them to CUSTOM_CLASS_ICONS')
    return cells


def original_sheets(images: Path):
    """Details' own sheets, saved once before the first rebuild replaces them."""
    backup = images / 'tswow-original'
    backup.mkdir(exist_ok=True)
    for variant in VARIANTS:
        if not (backup / f'{variant}.tga').exists():
            shutil.copy2(images / f'{variant}.tga', backup / f'{variant}.tga')
    return {variant: Image.open(backup / f'{variant}.tga').convert('RGBA') for variant in VARIANTS}


def details_icon(sheet: Image.Image, coords):
    left, right, top, bottom = (round(value * ORIGINAL_SIZE) for value in coords)
    return sheet.crop((left, top, right, bottom)).resize((CELL, CELL), Image.LANCZOS)


def custom_icon(path: Path, variant: str):
    icon = Image.open(path).convert('RGBA').resize((CELL, CELL), Image.LANCZOS)
    if variant.endswith('_bw'):
        gray = icon.convert('L')
        icon = Image.merge('RGBA', (gray, gray, gray, icon.getchannel('A')))
    return icon


def build_sheet(variant: str, original: Image.Image, cells):
    # The opaque sheets have a black background; the alpha ones are transparent.
    background = (0, 0, 0, 0) if '_alpha' in variant else (0, 0, 0, 255)
    sheet = Image.new('RGBA', (SHEET_SIZE, SHEET_SIZE), background)
    for name, (x, y) in cells.items():
        icon = custom_icon(CUSTOM_CLASS_ICONS[name], variant) if name in CUSTOM_CLASS_ICONS \
            else details_icon(original, DETAILS_COORDS[name])
        sheet.alpha_composite(icon, (x * CELL, y * CELL))
    return sheet


def write_typescript(cells):
    lines = [
        '// Generated by tools/build_details_icons.py; do not edit.',
        '',
        '/** Where the rebuilt Details class icon sheets hold each icon: left, right, top, bottom. */',
        'export const DETAILS_ICON_COORDS: { [key: string]: [number, number, number, number] } = {',
    ]
    for name, (x, y) in sorted(cells.items()):
        lines.append(f"    ['{name}']: [{x / GRID:g}, {(x + 1) / GRID:g}, {y / GRID:g}, {(y + 1) / GRID:g}],")
    lines += ['};', '']
    GENERATED_TS.write_text('\n'.join(lines), encoding='utf-8', newline='\n')


def main():
    client = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CLIENT
    images = client / 'Interface' / 'AddOns' / 'Details' / 'images'
    cells = layout(class_icon_coords(CONSTANTS_LUA))
    originals = original_sheets(images)
    for variant in VARIANTS:
        write_tga(build_sheet(variant, originals[variant], cells), images / f'{variant}.tga')
    write_typescript(cells)
    for name, cell in sorted(cells.items(), key=lambda item: (item[1][1], item[1][0])):
        print(f'{name}: cell {cell}')


if __name__ == '__main__':
    main()
