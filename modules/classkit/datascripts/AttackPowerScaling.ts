import { Spell } from "wow/wotlk/std/Spell/Spell";

const DAMAGE_CLASS_RANGED = 3;

/**
 * Makes a non-weapon damage ability scale with attack power and use the
 * ranged attack table, as Thunder Clap does: it crits with melee/ranged crit,
 * is hit by melee/ranged hit and cannot be dodged or parried. NPC parents
 * otherwise use the magic table, which ignores a melee class's stats.
 */
export function scalesWithAttackPower(spell: Spell, coefficient: number) {
    spell.DefenseType.set(DAMAGE_CLASS_RANGED)
        .BonusData.APBonus.set(coefficient)
        .BonusData.DirectBonus.set(0);
}

/** Adds `coefficientPerTick` times attack power to every tick of a periodic damage effect. */
export function periodicDamageScalesWithAttackPower(spell: Spell, coefficientPerTick: number) {
    spell.BonusData.APDotBonus.set(coefficientPerTick)
        .BonusData.DotBonus.set(0);
}

/**
 * Tooltip expression the client evaluates with the player's current attack
 * power, e.g. `${$m1+0.5*$AP}`; `baseValue` is a tooltip variable like `$m1`.
 */
export function withAttackPower(baseValue: string, coefficient: number) {
    return '${' + baseValue + '+' + coefficient + '*$AP}';
}
