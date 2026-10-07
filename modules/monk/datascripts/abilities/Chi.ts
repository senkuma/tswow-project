import { RankedAbility } from "classkit";
import { std } from "wow/wotlk";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { MODULE_NAME } from "../Constants";

/**
 * Chi, the Mists of Pandaria way, on top of WotLK combo points: builders
 * generate it and spenders cost a fixed amount of it, instead of finishing
 * moves that consume every combo point and grow stronger with them.
 *
 * Abilities whose own effects add combo points (Jab, Keg Smash) generate
 * Chi as they hit. The rest is handled by the livescripts
 * (livescripts/ChiAbilities.ts), which find these abilities through tags;
 * the addon gets the same spells from ChiAddonData.ts and shows their cost
 * as Chi orbs in their tooltips.
 */
export type ChiCost = 1 | 2 | 3;

// SPELL_ATTR1_REQ_COMBO_POINTS1/2: the client and server would require and consume every combo point.
const REQUIRES_COMBO_POINTS = 0x00100000 | 0x00400000;

/** Tags read by the livescripts; keep their names in step with livescripts/ChiAbilities.ts. */
export const CHI_TAGS = {
    cost: (chi: ChiCost) => `chi-cost-${chi}`,
    /** Abilities whose own effects add combo points; the Chi moves onto their target as they are cast. */
    builder: 'chi-builder',
    /** Abilities that generate 1 Chi when cast, as nothing they hit can hold combo points (heals). */
    generatesOne: 'chi-gain-1',
    /** Abilities that generate 1 more Chi in Stance of the Fierce Tiger. */
    tigerStanceBonus: 'chi-gain-tiger-stance',
    tigerStance: 'stance-of-the-fierce-tiger',
    comboBreaker: 'combo-breaker',
    /** The spender Combo Breaker makes free. */
    blackoutKick: 'blackout-kick',
    touchOfDeath: 'touch-of-death',
    /** Uplift heals everyone with the monk's Renewing Mist, through Uplift's heal. */
    uplift: 'uplift',
    renewingMist: 'renewing-mist',
    upliftHeal: 'uplift-heal',
    /** Each second of Soothing Mist may generate Chi. */
    soothingMist: 'soothing-mist',
    /** Heals cast while channeling Soothing Mist, which keep the channel going. */
    soothingMistWeave: 'soothing-mist-weave',
    /** Shortens a resumed Soothing Mist to the time the interrupted channel had left. */
    soothingMistResume: 'soothing-mist-resume',
} as const;

const taggedSpellIds: { [tag: string]: number[] } = {};

/** The ability costs `chi` Chi, spent by the livescripts, and no longer needs or consumes combo points. */
export function costsChi(ability: RankedAbility, chi: ChiCost) {
    ability.ranks.forEach(rank => {
        stopRequiringComboPoints(rank);
        tagSpell(rank.ID, CHI_TAGS.cost(chi));
    });
}

function stopRequiringComboPoints(rank: Spell) {
    rank.row.AttributesEx.set((rank.row.AttributesEx.get() & ~REQUIRES_COMBO_POINTS) >>> 0);
}

export function tagAbility(ability: RankedAbility, tag: string) {
    ability.ranks.forEach(rank => tagSpell(rank.ID, tag));
}

export function tagSpell(spellId: number, tag: string) {
    std.Tags.add(MODULE_NAME, tag, spellId);
    (taggedSpellIds[tag] = taggedSpellIds[tag] ?? []).push(spellId);
}

/** The spells given `tag` so far. */
export function taggedSpells(tag: string): readonly number[] {
    return taggedSpellIds[tag] ?? [];
}
