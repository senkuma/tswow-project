import {
    createFamilySpell, createRankedAbility, DURATION, onMeleeHit, periodicDamageScalesWithAttackPower, RADIUS, RANGE,
    RankedAbility, RankSpec, scalesWithAttackPower, setSelfAuraEffects, triggerSpell, withAttackPower,
} from "classkit";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { SpellEffect } from "wow/wotlk/std/Spell/SpellEffect";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import { SKILL_GRAVITY } from "../VoidKnightSkills";
import { FAMILY_BIT } from "./FamilyBits";
import { grantVoidShard, VOID_SHARDS } from "./VoidShards";

/**
 * Gravity: the Void Knight's weight as a weapon. Strikes build Void Shards,
 * Collapse and Implosion spend them, and pulls, roots and black holes bend
 * the battlefield around the knight.
 */

// Parent spells. Rank chains supply WotLK levels and values; NPC spells
// (marked) supply mechanics with no player version.
const SINISTER_STRIKE = 1752;
const FROST_SHOCK = 8056;
const SHADOW_WHIP = 30638;            // NPC: pulls the target to the caster and lashes it
const ARCANE_EXPLOSION = 1449;
const FROST_NOVA = 122;
const BLOODRAGE = 2687;
const HEROIC_LEAP = 6544;
const HEROIC_LEAP_IMPACT = 52174;     // the landing: stun and weapon damage around the destination
const FLAMESTRIKE = 2120;
const DEATH_WISH = 12292;
const SHADOW_SHOCK = 16583;           // NPC: instant Shadow damage
const DEATH_AND_DECAY = 43265;

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_SCOURGE_STRIKE = 11832;  // a shadow-wreathed weapon strike
const VISUAL_SHADOW_WORD_DEATH = 8069;
const VISUAL_SHADOWFURY = 7732;
const VISUAL_SHADOW_NOVA = 7966;      // NPC Shadow Nova: a dark ring bursting from the caster
const VISUAL_SHADOW_STRIKE = 9338;
const VISUAL_UNHOLY_BLIGHT = 11095;
const VISUAL_DARK_PACT = 827;
const VISUAL_BLACK_HOLE = 10330;      // Black Hole Effect, the engineering black hole
const VISUAL_DARK_EMPOWERMENT = 4341;
const VISUAL_SHADOW_SHOCK = 4209;

// SpellCastTimes.dbc row of instant casts.
const CAST_TIME_INSTANT = 1;
// TrinityCore reads a pull's horizontal speed, in tenths of a yard per second, from MiscValueA
// (TSWoW calls the field SpeedZ); Gravity Well Effect pulls at 20 yards per second.
const PULL_SPEED = 200;

const AP_GRAVITY_LASH = 0.15;
const AP_GRAVITATIONAL_PULL = 0.1;
const AP_IMPLOSION = 0.2;
const AP_GRAVITY_LOCK = 0.05;
const AP_SINGULARITY = 0.15;
const AP_GRAVITON_BURST = 0.15;
const AP_STELLAR_COLLAPSE_PER_TICK = 0.08;
const GRAVITON_SURGE_CHANCE = 25;

const handMadeRanks = (ranks: [level: number, value: number][], effectIndex = 0): RankSpec[] =>
    ranks.map(([level, value]) => ({
        level,
        configure: rank => rank.Effects.get(effectIndex).PointsBase.set(value),
    }));

/** Moves a cloned chain's first rank to `level`; the later ranks keep the chain's levels. */
function firstRankAt(rank: Spell, rankIndex: number, level: number) {
    if (rankIndex === 0) {
        rank.Levels.Spell.set(level).Levels.Base.set(level);
    }
}

/**
 * Gives a rank its own cooldown. Clones keep the parent's cooldown category,
 * which other spells share (the shaman shocks share Frost Shock's).
 */
function ownCooldown(rank: Spell, cooldownMs: number) {
    rank.Cooldown.Category.set(0)
        .Cooldown.CategoryTime.set(0)
        .Cooldown.Time.set(cooldownMs);
}

/**
 * Hand-made ranks set their own values; the parent's growth per level would
 * otherwise add to them, counted from the new first level.
 */
function fixedValue(effect: SpellEffect) {
    effect.PointsPerLevel.set(0);
}

/** Collapse and Implosion only work with Void Shards to spend. */
function requiresVoidShards(rank: Spell) {
    rank.CasterAuraSpell.Include.set(VOID_SHARDS.ID);
}

/** Turns `effect` into a pull of every enemy around the spell's target location toward its center. */
function pullToDestination(effect: SpellEffect, radius: number) {
    effect.clear();
    effect.Type.PULL_TOWARDS_DEST.set()
        .ImplicitTargetA.set('UNIT_DEST_AREA_ENEMY')
        .Radius.set(radius);
    effect.MiscValueA.set(PULL_SPEED);
}

const SHARD_DAMAGE_TEXT = `  Each Void Shard consumed increases the damage by $${VOID_SHARDS.ID}s1%.`
    + '  Requires at least one Void Shard.';

// ---------------------------------------------------------------- builders

export const VOID_STRIKE = createRankedAbility(VK, {
    id: 'void-strike',
    parent: SINISTER_STRIKE,
    familyBit: FAMILY_BIT.VOID_STRIKE,
    firstRankSource: 'START',
    name: 'Void Strike',
    description: 'A void-charged strike that deals your weapon damage plus $m1 as Shadow damage'
        + ' and grants a Void Shard.',
    icon: 'Spell_DeathKnight_ScourgeStrike',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 15 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_SCOURGE_STRIKE },
    // Replaces the combo point.
    customize: rank => grantVoidShard(rank.Effects.get(1)),
});

export const GRAVITY_LASH = createRankedAbility(VK, {
    id: 'gravity-lash',
    parent: FROST_SHOCK,
    // Frost Shock starts at 20; the lash is learned at 6.
    ranks: handMadeRanks([
        [6, 20], [14, 45], [22, 80], [30, 120], [38, 165],
        [46, 215], [54, 275], [62, 340], [70, 420], [78, 510],
    ], 1),
    familyBit: FAMILY_BIT.GRAVITY_LASH,
    firstRankSource: 'TRAINER',
    name: 'Gravity Lash',
    description: 'Lashes the target with a whip of gravity, dealing ' + withAttackPower('$m2', AP_GRAVITY_LASH)
        + ' Shadow damage, slowing its movement by $s1% for $d and granting a Void Shard.',
    icon: 'Spell_Shadow_Cripple',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_SHADOW_WORD_DEATH },
    customize: rank => {
        ownCooldown(rank, 6000);
        rank.Duration.set(DURATION.SEC_4)
            .AuraDescription.enGB.set('Movement speed reduced by $s1%.');
        fixedValue(rank.Effects.get(1));
        scalesWithAttackPower(rank, AP_GRAVITY_LASH);
        grantVoidShard(rank.Effects.get(2));
    },
});

export const GRAVITATIONAL_PULL = createRankedAbility(VK, {
    id: 'gravitational-pull',
    parent: SHADOW_WHIP,
    ranks: handMadeRanks([[12, 30]], 1),
    familyBit: FAMILY_BIT.GRAVITATIONAL_PULL,
    firstRankSource: 'TRAINER',
    name: 'Gravitational Pull',
    description: 'Rips the target to you with a surge of gravity, dealing '
        + withAttackPower('$m2', AP_GRAVITATIONAL_PULL) + ' Shadow damage and forcing it to attack you for $d.',
    icon: 'Spell_Shadow_UnsummonBuilding',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // Shadow Whip reaches across any distance.
        rank.Range.set(RANGE.YARDS_30)
            .Duration.set(DURATION.SEC_3)
            .AuraDescription.enGB.set('Forced to attack the Void Knight.');
        ownCooldown(rank, 25000);
        scalesWithAttackPower(rank, AP_GRAVITATIONAL_PULL);
        rank.Effects.get(2).clear();
        rank.Effects.get(2).Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Aura.MOD_TAUNT.set();
    },
});

// ---------------------------------------------------------------- finishers

export const COLLAPSE = createRankedAbility(VK, {
    id: 'collapse',
    parent: SINISTER_STRIKE,
    ranks: handMadeRanks([
        [10, 25], [20, 50], [30, 85], [40, 125], [50, 170], [60, 220], [70, 280], [80, 350],
    ]),
    familyBit: FAMILY_BIT.COLLAPSE,
    firstRankSource: 'TRAINER',
    name: 'Collapse',
    description: 'Collapses the space around the target onto it, dealing $s2% of your weapon damage plus $m1'
        + ' as Shadow damage.' + SHARD_DAMAGE_TEXT,
    icon: 'Spell_Shadow_DeadofNight',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 25 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_SHADOWFURY },
    customize: rank => {
        requiresVoidShards(rank);
        // Replaces the combo point.
        rank.Effects.get(1).clear();
        rank.Effects.get(1).Type.WEAPON_PERCENT_DAMAGE.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Percentage.set(150);
    },
});

export const IMPLOSION = createRankedAbility(VK, {
    id: 'implosion',
    parent: ARCANE_EXPLOSION,
    familyBit: FAMILY_BIT.IMPLOSION,
    firstRankSource: 'TRAINER',
    name: 'Implosion',
    description: 'Implodes the space around you, dealing ' + withAttackPower('$m1', AP_IMPLOSION)
        + ' Shadow damage to all enemies within $a1 yards.' + SHARD_DAMAGE_TEXT,
    icon: 'Spell_Shadow_AbominationExplosion',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 30 },
    visual: { id: VISUAL_SHADOW_NOVA },
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 20);
        requiresVoidShards(rank);
        scalesWithAttackPower(rank, AP_IMPLOSION);
    },
});

// ---------------------------------------------------------------- utility

export const ANNIHILATE = createRankedAbility(VK, {
    id: 'annihilate',
    parent: SINISTER_STRIKE,
    ranks: handMadeRanks([[24, 40], [34, 80], [44, 130], [54, 190], [64, 260], [74, 340], [80, 420]]),
    familyBit: FAMILY_BIT.ANNIHILATE,
    firstRankSource: 'TRAINER',
    name: 'Annihilate',
    description: 'Crushes a failing foe out of existence, dealing $s2% of your weapon damage plus $m1'
        + ' as Shadow damage.  Only usable on enemies that have 20% or less health.',
    icon: 'Spell_Shadow_DeathScream',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 20 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_SHADOW_STRIKE },
    customize: rank => {
        rank.TargetAuraState.Include.set('HEALTHLESS_20_PERCENT');
        rank.Cooldown.Time.set(6000);
        // Replaces the combo point.
        rank.Effects.get(1).clear();
        rank.Effects.get(1).Type.WEAPON_PERCENT_DAMAGE.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Percentage.set(200);
    },
});

export const GRAVITY_LOCK = createRankedAbility(VK, {
    id: 'gravity-lock',
    parent: FROST_NOVA,
    // Frost Nova's later ranks start below 32.
    ranks: handMadeRanks([[32, 40], [44, 70], [56, 105], [68, 145], [78, 190]]),
    familyBit: FAMILY_BIT.GRAVITY_LOCK,
    firstRankSource: 'TRAINER',
    name: 'Gravity Lock',
    description: 'Crushes gravity around you, dealing ' + withAttackPower('$m1', AP_GRAVITY_LOCK)
        + ' Shadow damage to enemies within $a1 yards and pinning them in place for $d.'
        + '  Damage caused may interrupt the effect.',
    icon: 'Spell_Shadow_GrimWard',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_UNHOLY_BLIGHT },
    customize: rank => {
        ownCooldown(rank, 25000);
        rank.AuraDescription.enGB.set('Pinned in place by crushing gravity.');
        fixedValue(rank.Effects.get(0));
        scalesWithAttackPower(rank, AP_GRAVITY_LOCK);
    },
});

export const TAP_THE_VOID = createRankedAbility(VK, {
    id: 'tap-the-void',
    parent: BLOODRAGE,
    ranks: [{ level: 16 }],
    familyBit: FAMILY_BIT.TAP_THE_VOID,
    firstRankSource: 'TRAINER',
    name: 'Tap the Void',
    description: 'Draws on the Void at the cost of some of your health, generating $/10;s1 rage at once'
        + ' and $/10;s2 rage every $t2 sec for $d.',
    icon: 'Spell_Shadow_ManaBurn',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    // Bloodrage's cost: a share of base health.
    cost: { kind: 'parent' },
    visual: { id: VISUAL_DARK_PACT },
    customize: rank => {
        // Not an enrage: enrage removal effects should not strip it.
        rank.Mechanic.set(0);
        rank.DispelType.set('DISPEL_NONE');
        rank.Duration.set(DURATION.SEC_10)
            .AuraDescription.enGB.set('Generating $/10;s2 rage every $t2 sec.');
        // Bloodrage triggers the warrior's own rage-over-time aura; this one is the knight's.
        const overTime = rank.Effects.get(1);
        overTime.clear();
        overTime.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_CASTER')
            .Aura.PERIODIC_ENERGIZE.set()
            .PowerType.set('RAGE')
            .PowerBase.set(10)
            .Period.set(1000);
    },
});

/** Crushing Descent's landing. */
export const CRUSHING_DESCENT_IMPACT = createFamilySpell(VK, {
    id: 'crushing-descent-impact',
    parent: HEROIC_LEAP_IMPACT,
    familyBit: FAMILY_BIT.GRAVITY_PROC_7,
    name: 'Crushing Descent',
    icon: 'Ability_HeroicLeap',
    school: 'SHADOW',
    configure: spell => {
        spell.AuraDescription.enGB.set('Stunned.');
        [0, 1, 2].forEach(index => spell.Effects.get(index).Radius.set(RADIUS.YARDS_8));
        // The stun is flagged as a snare, which stun immunities would not stop.
        spell.Effects.get(0).Mechanic.STUNNED.set();
        spell.Effects.get(2).PointsBase.set(100);
    },
});

export const CRUSHING_DESCENT = createRankedAbility(VK, {
    id: 'crushing-descent',
    parent: HEROIC_LEAP,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.CRUSHING_DESCENT,
    firstRankSource: 'TRAINER',
    name: 'Crushing Descent',
    description: 'Leaps through the air toward a target location, slamming down with crushing gravity'
        + ` that deals $${CRUSHING_DESCENT_IMPACT.ID}s3% weapon damage to enemies within`
        + ` $${CRUSHING_DESCENT_IMPACT.ID}a1 yards and stuns them for $${CRUSHING_DESCENT_IMPACT.ID}d.`,
    icon: 'Ability_HeroicLeap',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'free' },
    customize: rank => {
        ownCooldown(rank, 45000);
        rank.Effects.get(1).TriggerSpell.set(CRUSHING_DESCENT_IMPACT.ID);
    },
});

// ---------------------------------------------------------------- talents

export const SINGULARITY = createRankedAbility(VK, {
    id: 'singularity',
    parent: FLAMESTRIKE,
    ranks: handMadeRanks([[20, 60], [30, 110], [40, 170], [50, 240], [60, 320], [70, 410], [80, 520]]),
    familyBit: FAMILY_BIT.SINGULARITY,
    firstRankSource: 'TALENT',
    name: 'Singularity',
    description: 'Collapses space at the target location, pulling every enemy within $a2 yards to its center'
        + ' and dealing ' + withAttackPower('$m1', AP_SINGULARITY) + ' Shadow damage to them.',
    icon: 'Spell_Shadow_Shadesofdarkness',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_BLACK_HOLE },
    customize: rank => {
        rank.row.CastingTimeIndex.set(CAST_TIME_INSTANT);
        rank.Cooldown.Time.set(20000);
        const damage = rank.Effects.get(0);
        damage.Radius.set(RADIUS.YARDS_15);
        fixedValue(damage);
        scalesWithAttackPower(rank, AP_SINGULARITY);
        // Flamestrike's burning ground.
        pullToDestination(rank.Effects.get(1), RADIUS.YARDS_15);
    },
});

/** Graviton Surge's proc: a burst of Shadow damage that leaves a Void Shard behind. */
export const GRAVITON_BURST = createFamilySpell(VK, {
    id: 'graviton-burst',
    parent: SHADOW_SHOCK,
    familyBit: FAMILY_BIT.GRAVITY_PROC_8,
    name: 'Graviton Burst',
    icon: 'Spell_Shadow_ShadowEmbrace',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOW_SHOCK },
    configure: spell => {
        spell.Power.CostBase.set(0);
        spell.Effects.get(0).PointsBase.set(100);
        scalesWithAttackPower(spell, AP_GRAVITON_BURST);
        grantVoidShard(spell.Effects.get(1));
    },
});

export const GRAVITON_SURGE = createRankedAbility(VK, {
    id: 'graviton-surge',
    parent: DEATH_WISH,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.GRAVITON_SURGE,
    firstRankSource: 'TALENT',
    name: 'Graviton Surge',
    description: 'Charges your weapon with gravitons for $d.  Your melee attacks have a $h% chance to release'
        + ` a burst dealing ${withAttackPower(`$${GRAVITON_BURST.ID}m1`, AP_GRAVITON_BURST)} Shadow damage`
        + ' and granting you a Void Shard.',
    icon: 'Spell_Shadow_ShadowEmbrace',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'free' },
    visual: { id: VISUAL_DARK_EMPOWERMENT },
    customize: rank => {
        rank.Mechanic.set(0);
        rank.DispelType.set('DISPEL_NONE');
        rank.Duration.set(DURATION.SEC_15)
            .Cooldown.Time.set(120000)
            .AuraDescription.enGB.set('Melee attacks may release graviton bursts.');
        // Death Wish's damage bonus and its damage taken penalty.
        [0, 1, 2].forEach(index => rank.Effects.get(index).clear());
        setSelfAuraEffects(rank, [triggerSpell(GRAVITON_BURST.ID)]);
        onMeleeHit(GRAVITON_SURGE_CHANCE)(rank, 1);
    },
});

const STELLAR_COLLAPSE_TICK_DAMAGE = [120, 160, 200, 250];

export const STELLAR_COLLAPSE = createRankedAbility(VK, {
    id: 'stellar-collapse',
    parent: DEATH_AND_DECAY,
    familyBit: FAMILY_BIT.STELLAR_COLLAPSE,
    firstRankSource: 'TALENT',
    name: 'Stellar Collapse',
    description: 'Collapses a star at the target location into a black hole for $d.  Enemies within $a2 yards'
        + ' are pulled into it, and enemies within $a1 yards take '
        + withAttackPower('$m1', AP_STELLAR_COLLAPSE_PER_TICK) + ' Shadow damage every $t1 sec.',
    icon: 'Spell_Shadow_SealOfKings',
    school: 'SHADOW',
    skillLine: SKILL_GRAVITY,
    cost: { kind: 'rage', rage: 30 },
    customize: (rank, rankIndex) => {
        rank.row.RuneCostID.set(0);
        rank.Duration.set(DURATION.SEC_8);
        ownCooldown(rank, 90000);
        // Death and Decay's ticks are a dummy aura the death knight script turns into damage.
        rank.Effects.get(0).Aura.PERIODIC_DAMAGE.set();
        rank.Effects.get(0).PointsBase.set(STELLAR_COLLAPSE_TICK_DAMAGE[rankIndex]);
        periodicDamageScalesWithAttackPower(rank, AP_STELLAR_COLLAPSE_PER_TICK);
        pullToDestination(rank.Effects.get(1), RADIUS.YARDS_15);
    },
});

/** Every Gravity ability, talent abilities included. */
export const GRAVITY_ABILITIES: RankedAbility[] = [
    VOID_STRIKE, GRAVITY_LASH, GRAVITATIONAL_PULL, COLLAPSE, IMPLOSION, ANNIHILATE, GRAVITY_LOCK, TAP_THE_VOID,
    CRUSHING_DESCENT, SINGULARITY, GRAVITON_SURGE, STELLAR_COLLAPSE,
];
