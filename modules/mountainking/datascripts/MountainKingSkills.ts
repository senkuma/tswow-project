import { createClassSkillLine, grantProficiencies } from "classkit";
import { std } from "wow/wotlk";
import { ARMS_SKILL_LINE } from "./Constants";
import { MOUNTAIN_KING_CONTEXT } from "./MountainKingClass";

// The class's own spellbook tabs, one per talent tree.
export const SKILL_THUNDER = createClassSkillLine(MOUNTAIN_KING_CONTEXT, {
    id: 'thunder', name: 'Thunder', icon: 'Spell_Nature_ThunderClap', template: ARMS_SKILL_LINE,
}).ID;
export const SKILL_HAMMER = createClassSkillLine(MOUNTAIN_KING_CONTEXT, {
    id: 'hammer', name: 'Hammer', icon: 'INV_Hammer_09', template: ARMS_SKILL_LINE,
}).ID;
export const SKILL_MOUNTAIN = createClassSkillLine(MOUNTAIN_KING_CONTEXT, {
    id: 'mountain', name: 'Mountain', icon: 'Spell_Nature_StoneSkinTotem', template: ARMS_SKILL_LINE,
}).ID;

// Warrior proficiencies are restricted to warriors, so the Mountain King gets its own.
grantProficiencies(MOUNTAIN_KING_CONTEXT, [
    std.EquipSkills.Leather,
    std.EquipSkills.Mail,
    std.EquipSkills.Plate,
    std.EquipSkills.Shields,
    std.EquipSkills.Maces1H,
    std.EquipSkills.Maces2H,
    std.EquipSkills.Axes1H,
    std.EquipSkills.Axes2H,
    std.EquipSkills.Guns,
    std.EquipSkills.Thrown,
]);
