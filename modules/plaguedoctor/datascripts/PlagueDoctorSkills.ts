import { createClassSkillLine, grantProficiencies } from "classkit";
import { std } from "wow/wotlk";
import { COMBAT_SKILL_LINE } from "./Constants";
import { PLAGUE_DOCTOR_CONTEXT } from "./PlagueDoctorClass";

// The class's own spellbook tabs, one per talent tree.
export const SKILL_PESTILENCE = createClassSkillLine(PLAGUE_DOCTOR_CONTEXT, {
    id: 'pestilence', name: 'Pestilence', icon: 'Spell_Shadow_PlagueCloud', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_ALCHEMY = createClassSkillLine(PLAGUE_DOCTOR_CONTEXT, {
    id: 'alchemy', name: 'Alchemy', icon: 'Trade_Alchemy', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_REMEDY = createClassSkillLine(PLAGUE_DOCTOR_CONTEXT, {
    id: 'remedy', name: 'Remedy', icon: 'Spell_Nature_HealingTouch', template: COMBAT_SKILL_LINE,
}).ID;

// Druid proficiencies are restricted to druids, so the Plague Doctor gets its own:
// a doctor's cane, scalpels and a cudgel.
grantProficiencies(PLAGUE_DOCTOR_CONTEXT, [
    std.EquipSkills.Cloth,
    std.EquipSkills.Leather,
    std.EquipSkills.Staves,
    std.EquipSkills.Daggers,
    std.EquipSkills.Maces1H,
]);
