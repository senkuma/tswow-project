import { RaceName } from "classkit";

export const MODULE_NAME = 'voidknight';

/** Every race: the Void calls to all of Azeroth, and each race keeps a class to pick. */
export const VOID_KNIGHT_RACES: RaceName[] = [
    'HUMAN', 'DWARF', 'NIGHTELF', 'GNOME', 'DRAENEI',
    'ORC', 'UNDEAD', 'TAUREN', 'TROLL', 'BLOODELF',
];

/** Unused by TrinityCore (0-17) and the other custom classes (20-24). */
export const VOID_KNIGHT_SPELL_FAMILY = 25;

/** Void Knight abilities use the warriors' 1.5 second global cooldown. */
export const GLOBAL_COOLDOWN_MS = 1500;

// Existing spells, skills and classes referenced by several files.
export const ATTACK_SPELL = 6603;
export const ARMS_SKILL_LINE = 26;
export const WARRIOR_CLASS_ID = 1;
export const PALADIN_CLASS_ID = 2;
