/**
 * Spell family bits of every Marauder spell. A bit identifies one spell (or
 * rank chain) to talents, set bonuses and Spoils of War, so bits are never
 * shared or reused.
 */
export const FAMILY_BIT = {
    // Baseline abilities
    SAVAGE_STRIKE: 0,
    RANSACK: 1,
    SERRATED_GASH: 2,
    HURL_AXE: 3,
    CHAIN_HOOK: 4,
    POMMEL_STRIKE: 5,
    REAVERS_LEAP: 6,
    SCRAPPERS_INSTINCT: 7,
    GORGE: 8,
    PLUNDER: 9,
    DREAD_HOWL: 10,
    REAVERS_WHIRL: 11,
    BEHEAD: 12,
    DUAL_WIELD: 13,
    // Talent abilities
    TWIN_FANGS: 14,
    RED_MIST: 15,
    BLOODBATH: 16,
    SEIZE_THE_SPOILS: 17,
    SHAKEDOWN: 18,
    KINGS_RANSOM: 19,
    RICOCHET_AXE: 20,
    AXE_VOLLEY: 21,
    AXE_STORM: 22,
    // Effects triggered by other spells
    SPOILS_OF_WAR: 23,
    DEEP_GASH: 24,
    AXE_STORM_HIT: 25,
    CRIPPLING_THROW: 26,
    DOUBLE_DEALING: 27,
    SPOILS_OF_VICTORY: 28,
    BROADSIDE: 29,
    TWIN_FANGS_STRIKE: 30,
} as const;
