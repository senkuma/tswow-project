import { createClassSkillLine, grantProficiencies } from "classkit";
import { std } from "wow/wotlk";
import { ARMS_SKILL_LINE } from "./Constants";
import { VOID_KNIGHT_CONTEXT } from "./VoidKnightClass";

// The class's own spellbook tabs, one per talent tree.
export const SKILL_GRAVITY = createClassSkillLine(VOID_KNIGHT_CONTEXT, {
    id: 'gravity', name: 'Gravity', icon: 'Spell_Shadow_UnholyFrenzy', template: ARMS_SKILL_LINE,
}).ID;
export const SKILL_RIFT = createClassSkillLine(VOID_KNIGHT_CONTEXT, {
    id: 'rift', name: 'Rift', icon: 'Spell_Arcane_PortalShattrath', template: ARMS_SKILL_LINE,
}).ID;
export const SKILL_BULWARK = createClassSkillLine(VOID_KNIGHT_CONTEXT, {
    id: 'bulwark', name: 'Bulwark', icon: 'Spell_Shadow_AntiShadow', template: ARMS_SKILL_LINE,
}).ID;

// Warrior proficiencies are restricted to warriors, so the Void Knight gets its own.
// Void barriers take the place of a shield, so there is none.
grantProficiencies(VOID_KNIGHT_CONTEXT, [
    std.EquipSkills.Cloth,
    std.EquipSkills.Leather,
    std.EquipSkills.Mail,
    std.EquipSkills.Plate,
    std.EquipSkills.Swords1H,
    std.EquipSkills.Swords2H,
    std.EquipSkills.Axes1H,
    std.EquipSkills.Axes2H,
    std.EquipSkills.Maces1H,
    std.EquipSkills.Maces2H,
    std.EquipSkills.Polearms,
]);
