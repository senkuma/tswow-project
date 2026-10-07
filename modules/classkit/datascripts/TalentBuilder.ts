import { std } from "wow/wotlk";
import { SpellModOp, StatMod } from "wow/wotlk/std/Spell/EffectTemplates/AuraTemplates";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { SpellEffect } from "wow/wotlk/std/Spell/SpellEffect";
import { SpellEffectMechanic } from "wow/wotlk/std/Spell/SpellEffectMechanics";
import { Talent } from "wow/wotlk/std/Talents/Talent";
import { TalentTree } from "wow/wotlk/std/Talents/TalentTree";
import { ClassContext, FamilyTarget } from "./ClassContext";
import { procMask } from "./ProcFlags";
import { RankedAbility, SchoolName } from "./RankedAbility";

// Cruelty rank 1: a plain passive talent spell, used as the template for generated talents.
const PASSIVE_TALENT_TEMPLATE = 12320;
const POINTS_PER_TALENT_ROW = 5;

export const MAGIC_SCHOOLS: SchoolName[] = ['HOLY', 'FIRE', 'NATURE', 'FROST', 'SHADOW', 'ARCANE'];
export const ALL_SCHOOLS: SchoolName[] = ['PHYSICAL', ...MAGIC_SCHOOLS];

type StatName = keyof typeof StatMod;
type SpellModOperation = keyof typeof SpellModOp;

/** Configures one effect of a talent rank spell; `rank` is 1-based. */
export type TalentEffect = (effect: SpellEffect, rank: number) => void;
/** Configures a talent rank spell as a whole (procs, cooldowns, ...); `rank` is 1-based. */
export type TalentSpellConfig = (spell: Spell, rank: number) => void;

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
    configure?: TalentSpellConfig;
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

/** Escape hatch for talents built some other way. */
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
    /** Name of an Interface\TalentFrame background set, e.g. "WarriorArms". */
    background: string;
    icon: string;
    talents: TalentDefinition[];
}

export function createTalentTree(context: ClassContext, definition: TalentTreeDefinition): TalentTree {
    assertTiersReachable(definition);
    const tree = context.cls.TalentTrees.addGet(context.module, definition.id, definition.tabIndex)
        .Name.enGB.set(definition.name)
        .BackgroundImage.set(definition.background)
        .Icon.setPath(definition.icon);

    const talents = new Map<string, Talent>();
    definition.talents.forEach(talentDefinition => {
        const rankSpells = createRankSpells(context, definition.id, talentDefinition);
        tagTalentRanks(context, definition.id, rankSpells);
        talents.set(talentDefinition.id,
            tree.Talents.addGet(context.module, `${definition.id}-${talentDefinition.id}`)
                .Position.set(talentDefinition.row, talentDefinition.column)
                .Spells.add(rankSpells.map(spell => spell.ID)));
    });

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

/**
 * Tags each rank spell as `<module>:<tree>-talent-rank-<n>`, so livescripts can
 * count the points a player has spent in a tree: TrinityCore only keeps a
 * talent's current rank, so `HasTalent(spell of rank n)` means n points.
 */
export function talentRankTag(treeId: string, rank: number) {
    return `${treeId}-talent-rank-${rank}`;
}

function tagTalentRanks(context: ClassContext, treeId: string, rankSpells: Spell[]) {
    rankSpells.forEach((spell, index) => std.Tags.add(context.module, talentRankTag(treeId, index + 1), spell.ID));
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

function createRankSpells(context: ClassContext, treeId: string, definition: TalentDefinition): Spell[] {
    switch (definition.kind) {
        case 'passive':
            return range(definition.ranks).map(rank => createPassiveRank(context, treeId, definition, rank));
        case 'cloned':
            return definition.parentRanks.map((parent, index) =>
                std.Spells.create(context.module, `${treeId}-${definition.id}-rank-${index + 1}`, parent));
        case 'active':
            return [definition.ability.firstRank];
        case 'custom':
            return definition.createRanks();
    }
}

function createPassiveRank(context: ClassContext, treeId: string, definition: PassiveTalent, rank: number) {
    return createPassiveSpell(context, `${treeId}-${definition.id}-rank-${rank}`, definition, rank);
}

export interface PassiveSpellDefinition {
    name: string;
    description: string;
    icon: string;
    effects: TalentEffect[];
    configure?: TalentSpellConfig;
}

/**
 * A passive aura spell built from effect builders, as used by talents, item
 * set bonuses and other "while you have this" effects. `rank` scales the
 * per-rank values of the effect builders.
 */
export function createPassiveSpell(context: ClassContext, id: string, definition: PassiveSpellDefinition, rank = 1) {
    const spell = std.Spells.create(context.module, id, PASSIVE_TALENT_TEMPLATE)
        .Name.enGB.set(definition.name)
        .Description.enGB.set(definition.description)
        .Icon.setPath(definition.icon)
        // Lets spell modifiers in this spell target the class's abilities.
        .Family.set(context.spellFamily)
        .ClassMask.set(0, 0, 0)
        .Effects.clearAll();
    // Cruelty only counts melee weapons; generated passives apply regardless of weapon.
    spell.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
    setSelfAuraEffects(spell, definition.effects, rank);
    definition.configure?.(spell, rank);
    return spell;
}

/**
 * Turns the first effects of `spell` into auras on the caster, built by
 * effect builders, e.g. for buffs whose auras come from talent-style builders.
 */
export function setSelfAuraEffects(spell: Spell, effects: TalentEffect[], rank = 1) {
    effects.forEach((configure, index) => configure(
        spell.Effects.get(index).Type.APPLY_AURA.set().ImplicitTargetA.set('UNIT_CASTER'),
        rank));
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

export const movementSpeed = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_INCREASE_SPEED.set().PercentBase.set(perRank * rank);

export const statPercent = (stat: StatName, perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_TOTAL_STAT_PERCENTAGE.set()
        .Stat.set(stat)
        .PercentBase.set(perRank * rank);

export const attackPowerPercent = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_ATTACK_POWER_PCT.set().PercentBase.set(perRank * rank);

export const maxHealthPercent = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_INCREASE_HEALTH_PERCENT.set().PercentBase.set(perRank * rank);

export const damageDone = (schools: SchoolName[], perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_DAMAGE_PERCENT_DONE.set()
        .Schools.set(schools)
        .PercentBase.set(perRank * rank);

/** Use a negative value to reduce damage taken. */
export const damageTaken = (schools: SchoolName[], perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_DAMAGE_PERCENT_TAKEN.set()
        .Schools.set(schools)
        .PercentBase.set(perRank * rank);

/** Increases healing done by the owner's spells. */
export const healingDone = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_HEALING_DONE_PERCENT.set()
        .Schools.set(ALL_SCHOOLS)
        .PercentBase.set(perRank * rank);

export const powerRegenPercent = (power: 'MANA' | 'RAGE' | 'ENERGY', perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_POWER_REGEN_PERCENT.set()
        .PowerType.set(power)
        .PowerPctBase.set(perRank * rank);

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

/** Use a negative value to shorten stuns on the caster. */
export const stunDuration = (perRank: number): TalentEffect => (effect, rank) => {
    effect.Aura.MECHANIC_DURATION_MOD.set().PercentBase.set(perRank * rank);
    // TrinityCore reads the mechanic id from MiscValueA (as Iron Will does);
    // TSWoW's typed `Mechanics` setter writes a mask to MiscValueB instead.
    effect.MiscValueA.set(SpellEffectMechanic.STUNNED);
};

/** Use a negative value to reduce costs. */
export const manaCost = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_POWER_COST_SCHOOL_PCT.set()
        .School.set(ALL_SCHOOLS)
        .PercentBase.set(perRank * rank);

export const manaRegenWhileCasting = (perRank: number): TalentEffect => (effect, rank) =>
    effect.Aura.MOD_MANA_REGEN_INTERRUPT.set().PercentBase.set(perRank * rank);

/** Percentage modifier (damage, cost, threat, ...) on specific class abilities. */
export const abilityPercent = (operation: SpellModOperation, perRank: number, targets: FamilyTarget[]): TalentEffect =>
    (effect, rank) => {
        effect.Aura.ADD_PCT_MODIFIER.set()
            .Operation.set(operation)
            .PercentBase.set(perRank * rank);
        targetAbilities(effect, targets);
    };

/** Flat modifier (cooldown in ms, crit chance, range, ...) on specific class abilities. */
export const abilityFlat = (operation: SpellModOperation, perRank: number, targets: FamilyTarget[]): TalentEffect =>
    (effect, rank) => {
        effect.Aura.ADD_FLAT_MODIFIER.set()
            .Operation.set(operation)
            .PointsBase.set(perRank * rank);
        targetAbilities(effect, targets);
    };

/** Casts `spell` when the talent's proc conditions are met; pair with a proc config such as {@link onMeleeHit}. */
export const triggerSpell = (spell: number): TalentEffect => effect => {
    effect.Aura.PROC_TRIGGER_SPELL.set().TriggeredSpell.set(spell);
};

function targetAbilities(effect: SpellEffect, targets: FamilyTarget[]) {
    targets.forEach(target => effect.ClassMask.setBit(target.familyBit, true));
}

/** Which hits a proc reacts to; TrinityCore treats 0 as normal and critical hits. */
export type ProcHits = 'ANY' | 'CRITICAL';

/**
 * Procs on melee hits, both white swings and melee abilities.
 * `cooldownMs` is an internal cooldown between procs.
 */
export const onMeleeHit = (chancePerRank: number, cooldownMs = 0, hits: ProcHits = 'ANY'): TalentSpellConfig =>
    (spell, rank) => {
        // DBC proc flags and chance must be set before the spell_proc row exists,
        // since creating it copies them; TypeMask is the first write that creates it.
        spell.Proc.TriggerMask.set(procMask(['DONE_MELEE_AUTO_ATTACK', 'DONE_MELEE_SPELL']));
        spell.Proc.Chance.set(chancePerRank * rank);
        spell.Proc.TypeMask.set('DAMAGE');
        spell.Proc.PhaseMask.set('HIT');
        if (hits === 'CRITICAL') {
            spell.Proc.HitMask.set('CRITICAL');
        }
        std.SQL.spell_proc.query({ SpellId: spell.ID }).Cooldown.set(cooldownMs);
    };

/**
 * Procs only when one of `targets` (class abilities) hits, whatever its damage class.
 * `cooldownMs` is an internal cooldown between procs.
 */
export const onAbilityHit = (
    context: ClassContext,
    chancePerRank: number,
    targets: FamilyTarget[],
    hits: ProcHits = 'ANY',
    cooldownMs = 0,
): TalentSpellConfig =>
    (spell, rank) => {
        // See onMeleeHit for why the DBC fields come first.
        spell.Proc.TriggerMask.set(procMask(['DONE_MELEE_SPELL', 'DONE_RANGED_SPELL', 'DONE_MAGIC_SPELL_NEGATIVE']));
        spell.Proc.Chance.set(chancePerRank * rank);
        spell.Proc.TypeMask.set('DAMAGE');
        spell.Proc.PhaseMask.set('HIT');
        if (hits === 'CRITICAL') {
            spell.Proc.HitMask.set('CRITICAL');
        }
        restrictProcToFamily(context, spell, targets);
        std.SQL.spell_proc.query({ SpellId: spell.ID }).Cooldown.set(cooldownMs);
    };

/**
 * Limits an existing spell_proc row to spells of the class's family that are
 * one of `targets`, replacing any family mask cloned from a parent spell.
 */
export function restrictProcToFamily(context: ClassContext, spell: Spell, targets: FamilyTarget[]) {
    spell.Proc.SpellFamily.set(context.spellFamily);
    const familyMask = spell.Proc.ClassMask;
    [familyMask.A, familyMask.B, familyMask.C].forEach(part => part.clearAll());
    targets.forEach(target => {
        const part = [familyMask.A, familyMask.B, familyMask.C][Math.floor(target.familyBit / 32)];
        part.setBit(target.familyBit % 32, true);
    });
}

/** Procs on killing blows against enemies that yield experience or honor. */
export const onKillingBlow = (chancePerRank: number): TalentSpellConfig => (spell, rank) => {
    // See onMeleeHit for why the DBC fields come first.
    spell.Proc.TriggerMask.set(procMask(['KILL']));
    spell.Proc.Chance.set(chancePerRank * rank);
    spell.Proc.AttributesMask.set('REQUIRE_EXP_OR_HONOR');
};

/** Procs when the owner is struck by melee attacks or melee abilities. */
export const onMeleeHitTaken = (chancePerRank: number, cooldownMs = 0): TalentSpellConfig => (spell, rank) => {
    // See onMeleeHit for why the DBC fields come first.
    spell.Proc.TriggerMask.set(procMask(['TAKEN_MELEE_AUTO_ATTACK', 'TAKEN_MELEE_SPELL']));
    spell.Proc.Chance.set(chancePerRank * rank);
    spell.Proc.TypeMask.set('DAMAGE');
    spell.Proc.PhaseMask.set('HIT');
    std.SQL.spell_proc.query({ SpellId: spell.ID }).Cooldown.set(cooldownMs);
};
