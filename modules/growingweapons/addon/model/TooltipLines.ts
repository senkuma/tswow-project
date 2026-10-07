import { grownDamage, templatePattern } from "./TooltipTemplates";
import { WEAPON_DAMAGE, WeaponBonus, WeaponState } from "./WeaponProgress";

/**
 * Name of the server's level enchantment, which the client prints as a green
 * line of its own (datascripts/LevelEnchantment.ts names it).
 */
const LEVEL_ENCHANTMENT_NAME = 'Awakened Power (Level %d)';
/** Stats items show as white "+12 Agility" lines; the others as green "Equip:" lines. */
const PRIMARY_STATS = ['STRENGTH', 'AGILITY', 'STAMINA', 'INTELLECT', 'SPIRIT'];
// The "+" that GlobalStrings' "%c%d Agility" stat formats take as a character code.
const PLUS_SIGN = 43;
const SPEED_NUMBER = '(%d+[%.,]%d+)';

export type Color = [number, number, number];
const WHITE: Color = [1, 1, 1];
const GREEN: Color = [0, 1, 0];

export interface TooltipLine {
    left: string;
    leftColor: Color;
    /** Text on the right of the line (such as "Speed 3.30"), when it shows any. */
    right?: string;
    rightColor?: Color;
}

/** Looks up a GlobalStrings format by name. */
export type GlobalStrings = (name: string) => string | undefined;

/**
 * An item tooltip's lines as if the weapon's grown bonuses were on the item:
 * damage and damage per second include the weapon damage bonus, primary
 * stats follow them as white lines and ratings follow the requirements as
 * "Equip:" lines, as on any item. The level enchantment's own line goes, as
 * the progress panel lists the bonuses.
 */
export function growTooltipLines(lines: TooltipLine[], state: WeaponState, strings: GlobalStrings): TooltipLine[] {
    const enchantmentPattern = templatePattern(LEVEL_ENCHANTMENT_NAME);
    const grown = lines.filter(line => !matches(line.left, enchantmentPattern));
    const stats = state.bonuses.filter(bonus => bonus.key !== WEAPON_DAMAGE && bonus.amount > 0);

    const lastDamageLine = growDamage(grown, state, strings);
    if (lastDamageLine !== undefined) {
        const primary = stats.filter(bonus => isPrimary(bonus)).map(bonus => primaryLine(bonus, strings));
        grown.splice(lastDamageLine + 1, 0, ...primary);
    }

    const equip = stats.filter(bonus => !isPrimary(bonus)).map(bonus => equipLine(bonus, strings));
    const minLevelFormat = strings('ITEM_MIN_LEVEL');
    const requirement = minLevelFormat === undefined ? -1 : findLine(grown, templatePattern(minLevelFormat));
    grown.splice(requirement >= 0 ? requirement + 1 : grown.length, 0, ...equip);
    return grown;
}

/** Adds the damage bonus to the damage lines; returns the index of the last of them, if the tooltip has any. */
function growDamage(lines: TooltipLine[], state: WeaponState, strings: GlobalStrings): number | undefined {
    const damageFormat = strings('DAMAGE_TEMPLATE');
    const damagePattern = damageFormat === undefined ? undefined : templatePattern(damageFormat);
    const damageIndex = damagePattern === undefined ? -1 : findLine(lines, damagePattern);
    if (damageFormat === undefined || damagePattern === undefined || damageIndex < 0) {
        return undefined;
    }
    // The damage per second line directly follows the damage line.
    const dpsFormat = strings('DPS_TEMPLATE');
    const dpsIndex = damageIndex + 1;
    const hasDps = dpsFormat !== undefined && dpsIndex < lines.length
        && matches(lines[dpsIndex].left, templatePattern(dpsFormat));

    const bonus = state.bonuses.find(candidate => candidate.key === WEAPON_DAMAGE);
    if (bonus !== undefined && bonus.amount > 0) {
        const damageLine = lines[damageIndex];
        const [min, max] = strmatch(damageLine.left, damagePattern);
        const damage = grownDamage(Number(min), Number(max), bonus.amount, weaponSpeed(damageLine));
        lines[damageIndex] = { ...damageLine, left: format(damageFormat, damage.min, damage.max) };
        if (hasDps && damage.dps !== undefined) {
            lines[dpsIndex] = { ...lines[dpsIndex], left: format(dpsFormat!, damage.dps) };
        }
    }
    return hasDps ? dpsIndex : damageIndex;
}

/** The speed on the right of the damage line ("Speed 3.30"). */
function weaponSpeed(damageLine: TooltipLine) {
    const [speed] = strmatch(damageLine.right ?? '', SPEED_NUMBER);
    return speed === undefined ? undefined : Number(speed.replace(',', '.'));
}

function isPrimary(bonus: WeaponBonus) {
    return PRIMARY_STATS.indexOf(bonus.key) >= 0;
}

function primaryLine(bonus: WeaponBonus, strings: GlobalStrings): TooltipLine {
    const statFormat = strings(`ITEM_MOD_${bonus.key}`);
    const text = statFormat === undefined ? `+${bonus.amount} ${bonus.label}` : format(statFormat, PLUS_SIGN, bonus.amount);
    return { left: text, leftColor: WHITE };
}

function equipLine(bonus: WeaponBonus, strings: GlobalStrings): TooltipLine {
    const trigger = strings('ITEM_SPELL_TRIGGER_ONEQUIP') ?? 'Equip:';
    const statFormat = strings(`ITEM_MOD_${bonus.key}`);
    const effect = statFormat === undefined ? `+${bonus.amount} ${bonus.label}` : format(statFormat, bonus.amount);
    return { left: `${trigger} ${effect}`, leftColor: GREEN };
}

/** The first line after the item's name matching `pattern`, or -1. */
function findLine(lines: TooltipLine[], pattern: string) {
    for (let index = 1; index < lines.length; index++) {
        if (matches(lines[index].left, pattern)) {
            return index;
        }
    }
    return -1;
}

function matches(text: string, pattern: string) {
    return strmatch(text, pattern)[0] !== undefined;
}
