import { ItemTemplate } from "wow/wotlk/std/Item/ItemTemplate";
import { GrowthAnchor, GrowthBonus, growthTable, LevelAmounts } from "./GrowthCurve";
import { createLevelEnchantment } from "./LevelEnchantment";

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
    levels: { enchantment: number; amounts: LevelAmounts }[];
}

const ITEM_CLASS_WEAPON = 2;

const registered: GrowingWeaponRecord[] = [];

export function growingWeapons(): readonly GrowingWeaponRecord[] {
    return registered;
}

/**
 * Makes a weapon grow: it gains experience from kills and levels up to the
 * last growth anchor's level. Each level is an enchantment holding that
 * level's total bonuses; the livescripts swap the one on the weapon as it levels.
 */
export function makeGrowingWeapon(mod: string, item: ItemTemplate, definition: GrowingWeaponDefinition) {
    validateItem(item);
    // Progress is per weapon, but the client can only tell weapons apart by item id.
    item.MaxCount.set(1);
    // The addon inserts the grown stats into the tooltip, which would misplace a vendor's sell price line.
    item.Price.set(0, 0);
    const table = growthTable(definition.growth);
    registered.push({
        item: item.ID,
        bonuses: table.bonuses,
        levels: table.levels.map((amounts, index) => ({
            enchantment: createLevelEnchantment(mod, `${definition.id}-level-${index + 1}`, index + 1,
                table.bonuses, amounts),
            amounts,
        })),
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
