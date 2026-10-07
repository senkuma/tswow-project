import { Color, growTooltipLines, TooltipLine } from "../model/TooltipLines";
import { WeaponState } from "../model/WeaponProgress";

type Side = 'Left' | 'Right';

/**
 * Writes the weapon's grown power into the item's own tooltip lines. The
 * client builds those from the item's template, which cannot change per
 * weapon; the server applies the same bonuses through the level enchantment.
 */
export function showGrownStats(tooltip: WoWAPI.GameTooltip, state: WeaponState) {
    const lines = readLines(tooltip);
    writeLines(tooltip, growTooltipLines(lines, state, name => _G[name]), lines.length);
    tooltip.Show();
}

function readLines(tooltip: WoWAPI.GameTooltip): TooltipLine[] {
    const lines: TooltipLine[] = [];
    for (let index = 1; index <= tooltip.NumLines(); index++) {
        const left = line(tooltip, 'Left', index);
        const right = line(tooltip, 'Right', index);
        lines.push({
            left: left.GetText() ?? '',
            leftColor: textColor(left),
            right: right.IsShown() ? right.GetText() : undefined,
            rightColor: textColor(right),
        });
    }
    return lines;
}

/**
 * Tooltips can only append lines, so the lines are rewritten in place below
 * the item's name, appending as many as are new. Lines left over when there
 * are fewer are blanked.
 */
function writeLines(tooltip: WoWAPI.GameTooltip, lines: TooltipLine[], shownCount: number) {
    for (let count = shownCount; count < lines.length; count++) {
        tooltip.AddLine(' ');
    }
    // The name keeps its larger header font, and growing never changes it.
    for (let index = 2; index <= Math.max(lines.length, shownCount); index++) {
        const content = lines[index - 1];
        const left = line(tooltip, 'Left', index);
        const right = line(tooltip, 'Right', index);
        left.SetText(content === undefined ? ' ' : content.left);
        if (content !== undefined) {
            setColor(left, content.leftColor);
        }
        if (content !== undefined && content.right !== undefined) {
            right.SetText(content.right);
            setColor(right, content.rightColor ?? content.leftColor);
            right.Show();
        } else {
            right.Hide();
        }
    }
}

function textColor(text: WoWAPI.FontString): Color {
    const [r, g, b] = text.GetTextColor();
    return [r, g, b];
}

function setColor(text: WoWAPI.FontString, [r, g, b]: Color) {
    text.SetTextColor(r, g, b);
}

function line(tooltip: WoWAPI.GameTooltip, side: Side, index: number): WoWAPI.FontString {
    return _G[`${tooltip.GetName()}Text${side}${index}`];
}
