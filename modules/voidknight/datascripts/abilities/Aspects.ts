import {
    ALL_SCHOOLS, armorFromItems, createRankedAbility, damageDone, damageTaken, meleeHaste, movementSpeed,
    RankedAbility, setSelfAuraEffects, TalentEffect, threat,
} from "classkit";
import { std } from "wow/wotlk";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import { SKILL_BULWARK, SKILL_GRAVITY, SKILL_RIFT } from "../VoidKnightSkills";
import { FAMILY_BIT } from "./FamilyBits";

/**
 * The Void Knight's stances: one Aspect at a time, as warriors hold one
 * stance. They are plain permanent self auras in one exclusive spell group
 * rather than shapeshift forms, so no ability depends on the stance bar.
 */

// Aspect of the Monkey: a permanent, untargeted self aura with no cost.
const ASPECT_OF_THE_MONKEY = 13163;
const VISUAL_UNHOLY_PRESENCE = 11116;  // the death knight presences' swirl of dark energy
// A TrinityCore spell_group id unused by TDB and the other modules (the Monk's stances use 2300).
const ASPECT_GROUP = 2410;
const SPELL_GROUP_EXCLUSIVE = 1;

interface AspectDefinition {
    id: string;
    familyBit: number;
    level: number;
    name: string;
    description: string;
    auraDescription: string;
    icon: string;
    skillLine: number;
    effects: TalentEffect[];
}

/** A permanent self aura; casting another Aspect replaces it. */
function createAspect(definition: AspectDefinition) {
    const aspect = createRankedAbility(VK, {
        id: definition.id,
        parent: ASPECT_OF_THE_MONKEY,
        ranks: [{ level: definition.level }],
        familyBit: definition.familyBit,
        firstRankSource: definition.level === 1 ? 'START' : 'TRAINER',
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        school: 'SHADOW',
        skillLine: definition.skillLine,
        cost: { kind: 'free' },
        globalCooldown: GLOBAL_COOLDOWN_MS,
        visual: { id: VISUAL_UNHOLY_PRESENCE },
        customize: rank => {
            rank.AuraDescription.enGB.set(definition.auraDescription);
            // Aspect of the Monkey's dodge, its PvP aura and the hunter aspect trigger.
            [0, 1, 2].forEach(index => rank.Effects.get(index).clear());
            setSelfAuraEffects(rank, definition.effects);
        },
    });
    std.SQL.spell_group.add(ASPECT_GROUP, aspect.firstRank.ID);
    return aspect;
}

std.SQL.spell_group_stack_rules.add(ASPECT_GROUP, { stack_rule: SPELL_GROUP_EXCLUSIVE });

export const ASPECT_OF_GRAVITY = createAspect({
    id: 'aspect-of-gravity',
    familyBit: FAMILY_BIT.ASPECT_OF_GRAVITY,
    level: 1,
    name: 'Aspect of Gravity',
    description: 'Bends gravity around your blows, increasing all damage you deal by $s1% and reducing the'
        + ' threat you cause by $s2%.  Only one Aspect can be active at a time.',
    auraDescription: 'Damage done increased by $s1%.  Threat reduced by $s2%.',
    icon: 'Spell_Shadow_UnholyFrenzy',
    skillLine: SKILL_GRAVITY,
    effects: [damageDone(ALL_SCHOOLS, 10), threat(-20)],
});

export const ASPECT_OF_THE_BULWARK = createAspect({
    id: 'aspect-of-the-bulwark',
    familyBit: FAMILY_BIT.ASPECT_OF_THE_BULWARK,
    level: 10,
    name: 'Aspect of the Bulwark',
    description: 'Wraps you in a lattice of void, reducing all damage taken by $s1%, increasing your armor'
        + ' from items by $s2% and the threat you cause by $s3%.  Only one Aspect can be active at a time.',
    auraDescription: 'Damage taken reduced by $s1%.  Armor increased by $s2%.  Threat increased by $s3%.',
    icon: 'Spell_Shadow_AntiShadow',
    skillLine: SKILL_BULWARK,
    effects: [damageTaken(ALL_SCHOOLS, -10), armorFromItems(60), threat(80)],
});

export const ASPECT_OF_THE_RIFT = createAspect({
    id: 'aspect-of-the-rift',
    familyBit: FAMILY_BIT.ASPECT_OF_THE_RIFT,
    level: 30,
    name: 'Aspect of the Rift',
    description: 'Keeps a sliver of you a step ahead in space, increasing your melee attack speed by $s1%'
        + ' and your movement speed by $s2%.  Only one Aspect can be active at a time.',
    auraDescription: 'Melee attack speed increased by $s1%.  Movement speed increased by $s2%.',
    icon: 'Spell_Arcane_PortalShattrath',
    skillLine: SKILL_RIFT,
    effects: [meleeHaste(10), movementSpeed(10)],
});

export const ASPECTS: RankedAbility[] = [ASPECT_OF_GRAVITY, ASPECT_OF_THE_BULWARK, ASPECT_OF_THE_RIFT];
