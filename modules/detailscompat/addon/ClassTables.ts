import { DETAILS_ICON_COORDS } from "./DetailsIconLayout";
import { Details } from "./DetailsTypes";

interface ClassColor {
    r: number;
    g: number;
    b: number;
    colorStr?: string;
}

/** Colors as "ffRRGGBB" strings, which Details wraps in |c...|r for player names; it only adds the stock classes'. */
export function addColorStrings() {
    const colors: { [className: string]: ClassColor } = _G['RAID_CLASS_COLORS'];
    Object.keys(colors).forEach(className => {
        const color = colors[className];
        if (color.colorStr === undefined) {
            color.colorStr = format('ff%02x%02x%02x', toByte(color.r), toByte(color.g), toByte(color.b));
        }
    });
}

function toByte(value: number) {
    return Math.floor(value * 255 + 0.5);
}

/**
 * Gives Details the custom classes' colors, and every icon's place on the
 * class icon sheets rebuilt by tools/build_details_icons.py.
 */
export function addClassesToDetails(details: Details) {
    if (details.class_colors === undefined || details.class_coords === undefined) {
        return;
    }
    const colors: { [className: string]: ClassColor } = _G['RAID_CLASS_COLORS'];
    const classes: string[] = _G['CLASS_SORT_ORDER'];
    classes.forEach(className => {
        const color = colors[className];
        if (details.class_colors![className] === undefined && color !== undefined) {
            details.class_colors![className] = [color.r, color.g, color.b];
        }
    });
    Object.keys(DETAILS_ICON_COORDS).forEach(key => {
        details.class_coords![key] = [...DETAILS_ICON_COORDS[key]];
    });
}
