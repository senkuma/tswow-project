import { RaceMask } from "wow/wotlk/std/Race/RaceType";

export const MODULE_NAME = 'battlemage';

export type RaceName = keyof typeof RaceMask;

export const BATTLE_MAGE_RACES: RaceName[] = [
    'HUMAN', 'DWARF', 'NIGHTELF', 'GNOME', 'DRAENEI',
    'ORC', 'UNDEAD', 'TAUREN', 'TROLL', 'BLOODELF',
];

/**
 * Spell family shared by Battle Mage abilities and the talents that modify
 * them. TrinityCore defines families 0-17 and only applies a talent's spell
 * modifiers to spells of the talent's own family, so an unused value keeps
 * Battle Mage talents and other classes' talents from affecting each other.
 */
export const BATTLE_MAGE_SPELL_FAMILY = 20;

/** Mage skill lines, reused as the Battle Mage's spellbook tabs. */
export const SKILL_ARCANE = 237;
export const SKILL_FIRE = 8;
export const SKILL_FROST = 6;
