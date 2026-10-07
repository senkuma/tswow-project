import {
    createFamilySpell, createRankedAbility, DURATION, RADIUS, RankedAbility, RankSpec, scalesWithAttackPower,
    withAttackPower,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import { SKILL_BULWARK } from "../VoidKnightSkills";
import { FAMILY_BIT } from "./FamilyBits";
import { grantVoidShard, VOID_SHARDS } from "./VoidShards";

/**
 * The Bulwark: void barriers take the place of a shield. Warrior tanking
 * tools supply taunts, shouts and walls; mage and death knight spells
 * supply the absorbs and the self heal.
 */

// Parent spells. Rank chains supply WotLK levels and values.
const ICE_BARRIER = 11426;
const TAUNT = 355;
const THUNDER_CLAP = 6343;
const SUNDER_ARMOR = 7386;
const SUNDER_ARMOR_DEBUFF = 58567;    // the stacking armor reduction Sunder Armor triggers
const DEMORALIZING_SHOUT = 1160;
const POWER_WORD_FORTITUDE = 1243;
const RUNE_TAP = 48982;
const SHIELD_WALL = 871;
const SPELL_REFLECTION = 23920;
const CHALLENGING_SHOUT = 1161;
const INTERVENE = 3411;
const LAST_STAND = 12975;
const SHOCKWAVE = 46968;

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_SHADOW_WARD = 343;
const VISUAL_DARK_COMMAND = 34;
const VISUAL_SHADOW_NOVA = 7951;      // NPC Shadow Nova
const VISUAL_CORRUPTION = 8629;
const VISUAL_HOWL_OF_TERROR = 4801;
const VISUAL_SHADOW_PROTECTION = 27;
const VISUAL_DEATH_PACT = 3582;
const VISUAL_ANTI_MAGIC_SHELL = 127;
const VISUAL_GRAVITY_WELL = 10632;    // Gravity Well Effect, the engineering gravity well
const VISUAL_ICEBOUND_FORTITUDE = 11151;
const VISUAL_ANTI_MAGIC_ZONE = 11242;

// TrinityCore spell_group ids of the parents, so the clones keep their stacking rules.
const ATTACK_POWER_REDUCTION_GROUP = 1062;
const STAMINA_BUFF_GROUP = 1074;
// SpellRange.dbc row of spells with no target.
const RANGE_SELF_ONLY = 1;

// Mantle of the Void is the class's signature buff: twice Fortitude's Stamina,
// and on the endgame rank enough to keep pace with the server's endgame gear.
const SIGNATURE_BUFF_MULTIPLIER = 2;
const ENDGAME_RANK_MIN_LEVEL = 78;

const UNRAVEL_THREAT = 300;
const AP_CRUSHING_WEIGHT = 0.12;
const AP_GRAVITON_SHOCKWAVE = 0.75;

const handMadeRanks = (ranks: [level: number, value: number][], effectIndex = 0): RankSpec[] =>
    ranks.map(([level, value]) => ({
        level,
        configure: rank => rank.Effects.get(effectIndex).PointsBase.set(value),
    }));

/** Absorb ranks: absorbs do not scale with attack power, so the endgame rank grows with endgame gear instead. */
const absorbRanks = (ranks: [level: number, absorb: number][]): RankSpec[] =>
    handMadeRanks(ranks.map(([level, absorb]) => [
        level,
        level >= ENDGAME_RANK_MIN_LEVEL ? Math.round(absorb * ENDGAME_POWER_FACTOR) : absorb,
    ]));

/** Moves a cloned chain's first rank to `level`; the later ranks keep the chain's levels. */
function firstRankAt(rank: Spell, rankIndex: number, level: number) {
    if (rankIndex === 0) {
        rank.Levels.Spell.set(level).Levels.Base.set(level);
    }
}

/**
 * Gives a rank its own cooldown. Clones keep the parent's cooldown category,
 * which other spells share (Shield Wall's is Recklessness's and Retaliation's).
 */
function ownCooldown(rank: Spell, cooldownMs: number) {
    rank.Cooldown.Category.set(0)
        .Cooldown.CategoryTime.set(0)
        .Cooldown.Time.set(cooldownMs);
}

/** Void Knights carry no shields; void barriers take their place. */
function noShieldRequired(rank: Spell) {
    rank.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
}

/** Ice Barrier's absorb, with its value set by the rank itself rather than per level. */
function voidAbsorb(rank: Spell) {
    rank.Effects.get(0).PointsPerLevel.set(0);
    rank.AuraDescription.enGB.set('Absorbs damage.');
}

// ---------------------------------------------------------------- void barriers

export const VOID_BARRIER = createRankedAbility(VK, {
    id: 'void-barrier',
    parent: ICE_BARRIER,
    // Ice Barrier starts at 40; the barrier is the class's shield from level 10.
    ranks: absorbRanks([
        [10, 60], [20, 150], [30, 280], [40, 450], [50, 700], [60, 1000], [70, 1500], [80, 2400],
    ]),
    familyBit: FAMILY_BIT.VOID_BARRIER,
    firstRankSource: 'TRAINER',
    name: 'Void Barrier',
    description: 'Surrounds you with a barrier of void that absorbs $s1 damage.  Lasts $d.'
        + `  Each Void Shard consumed increases the amount absorbed by $${VOID_SHARDS.ID}s2%.`,
    icon: 'Spell_Shadow_SacrificialShield',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_SHADOW_WARD },
    customize: rank => {
        ownCooldown(rank, 8000);
        rank.Duration.set(DURATION.SEC_30);
        voidAbsorb(rank);
    },
});

export const ANCHOR = createRankedAbility(VK, {
    id: 'anchor',
    parent: TAUNT,
    ranks: [{ level: 10 }],
    familyBit: FAMILY_BIT.ANCHOR,
    firstRankSource: 'TRAINER',
    name: 'Anchor',
    description: 'Anchors the target to you, forcing it to attack you and raising your threat against it'
        + ' to the top for $d.',
    icon: 'Spell_Shadow_Possession',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_DARK_COMMAND },
    customize: rank => {
        ownCooldown(rank, 8000);
        rank.AuraDescription.enGB.set('Forced to attack the Void Knight.');
    },
});

// ---------------------------------------------------------------- threat

export const CRUSHING_WEIGHT = createRankedAbility(VK, {
    id: 'crushing-weight',
    parent: THUNDER_CLAP,
    familyBit: FAMILY_BIT.CRUSHING_WEIGHT,
    firstRankSource: 'TRAINER',
    name: 'Crushing Weight',
    description: 'Presses enemies within $a1 yards under the weight of the void, dealing '
        + withAttackPower('$m1', AP_CRUSHING_WEIGHT) + ' Shadow damage and slowing their attack speed by $s2%'
        + ' for $d.  Grants a Void Shard.',
    icon: 'Spell_Shadow_Requiem',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_SHADOW_NOVA },
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 8);
        ownCooldown(rank, 6000);
        rank.AuraDescription.enGB.set('Attack speed reduced by $s2%.');
        // Thunder Clap's attack power bonus is a spell_bonus_data row of the parent's id.
        scalesWithAttackPower(rank, AP_CRUSHING_WEIGHT);
        grantVoidShard(rank.Effects.get(2));
    },
});

/** The stacking armor reduction Unravel applies. */
export const UNRAVEL_DEBUFF = createFamilySpell(VK, {
    id: 'unravel-debuff',
    parent: SUNDER_ARMOR_DEBUFF,
    familyBit: FAMILY_BIT.BULWARK_PROC_7,
    name: 'Unravel',
    icon: 'Spell_Shadow_UnstableAffliction_3',
    school: 'SHADOW',
    visual: { id: VISUAL_CORRUPTION },
    configure: spell => {
        spell.AuraDescription.enGB.set('Armor decreased by $s1%.');
        // The threat Sunder Armor causes comes from the parent's spell_threat row.
        spell.Effects.get(1).PointsBase.set(UNRAVEL_THREAT);
    },
});

export const UNRAVEL = createRankedAbility(VK, {
    id: 'unravel',
    parent: SUNDER_ARMOR,
    ranks: [{ level: 12 }],
    familyBit: FAMILY_BIT.UNRAVEL,
    firstRankSource: 'TRAINER',
    name: 'Unravel',
    description: `Unravels the target's armor, reducing it by $${UNRAVEL_DEBUFF.ID}s1% per application.`
        + `  Stacks up to $${UNRAVEL_DEBUFF.ID}u times and lasts $${UNRAVEL_DEBUFF.ID}d.`
        + '  Causes a high amount of threat.',
    icon: 'Spell_Shadow_UnstableAffliction_3',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 15 },
    customize: rank => rank.Effects.get(0).TriggerSpell.set(UNRAVEL_DEBUFF.ID),
});

export const ENTROPIC_SHOUT = createRankedAbility(VK, {
    id: 'entropic-shout',
    parent: DEMORALIZING_SHOUT,
    familyBit: FAMILY_BIT.ENTROPIC_SHOUT,
    firstRankSource: 'TRAINER',
    name: 'Entropic Shout',
    description: 'Lets out a shout that drains the strength of enemies within $a1 yards, reducing their melee'
        + ' attack power by $s1 for $d.',
    icon: 'Spell_Shadow_PsychicScream',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_HOWL_OF_TERROR },
    spellGroup: ATTACK_POWER_REDUCTION_GROUP,
    customize: rank => rank.AuraDescription.enGB.set('Melee attack power reduced by $s1.'),
});

export const MANTLE_OF_THE_VOID = createRankedAbility(VK, {
    id: 'mantle-of-the-void',
    parent: POWER_WORD_FORTITUDE,
    familyBit: FAMILY_BIT.MANTLE_OF_THE_VOID,
    firstRankSource: 'TRAINER',
    name: 'Mantle of the Void',
    description: 'Wraps your party and raid members within $a1 yards in the mantle of the void, increasing'
        + ' their Stamina by $s1 for $d.',
    icon: 'Spell_Shadow_DemonicFortitude',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_SHADOW_PROTECTION },
    spellGroup: STAMINA_BUFF_GROUP,
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 6);
        rank.Duration.set(DURATION.MIN_60)
            .Range.set(RANGE_SELF_ONLY)
            .AuraDescription.enGB.set('Stamina increased by $s1.');
        const stamina = rank.Effects.get(0);
        // Fortitude buffs one ally; the mantle covers the raid like a shout.
        stamina.ImplicitTargetA.set('UNIT_CASTER_AREA_RAID').Radius.set(RADIUS.YARDS_30);
        const multiplier = rank.Levels.Spell.get() >= ENDGAME_RANK_MIN_LEVEL
            ? ENDGAME_POWER_FACTOR
            : SIGNATURE_BUFF_MULTIPLIER;
        stamina.PointsBase.set(Math.round(stamina.PointsBase.get() * multiplier));
    },
});

// ---------------------------------------------------------------- defensive cooldowns

export const SIPHON_THE_VOID = createRankedAbility(VK, {
    id: 'siphon-the-void',
    parent: RUNE_TAP,
    ranks: handMadeRanks([[18, 12]]),
    familyBit: FAMILY_BIT.SIPHON_THE_VOID,
    firstRankSource: 'TRAINER',
    name: 'Siphon the Void',
    description: 'Siphons strength from the void, restoring $s1% of your maximum health.'
        + `  Each Void Shard consumed increases the healing by $${VOID_SHARDS.ID}s2%.`,
    icon: 'Spell_Shadow_ImprovedVampiricEmbrace',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_DEATH_PACT },
    customize: rank => {
        rank.row.RuneCostID.set(0);
        rank.Cooldown.Time.set(30000);
    },
});

export const EVENT_HORIZON = createRankedAbility(VK, {
    id: 'event-horizon',
    parent: SHIELD_WALL,
    ranks: [{ level: 28 }],
    familyBit: FAMILY_BIT.EVENT_HORIZON,
    firstRankSource: 'TRAINER',
    name: 'Event Horizon',
    description: 'Folds an event horizon around you that swallows the force of attacks, reducing all damage'
        + ' taken by $s1% for $d.',
    icon: 'Spell_Shadow_AntiMagicShell',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_ANTI_MAGIC_SHELL },
    customize: rank => {
        noShieldRequired(rank);
        ownCooldown(rank, 300000);
        rank.AuraDescription.enGB.set('All damage taken reduced by $s1%.');
    },
});

export const WARP_REFLECTION = createRankedAbility(VK, {
    id: 'warp-reflection',
    parent: SPELL_REFLECTION,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.WARP_REFLECTION,
    firstRankSource: 'TRAINER',
    name: 'Warp Reflection',
    description: 'Warps the space around you so that the next spell cast at you within $d is turned back'
        + ' on its caster.',
    icon: 'Spell_Shadow_NetherProtection',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 15 },
    customize: rank => {
        noShieldRequired(rank);
        rank.AuraDescription.enGB.set('Reflecting the next spell.');
    },
});

export const GRAVITY_WELL = createRankedAbility(VK, {
    id: 'gravity-well',
    parent: CHALLENGING_SHOUT,
    ranks: [{ level: 44 }],
    familyBit: FAMILY_BIT.GRAVITY_WELL,
    firstRankSource: 'TRAINER',
    name: 'Gravity Well',
    description: 'Opens a well of gravity around you, forcing all enemies within $a1 yards to attack you'
        + ' for $d.',
    icon: 'Spell_Shadow_EvilEye',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_GRAVITY_WELL },
    customize: rank => rank.AuraDescription.enGB.set('Forced to attack the Void Knight.'),
});

export const GUARDIAN_WARP = createRankedAbility(VK, {
    id: 'guardian-warp',
    parent: INTERVENE,
    ranks: [{ level: 52 }],
    familyBit: FAMILY_BIT.GUARDIAN_WARP,
    firstRankSource: 'TRAINER',
    name: 'Guardian Warp',
    description: 'Warps to a party or raid member, intercepting the next melee or ranged attack made'
        + ' against them within $d.',
    icon: 'Spell_Shadow_Teleport',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 10 },
    customize: rank => rank.AuraDescription.enGB.set('Protected by a Void Knight.'),
});

// ---------------------------------------------------------------- talents

export const OBSIDIAN_STAND = createRankedAbility(VK, {
    id: 'obsidian-stand',
    parent: LAST_STAND,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.OBSIDIAN_STAND,
    firstRankSource: 'TALENT',
    name: 'Obsidian Stand',
    description: 'Hardens your body like obsidian, increasing your maximum health by $s1% for $d.',
    icon: 'Spell_Shadow_AntiShadow',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'free' },
    visual: { id: VISUAL_ICEBOUND_FORTITUDE },
    customize: rank => {
        ownCooldown(rank, 180000);
        rank.Duration.set(DURATION.SEC_20)
            .AuraDescription.enGB.set('Maximum health increased by $s1%.');
        // Last Stand's health is a dummy effect the warrior script turns into a buff.
        const health = rank.Effects.get(0);
        health.clear();
        health.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_CASTER')
            .Aura.MOD_INCREASE_HEALTH_PERCENT.set()
            .PercentBase.set(30);
    },
});

export const BARRIER_PROJECTION = createRankedAbility(VK, {
    id: 'barrier-projection',
    parent: ICE_BARRIER,
    ranks: absorbRanks([[40, 350], [50, 550], [60, 800], [70, 1200], [80, 1900]]),
    familyBit: FAMILY_BIT.BARRIER_PROJECTION,
    firstRankSource: 'TALENT',
    name: 'Barrier Projection',
    description: 'Projects a void barrier onto every party and raid member within $a1 yards, absorbing'
        + ' $s1 damage.  Lasts $d.',
    icon: 'Spell_DeathKnight_AntiMagicZone',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_ANTI_MAGIC_ZONE },
    customize: rank => {
        ownCooldown(rank, 60000);
        rank.Duration.set(DURATION.SEC_30);
        voidAbsorb(rank);
        // A plain aura on each ally rather than an area aura, which would restore spent absorbs.
        rank.Effects.get(0).ImplicitTargetA.set('UNIT_CASTER_AREA_RAID').Radius.set(RADIUS.YARDS_30);
    },
});

export const GRAVITON_SHOCKWAVE = createRankedAbility(VK, {
    id: 'graviton-shockwave',
    parent: SHOCKWAVE,
    ranks: handMadeRanks([[60, 200]], 1),
    familyBit: FAMILY_BIT.GRAVITON_SHOCKWAVE,
    firstRankSource: 'TALENT',
    name: 'Graviton Shockwave',
    description: 'Sends a wave of crushing gravity through all enemies in a $a1 yard cone in front of you,'
        + ' dealing ' + withAttackPower('$m2', AP_GRAVITON_SHOCKWAVE) + ' Shadow damage and stunning them'
        + ' for $d.',
    icon: 'Spell_Shadow_ShadowPact',
    school: 'SHADOW',
    skillLine: SKILL_BULWARK,
    cost: { kind: 'rage', rage: 15 },
    // The warrior script's cooldown reduction when the wave hits three targets.
    clearedEffects: [2],
    customize: rank => {
        ownCooldown(rank, 20000);
        rank.AuraDescription.enGB.set('Stunned.');
        // Shockwave's damage is a placeholder its warrior script fills from attack power.
        scalesWithAttackPower(rank, AP_GRAVITON_SHOCKWAVE);
    },
});

/** Every Bulwark ability, talent abilities included. */
export const BULWARK_ABILITIES: RankedAbility[] = [
    VOID_BARRIER, ANCHOR, CRUSHING_WEIGHT, UNRAVEL, ENTROPIC_SHOUT, MANTLE_OF_THE_VOID, SIPHON_THE_VOID,
    EVENT_HORIZON, WARP_REFLECTION, GRAVITY_WELL, GUARDIAN_WARP, OBSIDIAN_STAND, BARRIER_PROJECTION,
    GRAVITON_SHOCKWAVE,
];
