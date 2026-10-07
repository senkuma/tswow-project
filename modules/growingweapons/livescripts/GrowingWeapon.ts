/** One level of a growing weapon: the enchantment holding its total bonuses, and their amounts. */
export interface WeaponLevel {
    enchantment: number;
    amounts: number[];
}

/** A growing weapon as GrowingWeaponData.ts lists it (written by the datascripts). Index 0 of `levels` is level 1. */
export interface GrowingWeapon {
    item: number;
    /** What each level amount is: a stat as the client's ITEM_MOD_* strings name it (AGILITY, CRIT_RATING, ...) or WEAPON_DAMAGE. */
    bonuses: string[];
    levels: WeaponLevel[];
}
