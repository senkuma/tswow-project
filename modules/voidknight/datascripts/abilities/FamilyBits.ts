/**
 * Spell family bits of every Void Knight spell. A bit identifies one spell (or
 * rank chain) to talents, set bonuses and Void Shards, so bits are never
 * shared or reused. Bits 0-31 are the family mask's first word, 32-63 its
 * second and 64-95 its third.
 */
export const FAMILY_BIT = {
    // Baseline abilities: Gravity
    VOID_STRIKE: 0,
    GRAVITY_LASH: 1,
    GRAVITATIONAL_PULL: 2,
    COLLAPSE: 3,
    IMPLOSION: 4,
    ANNIHILATE: 5,
    GRAVITY_LOCK: 6,
    TAP_THE_VOID: 7,
    CRUSHING_DESCENT: 8,
    // Baseline abilities: Rift
    SPATIAL_REND: 10,
    RIFT_CLEAVE: 11,
    FOLD_SPACE: 12,
    RIFT_STEP: 13,
    NULL_STRIKE: 14,
    PHASE_SHIFT: 15,
    DIMENSIONAL_RUPTURE: 16,
    WEIGHTLESS: 17,
    // Baseline abilities: Bulwark
    VOID_BARRIER: 20,
    ANCHOR: 21,
    CRUSHING_WEIGHT: 22,
    UNRAVEL: 23,
    ENTROPIC_SHOUT: 24,
    MANTLE_OF_THE_VOID: 25,
    SIPHON_THE_VOID: 26,
    EVENT_HORIZON: 27,
    WARP_REFLECTION: 28,
    GRAVITY_WELL: 29,
    GUARDIAN_WARP: 30,
    // Aspects (stances)
    ASPECT_OF_GRAVITY: 32,
    ASPECT_OF_THE_BULWARK: 33,
    ASPECT_OF_THE_RIFT: 34,
    // Talent abilities
    SINGULARITY: 40,
    STELLAR_COLLAPSE: 41,
    GRAVITON_SURGE: 42,
    TEAR_REALITY: 43,
    RIFT_AMBUSH: 44,
    SHATTER_REALITY: 45,
    OBSIDIAN_STAND: 46,
    BARRIER_PROJECTION: 47,
    GRAVITON_SHOCKWAVE: 48,
    // The Void Shards resource
    VOID_SHARD: 49,
    // Effects triggered by Gravity talents (50-57), Rift talents (58-65) and Bulwark talents (66-73)
    GRAVITY_PROC_1: 50, GRAVITY_PROC_2: 51, GRAVITY_PROC_3: 52, GRAVITY_PROC_4: 53,
    GRAVITY_PROC_5: 54, GRAVITY_PROC_6: 55, GRAVITY_PROC_7: 56, GRAVITY_PROC_8: 57,
    RIFT_PROC_1: 58, RIFT_PROC_2: 59, RIFT_PROC_3: 60, RIFT_PROC_4: 61,
    RIFT_PROC_5: 62, RIFT_PROC_6: 63, RIFT_PROC_7: 64, RIFT_PROC_8: 65,
    BULWARK_PROC_1: 66, BULWARK_PROC_2: 67, BULWARK_PROC_3: 68, BULWARK_PROC_4: 69,
    BULWARK_PROC_5: 70, BULWARK_PROC_6: 71, BULWARK_PROC_7: 72, BULWARK_PROC_8: 73,
    // Effects triggered by the gear sets (74-79) and the growing weapon's milestones (80-83)
    GEAR_PROC_1: 74, GEAR_PROC_2: 75, GEAR_PROC_3: 76, GEAR_PROC_4: 77, GEAR_PROC_5: 78, GEAR_PROC_6: 79,
    UMBRA_PROC_1: 80, UMBRA_PROC_2: 81, UMBRA_PROC_3: 82, UMBRA_PROC_4: 83,
} as const;
