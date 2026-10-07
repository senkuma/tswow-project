import { std } from "wow/wotlk";
import { EquipSkill } from "wow/wotlk/std/SkillLines/EquipSkills";
import { BATTLE_MAGE } from "./BattleMageClass";
import { BATTLE_MAGE_RACES, SKILL_ARCANE, SKILL_FIRE, SKILL_FROST } from "./Constants";

const MAGE_MASK = std.Classes.load('MAGE').Mask;
// Spellbook tabs only: Battle Mage spells live on these skill lines, but the
// mage spells on them stay restricted to mages.
const SCHOOL_SKILLS = new Set([SKILL_ARCANE, SKILL_FIRE, SKILL_FROST]);

grantSchoolSkillAccess();
learnSchoolSkillsOnCreate();
grantProficiencies([
    std.EquipSkills.Leather,
    std.EquipSkills.Mail,
    std.EquipSkills.Plate,
    std.EquipSkills.Shields,
    std.EquipSkills.Staves,
    std.EquipSkills.Swords1H,
    std.EquipSkills.Swords2H,
    std.EquipSkills.Maces1H,
    std.EquipSkills.Maces2H,
]);

/**
 * Classes.create skips SkillRaceClassInfo rows that apply to all races, which
 * is how the mage schools are stored. Without a matching row the server
 * refuses the skill, and with it every spell on that skill line.
 */
function grantSchoolSkillAccess() {
    std.DBC.SkillRaceClassInfo.queryAll({})
        .filter(info => SCHOOL_SKILLS.has(info.SkillID.get()) && (info.ClassMask.get() & MAGE_MASK) !== 0)
        .forEach(info => info.ClassMask.set(withBattleMage(info.ClassMask.get())));
}

function learnSchoolSkillsOnCreate() {
    std.SQL.playercreateinfo_skills.queryAll({})
        .filter(row => SCHOOL_SKILLS.has(row.skill.get()) && (row.classMask.get() & MAGE_MASK) !== 0)
        .forEach(row => row.clone(row.raceMask.get(), BATTLE_MAGE.Mask, row.skill.get()));
}

/** `|` yields a signed 32-bit result; DBC masks are unsigned (e.g. 0xFFFFFFFF for all classes). */
function withBattleMage(classMask: number) {
    return (classMask | BATTLE_MAGE.Mask) >>> 0;
}

/**
 * Adds dedicated skill rows for this class instead of using
 * EquipSkill.enableAutolearnClass, which widens the race masks of
 * every other class's rows for the same skill.
 */
function grantProficiencies(proficiencies: EquipSkill[]) {
    proficiencies.forEach(proficiency => {
        proficiency.Skill.get().enableAutolearn(BATTLE_MAGE.Mask, BATTLE_MAGE_RACES);
        proficiency.Ability.get().ClassMask.set(BATTLE_MAGE.Mask, 'OR');
    });
}
