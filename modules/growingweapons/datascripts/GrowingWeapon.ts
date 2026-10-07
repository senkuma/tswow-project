import { ItemTemplate } from "wow/wotlk/std/Item/ItemTemplate";
import { GrowthAnchor, GrowthBonus, growthTable, LevelAmounts } from "./GrowthCurve";
import { createLevelEnchantment } from "./LevelEnchantment";

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
    levels: { enchantment: number; amounts: LevelAmounts }[];
    milestones: GrowthMilestone[];
}

const ITEM_CLASS_WEAPON = 2;

const registered: GrowingWeaponRecord[] = [];

export function growingWeapons(): readonly GrowingWeaponRecord[] {
    return registered;
}

/**
 * Makes a weapon grow: it gains experience from kills and levels up to the
 * last growth anchor's level, ending up stronger than regular weapons of its
 * level. Each level is an enchantment holding that level's total bonuses; the
 * livescripts swap the one on the weapon as it levels, and keep the unlocked
 * milestone passives on its wielder while it is equipped.
 */
export function makeGrowingWeapon(mod: string, item: ItemTemplate, definition: GrowingWeaponDefinition) {
    validateItem(item);
    // Progress is per weapon, but the client can only tell weapons apart by item id.
    item.MaxCount.set(1);
    // The addon inserts the grown stats into the tooltip, which would misplace a vendor's sell price line.
    item.Price.set(0, 0);
    const table = growthTable(definition.growth);
    const milestones = definition.milestones ?? [];
    validateMilestones(definition.id, milestones, table.levels.length);
    registered.push({
        item: item.ID,
        bonuses: table.bonuses,
        levels: table.levels.map((amounts, index) => ({
            enchantment: createLevelEnchantment(mod, `${definition.id}-level-${index + 1}`, index + 1,
                table.bonuses, amounts),
            amounts,
        })),
        milestones,
    });
    return item;
}

function validateItem(item: ItemTemplate) {
    if (item.Class.getClass() !== ITEM_CLASS_WEAPON) {
        throw new Error(`Growing weapon ${item.ID} is not a weapon.`);
    }
    // The level enchantment lives in the socket bonus slot, which only socketed items use.
    let socketed = false;
    for (let index = 0; index < item.Socket.length; index++) {
        socketed = socketed || !item.Socket.get(index).isClear();
    }
    if (socketed || item.SocketBonus.get() !== 0) {
        throw new Error(`Growing weapon ${item.ID} must not have sockets or a socket bonus.`);
    }
}

function validateMilestones(id: string, milestones: GrowthMilestone[], maxLevel: number) {
    milestones.forEach(({ level, spell }, index) => {
        if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
            throw new Error(`Growing weapon ${id}: milestone level ${level} is not between 1 and ${maxLevel}.`);
        }
        // Increasing order also keeps every level unique.
        if (index > 0 && level <= milestones[index - 1].level) {
            throw new Error(`Growing weapon ${id}: milestones must be in increasing level order, one per level (level ${level}).`);
        }
        if (!Number.isInteger(spell) || spell <= 0) {
            throw new Error(`Growing weapon ${id}: milestone at level ${level} needs a spell id, not ${spell}.`);
        }
    });
}
