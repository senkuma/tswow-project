import { createClassSkillLine, grantProficiencies } from "classkit";
import { std } from "wow/wotlk";
import { COMBAT_SKILL_LINE } from "./Constants";
import { MARAUDER_CONTEXT } from "./MarauderClass";

// The class's own spellbook tabs, one per talent tree.
export const SKILL_CARNAGE = createClassSkillLine(MARAUDER_CONTEXT, {
    id: 'carnage', name: 'Carnage', icon: 'Ability_Warrior_Rampage', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_PLUNDER = createClassSkillLine(MARAUDER_CONTEXT, {
    id: 'plunder', name: 'Plunder', icon: 'INV_Misc_Coin_02', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_SKIRMISH = createClassSkillLine(MARAUDER_CONTEXT, {
    id: 'skirmish', name: 'Skirmish', icon: 'INV_ThrowingAxe_03', template: COMBAT_SKILL_LINE,
}).ID;

// Rogue proficiencies are restricted to rogues, so the Marauder gets its own.
grantProficiencies(MARAUDER_CONTEXT, [
    std.EquipSkills.Cloth,
    std.EquipSkills.Leather,
    std.EquipSkills.Axes1H,
    std.EquipSkills.Swords1H,
    std.EquipSkills.FistWeapons,
    std.EquipSkills.Daggers,
    std.EquipSkills.Thrown,
]);
