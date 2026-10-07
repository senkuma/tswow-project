export declare type PrimaryStat = 'AGILITY' | 'STRENGTH' | 'INTELLECT' | 'SPIRIT' | 'STAMINA';
export declare type CombatRatingStat = 'CRIT_RATING' | 'HASTE_RATING' | 'HIT_RATING';
/**
 * What a growing weapon gains as it levels: stats, named as the client's
 * ITEM_MOD_* strings name them, or flat weapon damage per swing.
 */
export declare type GrowthBonus = PrimaryStat | CombatRatingStat | 'WEAPON_DAMAGE';
/** A weapon's total bonuses at one level. */
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
 * Bonuses at every level from 1 to the last anchor's level. Item power grows
 * by a steady percentage per level, so levels between two anchors are
 * interpolated geometrically rather than linearly.
 */
export declare function growthTable(anchors: GrowthAnchor[]): GrowthTable;
