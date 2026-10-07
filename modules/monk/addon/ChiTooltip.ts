import { CHI_ART, CHI_TEXTURE, CHI_TEXTURE_SIZE } from "./ChiArt";
import { CHI_COSTS } from "./ChiSpells";

/**
 * Shows a Chi spender's cost in its tooltip as Chi orbs, where a spell's
 * power cost goes: the left of the line under its name, which spenders leave
 * empty as they cost no power. Spells with nothing there (no cost and no
 * range) get a line of their own.
 */
const SPELL_TOOLTIPS = ['GameTooltip', 'ItemRefTooltip'];
const ORB_SIZE = 16;
const COST_LINE = 2;

type Side = 'Left' | 'Right';

interface LineText {
    text: string;
    color: [number, number, number];
}

interface TooltipLine {
    left: LineText;
    right?: LineText;
}

/** GameTooltip:GetSpell and the spell hook, which TSWoW's declarations type wrongly or leave out. */
interface SpellTooltip {
    GetName(): string;
    NumLines(): number;
    ClearLines(): void;
    AddLine(text: string, r?: number, g?: number, b?: number, wrap?: boolean): void;
    AddDoubleLine(left: string, right: string, leftR: number, leftG: number, leftB: number,
        rightR: number, rightG: number, rightB: number): void;
    Show(): void;
    GetSpell(): LuaMultiReturn<[string | undefined, string | undefined, number | undefined]>;
    HookScript(script: 'OnTooltipSetSpell', handler: (tooltip: SpellTooltip) => void): void;
}

export function showChiCostsInTooltips() {
    const costByName = chiCostsByName();
    SPELL_TOOLTIPS.forEach(name => {
        const tooltip: SpellTooltip | undefined = _G[name];
        tooltip?.HookScript('OnTooltipSetSpell', () => {
            const [spellName, , spellId] = tooltip.GetSpell();
            // 3.3.5 clients may not report the id; spender names are unique.
            const cost = (spellId !== undefined ? CHI_COSTS[spellId] : undefined)
                ?? (spellName !== undefined ? costByName[spellName] : undefined);
            if (cost !== undefined) {
                showCost(tooltip, orbs(cost));
            }
        });
    });
}

function chiCostsByName() {
    const byName: { [name: string]: number } = {};
    Object.keys(CHI_COSTS).forEach(key => {
        const spellId = Number(key);
        const [name] = GetSpellInfo(spellId);
        if (name !== undefined) {
            byName[name] = CHI_COSTS[spellId];
        }
    });
    return byName;
}

function orbs(count: number) {
    const { width, height } = CHI_TEXTURE_SIZE;
    const orb = CHI_ART.orb;
    // The atlas coordinates are inset half a texel; texture markup takes whole pixels.
    const markup = `|T${CHI_TEXTURE}:${ORB_SIZE}:${ORB_SIZE}:0:0:${width}:${height}:`
        + `${Math.floor(orb.left * width)}:${Math.ceil(orb.right * width)}:`
        + `${Math.floor(orb.top * height)}:${Math.ceil(orb.bottom * height)}|t`;
    let text = '';
    for (let index = 0; index < count; index++) {
        text += markup;
    }
    return text;
}

function showCost(tooltip: SpellTooltip, text: string) {
    const costLine = line(tooltip, 'Left', COST_LINE);
    if (tooltip.NumLines() >= COST_LINE && (costLine.GetText() ?? '') === '') {
        costLine.SetText(text);
        costLine.Show();
    } else {
        insertLineAfterName(tooltip, text);
    }
    tooltip.Show();
}

/**
 * Tooltips only append lines, and each line keeps the word wrap it was added
 * with, which addons can neither read nor change: moving text down a line
 * would leave the description unwrapped. So the tooltip is rebuilt, wrapping
 * every line without right-hand text as the client wraps descriptions.
 */
function insertLineAfterName(tooltip: SpellTooltip, text: string) {
    const lines = readLines(tooltip);
    tooltip.ClearLines();
    lines.forEach((content, index) => {
        addLine(tooltip, content);
        if (index === 0) {
            tooltip.AddLine(text);
        }
    });
}

function readLines(tooltip: SpellTooltip): TooltipLine[] {
    const lines: TooltipLine[] = [];
    for (let index = 1; index <= tooltip.NumLines(); index++) {
        const right = line(tooltip, 'Right', index);
        lines.push({
            left: lineText(line(tooltip, 'Left', index)),
            right: right.IsShown() ? lineText(right) : undefined,
        });
    }
    return lines;
}

function lineText(fontString: WoWAPI.FontString): LineText {
    const [r, g, b] = fontString.GetTextColor();
    return { text: fontString.GetText() ?? '', color: [r, g, b] };
}

function addLine(tooltip: SpellTooltip, { left, right }: TooltipLine) {
    if (right === undefined) {
        tooltip.AddLine(left.text, left.color[0], left.color[1], left.color[2], true);
    } else {
        tooltip.AddDoubleLine(left.text, right.text, left.color[0], left.color[1], left.color[2],
            right.color[0], right.color[1], right.color[2]);
    }
}

function line(tooltip: SpellTooltip, side: Side, index: number): WoWAPI.FontString {
    return _G[`${tooltip.GetName()}Text${side}${index}`];
}
