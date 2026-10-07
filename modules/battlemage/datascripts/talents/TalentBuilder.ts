import { std } from "wow/wotlk";
import { SpellModOp, StatMod } from "wow/wotlk/std/Spell/EffectTemplates/AuraTemplates";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { SpellEffect } from "wow/wotlk/std/Spell/SpellEffect";
import { Talent } from "wow/wotlk/std/Talents/Talent";
import { TalentTree } from "wow/wotlk/std/Talents/TalentTree";
import { RankedAbility, SchoolName } from "../abilities/RankedAbility";
import { BATTLE_MAGE } from "../BattleMageClass";
import { BATTLE_MAGE_SPELL_FAMILY, MODULE_NAME } from "../Constants";

// Cruelty rank 1: a plain passive talent spell, used as the template for generated talents.
const PASSIVE_TALENT_TEMPLATE = 12320;
const POINTS_PER_TALENT_ROW = 5;
export const MAGIC_SCHOOLS: SchoolName[] = ['HOLY', 'FIRE', 'NATURE', 'FROST', 'SHADOW', 'ARCANE'];
export const ALL_SCHOOLS: SchoolName[] = ['PHYSICAL', ...MAGIC_SCHOOLS];

type StatName = keyof typeof StatMod;

/** Configures one effect of a talent rank spell; `rank` is 1-based. */
export type TalentEffect = (effect: SpellEffect, rank: number) => void;

interface TalentBase {
    id: string;
    row: number;
    column: number;
    /** Another talent in the same tree that must be fully learned first. */
    requires?: string;
}

/** A talent whose rank spells are generated from effect builders. */
export interface PassiveTalent extends TalentBase {
    kind: 'passive';
    name: string;
    icon: string;
    description: string;
    ranks: number;
    effects: TalentEffect[];
}

/** A copy of an existing talent, kept intact so it still modifies its original spells. */
export interface ClonedTalent extends TalentBase {
    kind: 'cloned';
    parentRanks: number[];
}

/** Grants the first rank of an ability; higher ranks come from the trainer. */
export interface ActiveTalent extends TalentBase {
    kind: 'active';
    ability: RankedAbility;
}

/** Escape hatch for talents that need more than auras, such as procs. */
export interface CustomTalent extends TalentBase {
    kind: 'custom';
    ranks: number;
    createRanks: () => Spell[];
}

export type TalentDefinition = PassiveTalent | ClonedTalent | ActiveTalent | CustomTalent;

export interface TalentTreeDefinition {
    id: string;
    name: string;
    tabIndex: number;
    /** Name of an Interface\TalentFrame background set, e.g. "MageFrost". */
    background: string;
    icon: string;
    talents: TalentDefinition[];
}

export function createTalentTree(definition: TalentTreeDefinition): TalentTree {
    assertTiersReachable(definition);
    const tree =BATTLE_MAGE.TalentTrees.addGet(MODULE_NAME, definition.id, definition.tabIndex)
        .Name.enGB.set(definition.name)
        .BackgroundImage.set(definition.background)
        .Icon.setPath(definition.icon);

    const talents = new Map<string, Talent>();
    definition.talents.forEach(talentDefinition => talents.set(talentDefinition.id,
        tree.Talents.addGet(MODULE_NAME, `${definition.id}-${talentDefinition.id}`)
            .Position.set(talentDefinition.row, talentDefinition.column)
            .Spells.add(createRankSpells(definition.id, talentDefinition).map(spell => spell.ID))));

    definition.talents.forEach(talentDefinition => {
        if (talentDefinition.requires === undefined) {
            return;
        }
        const required = definition.talents.find(other => other.id === talentDefinition.requires);
        if (required === undefined) {
            throw new Error(`Talent ${talentDefinition.id} requires unknown talent ${talentDefinition.requires}`);
        }
        talents.get(talentDefinition.id)!.Requirements
            .add(talents.get(required.id)!.ID, rankCount(required));
    });

    return tree;
}

/** The client unlocks talent row N after 5 * N points in the tree, so earlier rows must offer that many ranks. */
function assertTiersReachable(definition: TalentTreeDefinition) {
    const deepestRow = Math.max(...definition.talents.map(talent => talent.row));
    for (let row = 1; row <= deepestRow; ++row) {
        const available = definition.talents
            .filter(talent => talent.row < row)
            .reduce((sum, talent) => sum + rankCount(talent), 0);
        if (available < POINTS_PER_TALENT_ROW * row) {
            throw new Error(`Talent tree ${definition.id}: row ${row} needs ${POINTS_PER_TALENT_ROW * row}`
                + ` points but the rows above it only offer ${available}`);
        }
    }
}

function rankCount(definition: TalentDefinition) {
    switch (definition.kind) {
        case 'passive': return definition.ranks;
        case 'cloned': return definition.parentRanks.length;
        case 'active': return 1;
        case 'custom': return definition.ranks;
    }
}

function createRankSpells(treeId: string, definition: TalentDefinition): Spell[] {
    switch (definition.kind) {
        case 'passive':
            return range(definition.ranks).map(rank => createPassiveRank(treeId, definition, rank));
        case 'cloned':
            return definition.parentRanks.map((parent, index) =>
                std.Spells.create(MODULE_NAME, `${treeId}-${definition.id}-rank-${index + 1}`, parent));
        case 'active':
            return [definition.ability.firstRank];
        case 'custom':
            return definition.createRanks();
    }
}

function createPassiveRank(treeId: string, definition: PassiveTalent, rank: number) {
    const spell = std.Spells.create(MODULE_NAME, `${treeId}-${definition.id}-rank-${rank}`, PASSIVE_TALENT_TEMPLATE)
        .Name.enGB.set(definition.name)
        .Description.enGB.set(definition.description)
        .Icon.setPath(definition.icon)
        // Lets spell modifiers in this talent target Battle Mage abilities.
        .Family.set(BATTLE_MAGE_SPELL_FAMILY)
        .ClassMask.set(0, 0, 0)
        .Effects.clearAll();
    // Cruelty only counts melee weapons; generated talents apply regardless of weapon.
    spell.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
    definition.effects.forEach((configure, index) =>
        configure(selfAura(spell.Effects.get(index)), rank));
    return spell;
}

function selfAura(effect: SpellEffect) {
    return effect.Type.APPLY_AURA.set()
        .ImplicitTargetA.set('UNIT_CASTER');
}

function range(count: number) {
    return Array.from({ length: count }, (_, index) => index + 1);
}

// Effect builders. Values are per rank, so a 5-rank talent with `perRank = 1` ends at 5%.

export const meleeCrit = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_WEAPON_CRIT_PERCENT.set().PercentBase.set(perRank * rank);

export const spellCrit = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_SPELL_CRIT_CHANCE.set().PercentBase.set(perRank * rank);

export const meleeHit = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_HIT_CHANCE.set().PercentBase.set(perRank * rank);

export const spellHit = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_SPELL_HIT_CHANCE.set().PercentBase.set(perRank * rank);

export const meleeHaste = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_MELEE_HASTE.set().PercentBase.set(perRank * rank);

export const statPercent = (stat: StatName, perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_TOTAL_STAT_PERCENTAGE.set()
        .Stat.set(stat)
        .PercentBase.set(perRank * rank);

export const damageDone = (schools: SchoolName[], perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_DAMAGE_PERCENT_DONE.set()
        .Schools.set(schools)
        .PercentBase.set(perRank * rank);

/** Use a negative value to reduce damage taken. */
export const damageTaken = (schools: SchoolName[], perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_DAMAGE_PERCENT_TAKEN.set()
        .Schools.set(schools)
        .PercentBase.set(perRank * rank);

export const attackPowerFromStat = (stat: StatName, perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_ATTACK_POWER_OF_STAT_PERCENT.set()
        .Stat.set(stat)
        .PercentBase.set(perRank * rank);

export const spellPowerFromStat = (stat: StatName, perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_SPELL_DAMAGE_OF_STAT_PERCENT.set()
        .Schools.set(MAGIC_SCHOOLS)
        .Stat.set(stat)
        .PercentBase.set(perRank * rank);

export const dodge = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_DODGE_PERCENT.set().PercentBase.set(perRank * rank);

export const parry = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_PARRY_PERCENT.set().PercentBase.set(perRank * rank);

export const block = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_BLOCK_PERCENT.set().PercentBase.set(perRank * rank);

export const armorFromItems = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_BASE_RESISTANCE_PCT.set()
        .Schools.set('PHYSICAL')
        .PercentBase.set(perRank * rank);

export const threat = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_THREAT.set()
        .School.set(ALL_SCHOOLS)
        .PercentBase.set(perRank * rank);

/** Use a negative value to make the caster harder to crit. */
export const attackerMeleeCrit = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_ATTACKER_MELEE_CRIT_CHANCE.set().PercentBase.set(perRank * rank);

/** Use a negative value to reduce costs. */
export const manaCost = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_POWER_COST_SCHOOL_PCT.set()
        .School.set(ALL_SCHOOLS)
        .PercentBase.set(perRank * rank);

export const manaRegenWhileCasting = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_MANA_REGEN_INTERRUPT.set().PercentBase.set(perRank * rank);

type SpellModOperation = keyof typeof SpellModOp;

/** Percentage modifier (damage, cost, threat, ...) on specific Battle Mage abilities. */
export const abilityPercent = (operation: SpellModOperation, perRank: number, abilities: RankedAbility[]): TalentEffect =>
    (effect, rank) => {
        effect.Aura.ADD_PCT_MODIFIER.set()
            .Operation.set(operation)
            .PercentBase.set(perRank * rank);
        targetAbilities(effect, abilities);
    };

/** Flat modifier (cooldown in ms, crit chance, ...) on specific Battle Mage abilities. */
export const abilityFlat = (operation: SpellModOperation, perRank: number, abilities: RankedAbility[]): TalentEffect =>
    (effect, rank) => {
        effect.Aura.ADD_FLAT_MODIFIER.set()
            .Operation.set(operation)
            .PointsBase.set(perRank * rank);
        targetAbilities(effect, abilities);
    };

function targetAbilities(effect: SpellEffect, abilities: RankedAbility[]) {
    abilities.forEach(ability => effect.ClassMask.setBit(ability.familyBit, true));
}
