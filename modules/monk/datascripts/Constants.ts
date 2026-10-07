import { RaceName } from "classkit";

export const MODULE_NAME = 'monk';

/** Every race that can be a rogue; the class reuses the rogue's starting areas and outfits. */
export const MONK_RACES: RaceName[] = [
    'HUMAN', 'DWARF', 'NIGHTELF', 'GNOME', 'ORC', 'UNDEAD', 'TROLL', 'BLOODELF',
];

/** Unused by TrinityCore (0-17) and the other custom classes (20-22). */
export const MONK_SPELL_FAMILY = 23;

/** Monk abilities use the rogue's one-second global cooldown. */
export const GLOBAL_COOLDOWN_MS = 1000;

// Existing spells and classes referenced by several files.
export const ATTACK_SPELL = 6603;
export const COMBAT_SKILL_LINE = 38;
export const PRIEST_CLASS_ID = 5;
