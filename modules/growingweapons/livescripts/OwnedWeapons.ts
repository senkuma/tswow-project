import { GrowingWeapon } from "./GrowingWeapon";
import { GROWING_WEAPONS } from "./GrowingWeaponData";

// EquipmentSlots: main hand, off hand, ranged.
export const WEAPON_SLOTS = [15, 16, 17];

const WEAPONS_BY_ITEM: { [item: number]: GrowingWeapon } = {};
GROWING_WEAPONS.forEach(weapon => WEAPONS_BY_ITEM[weapon.item] = weapon);

/** The growing weapon `item` is, if it is one. */
export function growingWeaponOf(item: TSItem): GrowingWeapon | undefined {
    return WEAPONS_BY_ITEM[item.GetEntry()];
}

/** Calls `action` for every growing weapon the player has equipped. */
export function forEachEquippedWeapon(player: TSPlayer, action: (item: TSItem, weapon: GrowingWeapon) => void) {
    WEAPON_SLOTS.forEach(slot => {
        const item = player.GetEquippedItemBySlot(slot);
        const weapon = item === undefined ? undefined : growingWeaponOf(item);
        if (item !== undefined && weapon !== undefined) {
            action(item, weapon);
        }
    });
}

/** Calls `action` for every growing weapon the player carries or wears (the bank is not searched). */
export function forEachOwnedWeapon(player: TSPlayer, action: (item: TSItem, weapon: GrowingWeapon) => void) {
    GROWING_WEAPONS.forEach(weapon => {
        const item = player.GetItemByEntry(weapon.item);
        if (item !== undefined) {
            action(item, weapon);
        }
    });
}
