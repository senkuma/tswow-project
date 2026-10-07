import { ClassContext, hideFromCharacterCreation, inheritCombatFormulas } from "classkit";
import { std } from "wow/wotlk";
import { MARAUDER_RACES, MARAUDER_SPELL_FAMILY, MODULE_NAME } from "./Constants";

// Rogue parent: energy, leather-ready stats and attack power from Strength and Agility.
export const MARAUDER = std.Classes.create(MODULE_NAME, 'marauder', 'ROGUE')
    .Name.enGB.set('Marauder')
    .UI.Color.set(0xc8502e)
    .UI.Description.set(
        'Marauders are reckless raiders who live for the spoils of war. They fight'
        + ' with an axe in each hand, drag their prey close with barbed chains and'
        + ' grow deadlier with every prize they tear from their enemies.')
    .UI.Info.add('- Role: Damage')
    .UI.Info.add('- Leather Armor')
    .UI.Info.add('- Dual wields Axes, Swords, Fist Weapons and Daggers')
    .UI.Info.add('- Uses energy as a resource')
    // Ability_Warrior_Rampage: a roaring berserker.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/marauder-icon.png'))
    .Roles.set(false, false, true)
    .Races.add(MARAUDER_RACES);

export const MARAUDER_CONTEXT: ClassContext = {
    module: MODULE_NAME,
    cls: MARAUDER,
    races: MARAUDER_RACES,
    spellFamily: MARAUDER_SPELL_FAMILY,
};

// Rogue attack power from Strength and Agility and rogue dodge rules; without
// this the server gives custom classes 0 attack power.
inheritCombatFormulas(MARAUDER_CONTEXT, 'ROGUE');

// Not offered at character creation for now; existing characters are unaffected.
hideFromCharacterCreation(MARAUDER);
