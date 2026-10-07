import { ClassContext, inheritCombatFormulas } from "classkit";
import { std } from "wow/wotlk";
import { MODULE_NAME, MONK_RACES, MONK_SPELL_FAMILY } from "./Constants";

// Rogue parent: energy, combo points (the monk's Chi) and attack power from
// Strength and Agility, which every monk ability scales with, heals included.
export const MONK = std.Classes.create(MODULE_NAME, 'monk', 'ROGUE')
    .Name.enGB.set('Monk')
    .UI.Color.set(0x00ff96)
    .UI.Description.set(
        'Monks are masters of the martial arts who channel their Chi through'
        + ' fist and foot. Whether stumbling through battle on a haze of brew,'
        + ' mending allies with soothing mists or striking with the fury of'
        + ' the tiger, a monk never stops moving.')
    .UI.Info.add('- Role: Tank, Healer, Damage')
    .UI.Info.add('- Leather Armor')
    .UI.Info.add('- Fist Weapons, Staves, Polearms, one-handed Axes, Maces and Swords')
    .UI.Info.add('- Uses energy, and Chi (combo points) for finishing moves')
    // ClassIcon_Monk from the retail client's interface art.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/monk-icon.png'))
    // The other custom classes are hidden, so the monk takes the first custom button slot.
    .UI.ButtonPos.setPos(-90, -420)
    .Roles.set(true, true, true)
    .Races.add(MONK_RACES);

export const MONK_CONTEXT: ClassContext = {
    module: MODULE_NAME,
    cls: MONK,
    races: MONK_RACES,
    spellFamily: MONK_SPELL_FAMILY,
};

// Rogue attack power from Strength and Agility and rogue dodge rules; without
// this the server gives custom classes 0 attack power.
inheritCombatFormulas(MONK_CONTEXT, 'ROGUE');
