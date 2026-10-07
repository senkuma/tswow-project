import { std } from "wow/wotlk";
import { SchoolMask } from "wow/wotlk/std/Misc/School";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { BATTLE_MAGE } from "../BattleMageClass";
import { BATTLE_MAGE_RACES, BATTLE_MAGE_SPELL_FAMILY, MODULE_NAME } from "../Constants";

export type SchoolName = keyof typeof SchoolMask;

/** How a character obtains the first rank; later ranks always come from the trainer. */
export type FirstRankSource = 'START' | 'TRAINER' | 'TALENT';

export interface AbilityDefinition {
    id: string;
    /** First spell of the WotLK rank chain whose ranks, levels and values are cloned. */
    parent: number;
    /** Uses only the first N ranks of the parent chain. */
    maxRanks?: number;
    /** Unique bit in the Battle Mage spell family, used by talents to target this ability. */
    familyBit: number;
    firstRankSource: FirstRankSource;
    name: string;
    description: string;
    icon: string;
    school: SchoolName;
    /** Spellbook tab. */
    skillLine: number;
    manaCostPercent: number;
    /** Parent effects that only work through the parent class's scripts or resources. */
    clearedEffects?: number[];
    customize?: (rank: Spell) => void;
}

export class RankedAbility {
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
}

export function createRankedAbility(definition: AbilityDefinition) {
    const parentRanks = parentRankChain(definition.parent)
        .slice(0, definition.maxRanks ?? Number.MAX_SAFE_INTEGER);
    const ranks = parentRanks.map((parentRank, index) => createRank(definition, parentRank, index));

    ranks.forEach((rank, index) => {
        if (ranks.length > 1) {
            rank.Rank.set(ranks[0].ID, index + 1);
        }
        const nextRank = ranks[index + 1];
        rank.SkillLines.addMod(definition.skillLine, BATTLE_MAGE.Mask, BATTLE_MAGE_RACES, ability => {
            ability.AcquireMethod.set(
                index === 0 && definition.firstRankSource === 'START' ? 'LEARN_ON_CREATE' : 'TRAINER');
            // Lets the client spellbook hide ranks that have been replaced.
            if (nextRank) {
                ability.SupercededBy.set(nextRank.ID);
            }
        });
    });

    return new RankedAbility(definition, ranks);
}

function parentRankChain(firstSpell: number) {
    const chain = std.SQL.spell_ranks.queryAll({ first_spell_id: firstSpell })
        .sort((a, b) => a.rank.get() - b.rank.get())
        .map(row => row.spell_id.get());
    return chain.length > 0 ? chain : [firstSpell];
}

function createRank(definition: AbilityDefinition, parentRank: number, index: number) {
    // The first rank keeps the bare id so abilities created before ranks existed keep their spell IDs.
    const id = index === 0 ? definition.id : `${definition.id}-rank-${index + 1}`;
    const rank = std.Spells.create(MODULE_NAME, id, parentRank)
        .Name.enGB.set(definition.name)
        .Description.enGB.set(definition.description)
        .Icon.setPath(definition.icon)
        .SchoolMask.set(definition.school)
        .ShapeshiftMask.Include.clearAll()
        .Family.set(BATTLE_MAGE_SPELL_FAMILY)
        .ClassMask.set(0, 0, 0)
        .ClassMask.setBit(definition.familyBit, true)
        .Power.Type.set('MANA')
        .Power.CostBase.set(0)
        .Power.CostPercent.set(definition.manaCostPercent);
    definition.clearedEffects?.forEach(effectIndex => rank.Effects.get(effectIndex).clear());
    definition.customize?.(rank);
    return rank;
}
