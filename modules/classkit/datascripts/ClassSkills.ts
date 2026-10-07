import { std } from "wow/wotlk";
import { EquipSkill } from "wow/wotlk/std/SkillLines/EquipSkills";
import { ClassContext } from "./ClassContext";

export interface ClassSkillLineDefinition {
    id: string;
    name: string;
    icon: string;
    /** Existing class skill line (e.g. Arms, 26) whose race/class flags are copied. */
    template: number;
}

/** A spellbook tab of the class's own, learned by every new character of the class. */
export function createClassSkillLine(context: ClassContext, definition: ClassSkillLineDefinition) {
    // Created without a parent: SkillLines.create(mod, id, parent) clones the
    // parent's race/class rows using the new skill's id as their primary key
    // instead of their SkillID, leaving the new skill with no rows at all.
    const skill = std.SkillLines.create(context.module, definition.id)
        .Name.enGB.set(definition.name)
        .Icon.setPath(definition.icon);
    const templateInfo = std.DBC.SkillRaceClassInfo.query({ SkillID: definition.template });
    if (templateInfo === undefined) {
        throw new Error(`Skill line ${definition.id}: template ${definition.template} has no race/class info`);
    }
    // Without a row matching the class the server refuses the skill, and every spell on it.
    skill.RaceClassInfos.addGet(context.cls.Mask, context.races)
        .Flags.set(templateInfo.Flags.get());
    skill.Autolearn.addGet(context.cls.Mask, context.races);
    return skill;
}

/**
 * Adds dedicated skill rows for this class instead of using
 * EquipSkill.enableAutolearnClass, which widens the race masks of
 * every other class's rows for the same skill.
 */
export function grantProficiencies(context: ClassContext, proficiencies: EquipSkill[]) {
    proficiencies.forEach(proficiency => {
        proficiency.Skill.get().enableAutolearn(context.cls.Mask, context.races);
        proficiency.Ability.get().ClassMask.set(context.cls.Mask, 'OR');
    });
}
