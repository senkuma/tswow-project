import { hideBaseClassesFromCharacterCreation } from "classkit";

// Which classes new characters can pick. Only custom classes are offered:
// the Blizzard classes are hidden from character creation (existing
// characters keep working). Remove a class from this list to offer it again.
// Custom classes hide or show themselves in their own modules.
hideBaseClassesFromCharacterCreation([
    'WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST',
    'DEATH_KNIGHT', 'SHAMAN', 'MAGE', 'WARLOCK', 'DRUID',
]);
