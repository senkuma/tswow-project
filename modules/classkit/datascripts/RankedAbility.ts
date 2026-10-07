import { std } from "wow/wotlk";
import { SchoolMask } from "wow/wotlk/std/Misc/School";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext, FamilyTarget } from "./ClassContext";

export type SchoolName = keyof typeof SchoolMask;

/** How a character obtains the first rank; later ranks always come from the trainer. */
export type FirstRankSource = 'START' | 'TRAINER' | 'TALENT';

export type AbilityCost =
    /** Keep whatever the parent spell costs. */
    | { kind: 'parent' }
    | { kind: 'free' }
    | { kind: 'mana-percent', percent: number }
    | { kind: 'rage', rage: number }
    | { kind: 'energy', energy: number };

/** TrinityCore only starts a global cooldown for spells in this category. */
const STANDARD_GLOBAL_COOLDOWN_CATEGORY = 133;

/** A rank defined by hand instead of copied from a parent rank chain. */
export interface RankSpec {
    level: number;
    configure?: (rank: Spell) => void;
}

export interface AbilityVisual {
    /** SpellVisual.dbc entry, usually borrowed from a spell with fitting effects. */
    id: number;
    /** Projectile speed in yards per second, needed when the visual is a missile. */
    missileSpeed?: number;
}

export interface AbilityDefinition {
    id: string;
    /**
     * Spell the ranks are cloned from. Without `ranks`, every rank of its
     * WotLK rank chain is cloned, keeping that chain's levels and values.
     */
    parent: number;
    /** Uses only the first N ranks of the parent chain. */
    maxRanks?: number;
    /** Hand-made ranks, each cloned from `parent`; for parents without a rank chain. */
    ranks?: RankSpec[];
    /** Unique bit in the class's spell family, used by talents to target this ability. */
    familyBit: number;
    firstRankSource: FirstRankSource;
    name: string;
    description: string;
    icon: string;
    school: SchoolName;
    /** Spellbook tab. */
    skillLine: number;
    cost: AbilityCost;
    /**
     * Global cooldown in milliseconds, 0 for none. Without it the parent's is
     * kept, and NPC parents often have no global cooldown at all.
     */
    globalCooldown?: number;
    visual?: AbilityVisual;
    /** Parent effects that only work through the parent class's scripts or resources. */
    clearedEffects?: number[];
    /**
     * TrinityCore spell_group the ability joins, so it follows the same
     * stacking rules as the spell it replaces (e.g. Battle Shout's group).
     */
    spellGroup?: number;
    customize?: (rank: Spell, rankIndex: number) => void;
}

export class RankedAbility implements FamilyTarget {
    constructor(readonly definition: AbilityDefinition, readonly ranks: Spell[]) {}

    get firstRank() {
        return this.ranks[0];
    }

    get familyBit() {
        return this.definition.familyBit;
    }

    /** Ranks sold by the trainer; a first rank learned elsewhere is excluded. */
    get trainerRanks() {
        return this.definition.firstRankSource === 'TRAINER'
            ? this.ranks
            : this.ranks.slice(1);
    }

    previousRankOf(rank: Spell): Spell | undefined {
        return this.ranks[this.ranks.indexOf(rank) - 1];
    }
}

export function createRankedAbility(context: ClassContext, definition: AbilityDefinition) {
    const ranks = definition.ranks
        ? definition.ranks.map((spec, index) => createHandMadeRank(context, definition, spec, index))
        : parentRankChain(definition.parent)
            .slice(0, definition.maxRanks ?? Number.MAX_SAFE_INTEGER)
            .map((parentRank, index) => createRank(context, definition, parentRank, index));

    ranks.forEach((rank, index) => {
        if (ranks.length > 1) {
            rank.Rank.set(ranks[0].ID, index + 1);
        }
        const nextRank = ranks[index + 1];
        rank.SkillLines.addMod(definition.skillLine, context.cls.Mask, context.races, ability => {
            ability.AcquireMethod.set(
                index === 0 && definition.firstRankSource === 'START' ? 'LEARN_ON_CREATE' : 'TRAINER');
            // Lets the client spellbook hide ranks that have been replaced.
            if (nextRank) {
                ability.SupercededBy.set(nextRank.ID);
            }
        });
    });

    // spell_group entries cover a whole rank chain through its first rank.
    if (definition.spellGroup !== undefined) {
        std.SQL.spell_group.add(definition.spellGroup, ranks[0].ID);
    }

    return new RankedAbility(definition, ranks);
}

function parentRankChain(firstSpell: number) {
    const chain = std.SQL.spell_ranks.queryAll({ first_spell_id: firstSpell })
        .sort((a, b) => a.rank.get() - b.rank.get())
        .map(row => row.spell_id.get());
    return chain.length > 0 ? chain : [firstSpell];
}

function createHandMadeRank(context: ClassContext, definition: AbilityDefinition, spec: RankSpec, index: number) {
    const rank = createRank(context, definition, definition.parent, index)
        .Levels.Spell.set(spec.level)
        .Levels.Base.set(spec.level);
    if (definition.ranks!.length > 1) {
        rank.Subtext.enGB.set(`Rank ${index + 1}`);
    }
    spec.configure?.(rank);
    return rank;
}

function createRank(context: ClassContext, definition: AbilityDefinition, parentRank: number, index: number) {
    // The first rank keeps the bare id so its spell ID survives adding or removing ranks.
    const id = index === 0 ? definition.id : `${definition.id}-rank-${index + 1}`;
    const rank = std.Spells.create(context.module, id, parentRank)
        .Name.enGB.set(definition.name)
        .Description.enGB.set(definition.description)
        .Icon.setPath(definition.icon)
        .SchoolMask.set(definition.school)
        .ShapeshiftMask.Include.clearAll()
        .Family.set(context.spellFamily)
        .ClassMask.set(0, 0, 0)
        .ClassMask.setBit(definition.familyBit, true);
    applyCost(rank, definition.cost);
    if (definition.globalCooldown !== undefined) {
        rank.Cooldown.GlobalTime.set(definition.globalCooldown)
            .Cooldown.GlobalCategory.set(definition.globalCooldown > 0 ? STANDARD_GLOBAL_COOLDOWN_CATEGORY : 0);
    }
    if (definition.visual) {
        rank.Visual.set(definition.visual.id);
        if (definition.visual.missileSpeed !== undefined) {
            rank.Speed.set(definition.visual.missileSpeed);
        }
    }
    definition.clearedEffects?.forEach(effectIndex => rank.Effects.get(effectIndex).clear());
    definition.customize?.(rank, index);
    return rank;
}

function applyCost(rank: Spell, cost: AbilityCost) {
    switch (cost.kind) {
        case 'parent':
            return;
        case 'free':
            rank.Power.CostBase.set(0).Power.CostPercent.set(0);
            return;
        case 'mana-percent':
            rank.Power.Type.set('MANA').Power.CostBase.set(0).Power.CostPercent.set(cost.percent);
            return;
        case 'rage':
            // Rage costs are stored in tenths of a rage point.
            rank.Power.Type.set('RAGE').Power.CostBase.set(cost.rage * 10).Power.CostPercent.set(0);
            return;
        case 'energy':
            rank.Power.Type.set('ENERGY').Power.CostBase.set(cost.energy).Power.CostPercent.set(0);
            return;
    }
}
