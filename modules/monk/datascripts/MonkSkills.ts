import { createClassSkillLine, grantProficiencies } from "classkit";
import { std } from "wow/wotlk";
import { COMBAT_SKILL_LINE } from "./Constants";
import { MONK_CONTEXT } from "./MonkClass";

// The class's own spellbook tabs, one per talent tree.
export const SKILL_BREWMASTER = createClassSkillLine(MONK_CONTEXT, {
    id: 'brewmaster', name: 'Brewmaster', icon: 'Spell_Monk_Brewmaster_Spec', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_MISTWEAVER = createClassSkillLine(MONK_CONTEXT, {
    id: 'mistweaver', name: 'Mistweaver', icon: 'Spell_Monk_MistWeaver_Spec', template: COMBAT_SKILL_LINE,
}).ID;
export const SKILL_WINDWALKER = createClassSkillLine(MONK_CONTEXT, {
    id: 'windwalker', name: 'Windwalker', icon: 'Spell_Monk_WindWalker_Spec', template: COMBAT_SKILL_LINE,
}).ID;

// Rogue proficiencies are restricted to rogues, so the Monk gets its own.
grantProficiencies(MONK_CONTEXT, [
    std.EquipSkills.Cloth,
    std.EquipSkills.Leather,
    std.EquipSkills.FistWeapons,
    std.EquipSkills.Staves,
    std.EquipSkills.Polearms,
    std.EquipSkills.Axes1H,
    std.EquipSkills.Maces1H,
    std.EquipSkills.Swords1H,
]);
