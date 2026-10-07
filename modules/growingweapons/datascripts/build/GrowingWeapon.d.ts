import { ItemTemplate } from "wow/wotlk/std/Item/ItemTemplate";
import { GrowthAnchor, GrowthBonus, LevelAmounts } from "./GrowthCurve";
/** A passive the weapon's wielder has while the weapon is equipped and at least at `level`. */
export interface GrowthMilestone {
    level: number;
    /**
     * A passive spell, such as classkit's createPassiveSpell makes. The
     * livescripts add and remove its aura themselves, which only lasts for
     * passives: an aura with a duration would run out.
     */
    spell: number;
}
export interface GrowingWeaponDefinition {
    /** Prefix of the registry ids of the weapon's level enchantments. */
    id: string;
    /**
     * Total bonuses of a regular weapon at chosen levels: the first at level 1,
     * the last at the weapon's maximum level. The weapon grows GROWING_WEAPON_EDGE above them.
     */
    growth: GrowthAnchor[];
    /** Passives unlocked along the way, in increasing level order. */
    milestones?: GrowthMilestone[];
}
/** What the livescripts need to know about one growing weapon. */
export interface GrowingWeaponRecord {
    item: number;
    bonuses: GrowthBonus[];
    levels: {
        enchantment: number;
        amounts: LevelAmounts;
    }[];
    milestones: GrowthMilestone[];
}
export declare function growingWeapons(): readonly GrowingWeaponRecord[];
/**
 * Makes a weapon grow: it gains experience from kills and levels up to the
 * last growth anchor's level, ending up stronger than regular weapons of its
 * level. Each level is an enchantment holding that level's total bonuses; the
 * livescripts swap the one on the weapon as it levels, and keep the unlocked
 * milestone passives on its wielder while it is equipped.
 */
export declare function makeGrowingWeapon(mod: string, item: ItemTemplate, definition: GrowingWeaponDefinition): ItemTemplate;
