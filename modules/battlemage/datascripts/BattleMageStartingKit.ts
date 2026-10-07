import { StartGear } from "wow/wotlk/std/Class/ClassRaceData/ClassRaceStartGear";
import { ItemInventoryType } from "wow/wotlk/std/Item/ItemInventoryType";
import { BATTLE_MAGE } from "./BattleMageClass";
import { ARCANE_BOLT, ARCANE_STRIKE } from "./abilities/BattleMageAbilities";

// Same stats as the mage's starting staves, so only the weapon type changes.
const WORN_GREATSWORD_ITEM = 49778;

const ATTACK_SPELL = 6603;

BATTLE_MAGE.Races.forEach(classRace => {
    classRace.Outfits.both(outfit => replaceTwoHandedWeapon(outfit, WORN_GREATSWORD_ITEM));
    classRace.Actions.addSpell(0, ATTACK_SPELL)
        .Actions.addSpell(1, ARCANE_STRIKE.firstRank.ID)
        .Actions.addSpell(2, ARCANE_BOLT.firstRank.ID);
});

/** Mages start with a different staff depending on race, so match on slot rather than item. */
function replaceTwoHandedWeapon(outfit: StartGear, weapon: number) {
    for (let i = 0; i < outfit.Items.length; ++i) {
        const item = outfit.Items.get(i);
        if (item.InventoryType.get() === ItemInventoryType.TWOHAND) {
            item.clear();
        }
    }
    outfit.Items.add(weapon);
}
