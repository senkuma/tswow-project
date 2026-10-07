/** One level of a growing weapon: the enchantment holding its total bonuses, and their amounts. */
export interface WeaponLevel {
    enchantment: number;
    amounts: number[];
}

/** A passive spell whose aura the wielder has while the weapon is equipped and at least at `level`. */
export interface WeaponMilestone {
    level: number;
    spell: number;
}

/** A growing weapon as GrowingWeaponData.ts lists it (written by the datascripts). Index 0 of `levels` is level 1. */
export interface GrowingWeapon {
    item: number;
    /** What each level amount is: a stat as the client's ITEM_MOD_* strings name it (AGILITY, CRIT_RATING, ...) or WEAPON_DAMAGE. */
    bonuses: string[];
    /** In increasing level order. */
    milestones: WeaponMilestone[];
    levels: WeaponLevel[];
}
