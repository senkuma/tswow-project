/**
 * Spell family bits of every Monk spell. A bit identifies one spell (or rank
 * chain) to talents and set bonuses, so bits are never shared or reused.
 */
export const FAMILY_BIT = {
    // Baseline abilities
    JAB: 0,
    TIGER_PALM: 1,
    BLACKOUT_KICK: 2,
    ROLL: 3,
    EXPEL_HARM: 4,
    SPEAR_HAND_STRIKE: 5,
    PROVOKE: 6,
    STANCE_OF_THE_FIERCE_TIGER: 7,
    STANCE_OF_THE_STURDY_OX: 8,
    STANCE_OF_THE_WISE_SERPENT: 9,
    SURGING_MIST: 10,
    RENEWING_MIST: 11,
    SPINNING_CRANE_KICK: 12,
    PARALYSIS: 13,
    TOUCH_OF_DEATH: 14,
    FORTIFYING_BREW: 15,
    LEGACY_OF_THE_EMPEROR: 16,
    DUAL_WIELD: 17,
    // Talent abilities
    KEG_SMASH: 18,
    BREATH_OF_FIRE: 19,
    DAMPEN_HARM: 20,
    ENVELOPING_MIST: 21,
    LIFE_COCOON: 22,
    REVIVAL: 23,
    RISING_SUN_KICK: 24,
    FLYING_SERPENT_KICK: 25,
    FISTS_OF_FURY: 26,
    // Effects triggered by other spells
    FISTS_OF_FURY_STRIKE: 27,
    COMBO_BREAKER: 28,
    GIFT_OF_THE_OX: 29,
    CHI_SURGE: 30,
    JADE_LIGHTNING: 31,
    // Mists of Pandaria healing (the second 32 bits of the family mask)
    SOOTHING_MIST: 32,
    UPLIFT: 34,
    UPLIFT_HEAL: 35,
    THUNDER_FOCUS_TEA: 36,
    DETOX: 37,
    RESUSCITATE: 38,
} as const;
