import { RaceName } from "classkit";

export const MODULE_NAME = 'marauder';

/** Every race that can be a rogue; the class reuses the rogue's starting areas and outfits. */
export const MARAUDER_RACES: RaceName[] = [
    'HUMAN', 'DWARF', 'NIGHTELF', 'GNOME', 'ORC', 'UNDEAD', 'TROLL', 'BLOODELF',
];

/** Unused by TrinityCore (0-17), the Battle Mage (20) and the Mountain King (21). */
export const MARAUDER_SPELL_FAMILY = 22;

/** Marauder abilities use the rogue's one-second global cooldown. */
export const GLOBAL_COOLDOWN_MS = 1000;

// Existing spells and classes referenced by several files.
export const ATTACK_SPELL = 6603;
export const COMBAT_SKILL_LINE = 38;
export const ROGUE_CLASS_ID = 4;
