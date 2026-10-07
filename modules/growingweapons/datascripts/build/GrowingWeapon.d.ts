import { ItemTemplate } from "wow/wotlk/std/Item/ItemTemplate";
import { GrowthAnchor, GrowthBonus, LevelAmounts } from "./GrowthCurve";
export interface GrowingWeaponDefinition {
    /** Prefix of the registry ids of the weapon's level enchantments. */
    id: string;
    /** Total bonuses at chosen levels: the first at level 1, the last at the weapon's maximum level. */
    growth: GrowthAnchor[];
}
/** What the livescripts need to know about one growing weapon. */
export interface GrowingWeaponRecord {
    item: number;
    bonuses: GrowthBonus[];
    levels: {
        enchantment: number;
        amounts: LevelAmounts;
    }[];
}
export declare function growingWeapons(): readonly GrowingWeaponRecord[];
/**
 * Makes a weapon grow: it gains experience from kills and levels up to the
 * last growth anchor's level. Each level is an enchantment holding that
 * level's total bonuses; the livescripts swap the one on the weapon as it levels.
 */
export declare function makeGrowingWeapon(mod: string, item: ItemTemplate, definition: GrowingWeaponDefinition): ItemTemplate;
