import { RaceName } from "classkit";

export const MODULE_NAME = 'plaguedoctor';

/**
 * Every race, so each race keeps a class to pick while the Blizzard classes
 * are hidden from character creation (see the classroster module).
 */
export const PLAGUE_DOCTOR_RACES: RaceName[] = [
    'HUMAN', 'DWARF', 'NIGHTELF', 'GNOME', 'DRAENEI',
    'ORC', 'UNDEAD', 'TAUREN', 'TROLL', 'BLOODELF',
];

/** Unused by TrinityCore (0-17) and the other custom classes (20-23). */
export const PLAGUE_DOCTOR_SPELL_FAMILY = 24;

/** Plague Doctor spells use the casters' 1.5 second global cooldown. */
export const GLOBAL_COOLDOWN_MS = 1500;

// Existing spells and classes referenced by several files.
export const ATTACK_SPELL = 6603;
export const COMBAT_SKILL_LINE = 38;
export const HUNTER_CLASS_ID = 3;
export const WARLOCK_CLASS_ID = 9;
