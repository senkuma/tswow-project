export declare type PrimaryStat = 'AGILITY' | 'STRENGTH' | 'INTELLECT' | 'SPIRIT' | 'STAMINA';
export declare type CombatRatingStat = 'CRIT_RATING' | 'HASTE_RATING' | 'HIT_RATING';
/**
 * What a growing weapon gains as it levels: stats, named as the client's
 * ITEM_MOD_* strings name them (SPELL_POWER for casters' weapons), or flat
 * weapon damage per swing.
 */
export declare type GrowthBonus = PrimaryStat | CombatRatingStat | 'SPELL_POWER' | 'WEAPON_DAMAGE';
/**
 * The total bonuses of a regular weapon at one level; the growing weapon
 * gets GROWING_WEAPON_EDGE times as much.
 */
export interface GrowthAnchor {
    level: number;
    bonuses: Partial<Record<GrowthBonus, number>>;
}
/** Total bonus amounts at one level, in the order of `GrowthTable.bonuses`. */
export declare type LevelAmounts = number[];
export interface GrowthTable {
    bonuses: GrowthBonus[];
    /** Index 0 is level 1; the last entry is the maximum level. */
    levels: LevelAmounts[];
}
/**
 * How much stronger a growing weapon is than a regular weapon of its level.
 * A weapon that only kept pace would be no better than the drops it competes
 * with, so the edge rewards carrying it from level 1 instead of swapping.
 */
export declare const GROWING_WEAPON_EDGE = 1.15;
/**
 * Bonuses at every level from 1 to the last anchor's level, GROWING_WEAPON_EDGE
 * above the anchors. Item power grows by a steady percentage per level, so
 * levels between two anchors are interpolated geometrically rather than linearly.
 */
export declare function growthTable(anchors: GrowthAnchor[]): GrowthTable;
