/**
 * Existing rows of the client's spell lookup tables. Pointing at a stock row
 * keeps the DBCs small; `setSimple` on these fields would add a row per spell.
 */

/** SpellDuration.dbc rows (fixed durations). */
export const DURATION = {
    SEC_2: 39,
    SEC_3: 27,
    SEC_4: 35,
    SEC_5: 28,
    SEC_6: 32,
    SEC_8: 31,
    SEC_10: 1,
    SEC_12: 29,
    SEC_15: 8,
    SEC_20: 18,
    SEC_30: 9,
    MIN_1: 3,
    MIN_2: 4,
    MIN_60: 42,
} as const;

/** SpellRange.dbc rows (hostile min-max yards). */
export const RANGE = {
    MELEE: 2,
    YARDS_10: 7,
    YARDS_20: 3,
    YARDS_30: 4,
    YARDS_40: 5,
    /** Charge's 8-25 yards. */
    CHARGE: 95,
} as const;

/** SpellRadius.dbc rows. */
export const RADIUS = {
    YARDS_8: 14,
    YARDS_10: 13,
    YARDS_15: 18,
    YARDS_20: 9,
    YARDS_30: 10,
    YARDS_40: 23,
} as const;
