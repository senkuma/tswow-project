import { ClassContext, inheritCombatFormulas } from "classkit";
import { std } from "wow/wotlk";
import { MODULE_NAME, VOID_KNIGHT_RACES, VOID_KNIGHT_SPELL_FAMILY } from "./Constants";

// Warrior parent: rage, plate-ready stats and strength-based attack power.
export const VOID_KNIGHT = std.Classes.create(MODULE_NAME, 'voidknight', 'WARRIOR')
    .Name.enGB.set('Void Knight')
    .UI.Color.set(0x7a4dff)
    .UI.Description.set(
        'Void Knights are armored sentinels who have stared into the space between'
        + ' the stars and learned to bend it. They crush foes beneath warped gravity,'
        + ' tear rifts through the battlefield and turn aside blows with barriers'
        + ' woven from the Void itself.')
    .UI.Info.add('- Role: Tank, Damage')
    .UI.Info.add('- Plate Armor; fights with two-handed weapons, no shield')
    .UI.Info.add('- Swords, Axes, Maces and Polearms')
    .UI.Info.add('- Uses rage, and Void Shards for finishing moves')
    // A black hole with a violet accretion disk behind a greatsword, generated for this module.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/void-knight-icon.png'))
    // The Bulwark talent tree is a tank tree; the dungeon finder reads roles from here.
    .Roles.set(true, false, true)
    .Races.add(VOID_KNIGHT_RACES);

export const VOID_KNIGHT_CONTEXT: ClassContext = {
    module: MODULE_NAME,
    cls: VOID_KNIGHT,
    races: VOID_KNIGHT_RACES,
    spellFamily: VOID_KNIGHT_SPELL_FAMILY,
};

// Warrior attack power from Strength and warrior dodge/parry rules; without
// this the server gives custom classes 0 attack power and no parry from rating.
inheritCombatFormulas(VOID_KNIGHT_CONTEXT, 'WARRIOR');
