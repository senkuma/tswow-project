import { ClassContext } from "./ClassContext";

export type BaseClassName =
    'WARRIOR' | 'PALADIN' | 'HUNTER' | 'ROGUE' | 'PRIEST' | 'DEATH_KNIGHT' | 'SHAMAN' | 'MAGE' | 'WARLOCK' | 'DRUID';

interface AvoidanceConstants {
    diminishingK: number;
    dodgeCap: number;
    parryCap: number;
    missCap: number;
    /** Base dodge chance as a fraction (0.03664 = 3.664%). */
    dodgeBase: number;
    /** Crit-from-agility to dodge-from-agility ratio. */
    critToDodge: number;
}

/**
 * WotLK avoidance constants per base class, as hardcoded in TrinityCore's
 * StatSystem.cpp. TSWoW's server falls back to generic values for custom
 * class ids (parry cap 0, dodge cap 100), so custom classes need these written.
 */
const BASE_CLASS_AVOIDANCE: Record<BaseClassName, AvoidanceConstants> = {
    WARRIOR:      { diminishingK: 0.9560, dodgeCap: 88.129021,  parryCap: 47.003525,  missCap: 16, dodgeBase: 0.036640,  critToDodge: 0.85 / 1.15 },
    PALADIN:      { diminishingK: 0.9560, dodgeCap: 88.129021,  parryCap: 47.003525,  missCap: 16, dodgeBase: 0.034943,  critToDodge: 1.00 / 1.15 },
    HUNTER:       { diminishingK: 0.9880, dodgeCap: 145.560408, parryCap: 145.560408, missCap: 16, dodgeBase: -0.040873, critToDodge: 1.11 / 1.15 },
    ROGUE:        { diminishingK: 0.9880, dodgeCap: 145.560408, parryCap: 145.560408, missCap: 16, dodgeBase: 0.020957,  critToDodge: 2.00 / 1.15 },
    PRIEST:       { diminishingK: 0.9830, dodgeCap: 150.375940, parryCap: 0,          missCap: 16, dodgeBase: 0.034178,  critToDodge: 1.00 / 1.15 },
    DEATH_KNIGHT: { diminishingK: 0.9560, dodgeCap: 88.129021,  parryCap: 47.003525,  missCap: 16, dodgeBase: 0.036640,  critToDodge: 0.85 / 1.15 },
    SHAMAN:       { diminishingK: 0.9880, dodgeCap: 145.560408, parryCap: 145.560408, missCap: 16, dodgeBase: 0.021080,  critToDodge: 1.60 / 1.15 },
    MAGE:         { diminishingK: 0.9830, dodgeCap: 150.375940, parryCap: 0,          missCap: 16, dodgeBase: 0.036587,  critToDodge: 1.00 / 1.15 },
    WARLOCK:      { diminishingK: 0.9830, dodgeCap: 150.375940, parryCap: 0,          missCap: 16, dodgeBase: 0.024211,  critToDodge: 0.97 / 1.15 },
    DRUID:        { diminishingK: 0.9720, dodgeCap: 116.890707, parryCap: 0,          missCap: 16, dodgeBase: 0.056097,  critToDodge: 2.00 / 1.15 },
};

/**
 * Gives a custom class its parent's attack power formulas and avoidance
 * constants. TSWoW's server indexes both by class id, and a custom id falls
 * through to no attack power formula at all (0 attack power from stats).
 */
export function inheritCombatFormulas(context: ClassContext, parent: BaseClassName) {
    const stats = context.cls.Stats;
    const avoidance = BASE_CLASS_AVOIDANCE[parent];
    stats.MeleePowerType.set(parent);
    // Only some classes have their own ranged formula; the others use the default.
    stats.RangedPowerType.set(rangedFormulaOf(parent));
    stats.DiminishingK.set(avoidance.diminishingK);
    stats.DodgeCap.set(avoidance.dodgeCap);
    stats.ParryCap.set(avoidance.parryCap);
    stats.MissCap.set(avoidance.missCap);
    stats.DodgeBase.set(avoidance.dodgeBase);
    stats.CritToDodge.set(avoidance.critToDodge);
}

function rangedFormulaOf(parent: BaseClassName) {
    switch (parent) {
        case 'HUNTER':
        case 'ROGUE':
        case 'WARRIOR':
        case 'DRUID':
            return parent;
        default:
            return 'DEFAULT';
    }
}
