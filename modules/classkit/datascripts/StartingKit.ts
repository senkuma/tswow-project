import { EnumCon } from "wow/data/cell/cells/EnumCell";
import { ItemInventoryType } from "wow/wotlk/std/Item/ItemInventoryType";
import { ClassContext } from "./ClassContext";

/**
 * Swaps every starting item in `slot` for `items`. Matching on the slot
 * rather than an item id covers the different items each race starts with.
 * Several items fill the character's slots in order, e.g. two one-handers
 * go to the main hand and, if the class can dual wield, the off hand.
 */
export function replaceStartingItem(context: ClassContext, slot: EnumCon<keyof typeof ItemInventoryType>, ...items: number[]) {
    const slotId = typeof slot === 'number' ? slot : ItemInventoryType[slot];
    context.cls.Races.forEach(classRace => classRace.Outfits.both(outfit => {
        for (let i = 0; i < outfit.Items.length; ++i) {
            const outfitItem = outfit.Items.get(i);
            // Blizzard marks unused entries with -1, which TSWoW counts as taken
            // (it only reuses all-zero entries); the server skips both alike.
            const unused = outfitItem.Item.get() < 0;
            if (unused || outfitItem.InventoryType.get() === slotId) {
                outfitItem.clear();
            }
        }
        items.forEach(item => outfit.Items.add(item));
    }));
}

/** Places spells on the first action bar buttons, in order. */
export function setStartingActionBar(context: ClassContext, spells: number[]) {
    context.cls.Races.forEach(classRace => spells.forEach((spell, button) =>
        classRace.Actions.addSpell(button, spell)));
}
