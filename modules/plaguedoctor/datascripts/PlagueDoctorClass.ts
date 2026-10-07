import { ClassContext, inheritCombatFormulas } from "classkit";
import { std } from "wow/wotlk";
import { MODULE_NAME, PLAGUE_DOCTOR_RACES, PLAGUE_DOCTOR_SPELL_FAMILY } from "./Constants";

// Druid parent: mana, intellect and spirit for spells and heals, and the
// sturdier stats of a leather-wearing hybrid.
export const PLAGUE_DOCTOR = std.Classes.create(MODULE_NAME, 'plaguedoctor', 'DRUID')
    .Name.enGB.set('Plague Doctor')
    .UI.Color.set(0x9fb83a)
    .UI.Description.set(
        'Behind the beaked mask, Plague Doctors are alchemists who treat sickness'
        + ' with sickness. They brew restorative concoctions and stimulating'
        + ' injections for their allies, and smother their foes in choking gas'
        + ' clouds, toxic vials and creeping disease.')
    .UI.Info.add('- Role: Healer, Damage')
    .UI.Info.add('- Leather Armor')
    .UI.Info.add('- Staves, Daggers, one-handed Maces')
    .UI.Info.add('- Uses mana as a resource')
    // A beaked plague mask, generated for this module.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/plague-doctor-icon.png'))
    .Roles.set(false, true, true)
    .Races.add(PLAGUE_DOCTOR_RACES);

export const PLAGUE_DOCTOR_CONTEXT: ClassContext = {
    module: MODULE_NAME,
    cls: PLAGUE_DOCTOR,
    races: PLAGUE_DOCTOR_RACES,
    spellFamily: PLAGUE_DOCTOR_SPELL_FAMILY,
};

// Druid attack power and avoidance rules; without this the server gives
// custom classes 0 attack power and generic dodge values.
inheritCombatFormulas(PLAGUE_DOCTOR_CONTEXT, 'DRUID');
