import { ClassContext, hideFromCharacterCreation, inheritCombatFormulas } from "classkit";
import { std } from "wow/wotlk";
import { MODULE_NAME, MOUNTAIN_KING_RACES, MOUNTAIN_KING_SPELL_FAMILY } from "./Constants";

// Warrior parent: rage, plate-ready stats and strength-based attack power.
export const MOUNTAIN_KING = std.Classes.create(MODULE_NAME, 'mountainking', 'WARRIOR')
    .Name.enGB.set('Mountain King')
    .UI.Color.set(0x3fa0e0)
    .UI.Description.set(
        'Mountain Kings are the legendary champions of the dwarven clans, hurling'
        + ' storm-charged hammers, shaking the earth beneath their foes and, at'
        + ' the height of battle, rising as living avatars of stone.')
    .UI.Info.add('- Role: Tank, Damage')
    .UI.Info.add('- Plate Armor, Shields')
    .UI.Info.add('- Maces, Axes, Guns, Thrown')
    .UI.Info.add('- Uses rage as a resource')
    // Ability_ThunderBolt: the Warcraft III Storm Bolt hammer.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/mountain-king-icon.png'))
    // The Mountain talent tree is a tank tree; the dungeon finder reads roles from here.
    .Roles.set(true, false, true)
    .Races.add(MOUNTAIN_KING_RACES);

export const MOUNTAIN_KING_CONTEXT: ClassContext = {
    module: MODULE_NAME,
    cls: MOUNTAIN_KING,
    races: MOUNTAIN_KING_RACES,
    spellFamily: MOUNTAIN_KING_SPELL_FAMILY,
};

// Warrior attack power from Strength and warrior dodge/parry rules; without
// this the server gives custom classes 0 attack power and no parry from rating.
inheritCombatFormulas(MOUNTAIN_KING_CONTEXT, 'WARRIOR');

// Not offered at character creation for now; existing characters are unaffected.
hideFromCharacterCreation(MOUNTAIN_KING);
