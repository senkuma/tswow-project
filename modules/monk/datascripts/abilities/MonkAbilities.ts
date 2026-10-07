import {
    abilityFlat, ALL_SCHOOLS, armorFromItems, createFamilySpell, createRankedAbility, damageDone, damageTaken,
    DURATION, healingDone, maxHealthPercent, movementSpeed, periodicDamageScalesWithAttackPower, powerRegenPercent,
    procMask, RADIUS, RANGE, RankedAbility, scalesWithAttackPower, setSelfAuraEffects, statPercent, TalentEffect,
    threat, withAttackPower,
} from "classkit";
import { std } from "wow/wotlk";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { MONK_CONTEXT as MK } from "../MonkClass";
import { SKILL_BREWMASTER, SKILL_MISTWEAVER, SKILL_WINDWALKER } from "../MonkSkills";
import { CHI_TAGS, costsChi, tagAbility } from "./Chi";
import { FAMILY_BIT } from "./FamilyBits";

// Parent spells. Rank chains supply WotLK levels and values; NPC and vehicle
// spells (marked) supply mechanics with no player version.
const SINISTER_STRIKE = 1752;
const EVISCERATE = 2098;              // finishing move shell: a melee strike that spends combo points
const JUMP_JETS_VEHICLE = 54905;      // jump forward
const RUNE_TAP = 48982;               // percent-of-health heal
const KICK = 1766;
const TAUNT = 355;
const ASPECT_OF_THE_MONKEY = 13163;   // permanent self aura
const REJUVENATION = 774;
const WHIRLWIND = 1680;
const GOUGE = 1776;
const SHIELD_WALL = 871;
const BATTLE_SHOUT = 6673;
const DUAL_WIELD_PASSIVE = 674;
const AXE_VOLLEY_NPC = 53240;         // ranged area attack
const DRAGONS_BREATH = 31661;
const RIPTIDE = 61295;
const GUARDIAN_SPIRIT = 47788;
const INTERCEPT = 20252;
const AXE_FLURRY_NPC = 24018;         // self channel that triggers a spell every second

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_PUNCH = 1184;            // unarmed strike
const VISUAL_GLOWING_PALM = 671;      // Eviscerate's glowing hands
const VISUAL_KICK = 39;               // NPC uppercut
const VISUAL_SLAM = 7451;             // heavy impact with dazed swirl
const VISUAL_DEATH_BLOW = 1187;       // NPC Mortal Blow
const VISUAL_STANCE = 3140;           // Aspect of the Monkey
const VISUAL_SURGING_MIST = 12994;    // Riptide's water
const VISUAL_RENEWING_MIST = 11568;   // Wild Growth
const VISUAL_THROWN_KEG = 9806;       // Brewfest keg toss
const VISUAL_TRANQUILITY = 1283;

/** Spell_group of the three stances; TrinityCore allows one aura of an exclusive group at a time. */
const STANCE_GROUP = 2300;
const SPELL_GROUP_EXCLUSIVE = 1;

// Attack power coefficients: every monk ability, heals included, scales with attack power.
const AP_EXPEL_HARM = 0.4;
const AP_SURGING_MIST = 0.5;
const AP_RENEWING_MIST_PER_TICK = 0.08;
const RENEWING_MIST_TICKS = 5;
const AP_ENVELOPING_MIST = 0.4;
const AP_ENVELOPING_MIST_PER_TICK = 0.06;
const AP_BREATH_OF_FIRE = 0.3;
const AP_BREATH_OF_FIRE_PER_TICK = 0.03;
const AP_REVIVAL = 0.3;

// Mists of Pandaria healing: the big heals are casts, which Soothing Mist makes instant.
const SURGING_MIST_CAST_MS = 1500;
const ENVELOPING_MIST_CAST_MS = 2000;
const RENEWING_MIST_COOLDOWN_MS = 8000;
const RENEWING_MIST_TARGETS = 3;

// ---------------------------------------------------------------- helpers

/** Turns an Eviscerate-based finishing move into a plain weapon strike for a Chi spender. */
function weaponStrike(rank: Spell, percent: number) {
    const strike = rank.Effects.get(0);
    strike.clear();
    strike.Type.WEAPON_PERCENT_DAMAGE.set()
        .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
        .Percentage.set(percent);
}

/** A Rune Tap based heal: a percentage of the target's maximum health plus attack power. */
export function healsPercent(rank: Spell, percent: number, apCoefficient: number) {
    rank.Effects.get(0).PointsBase.set(percent);
    // Rune Tap costs a blood rune and has a 1 min cooldown.
    rank.row.RuneCostID.set(0);
    rank.Cooldown.Time.set(0);
    scalesWithAttackPower(rank, apCoefficient);
}

// ---------------------------------------------------------------- Chi builders and spenders

export const JAB = createRankedAbility(MK, {
    id: 'jab',
    parent: SINISTER_STRIKE,
    familyBit: FAMILY_BIT.JAB,
    firstRankSource: 'START',
    name: 'Jab',
    description: 'A quick jab that causes $m1 damage in addition to your normal weapon damage and generates 1 Chi,'
        + ' or 2 Chi in Stance of the Fierce Tiger.',
    icon: 'ability_monk_Jab',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'energy', energy: 40 },
    visual: { id: VISUAL_PUNCH },
});

const TIGER_PALM_CHI = 1;
const TIGER_PALM_PERCENT = 150;
const TIGER_POWER_PERCENT = 8;

export const TIGER_PALM = createRankedAbility(MK, {
    id: 'tiger-palm',
    parent: EVISCERATE,
    ranks: [{ level: 1 }],
    familyBit: FAMILY_BIT.TIGER_PALM,
    firstRankSource: 'START',
    name: 'Tiger Palm',
    description: 'Attacks with the palm of your hand for $m1% weapon damage and'
        + ' grants Tiger Power, increasing your physical damage by $s2% for $d.',
    icon: 'Ability_Monk_TigerPalm',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    visual: { id: VISUAL_GLOWING_PALM },
    customize: rank => {
        weaponStrike(rank, TIGER_PALM_PERCENT);
        rank.Duration.set(DURATION.SEC_20)
            .AuraDescription.enGB.set('Physical damage increased by $s2%.');
        const tigerPower = rank.Effects.get(1);
        tigerPower.clear();
        tigerPower.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_CASTER')
            .Aura.MOD_DAMAGE_PERCENT_DONE.set()
            .Schools.set(['PHYSICAL'])
            .PercentBase.set(TIGER_POWER_PERCENT);
    },
});

const BLACKOUT_KICK_CHI = 2;
const BLACKOUT_KICK_PERCENT = 260;

export const BLACKOUT_KICK = createRankedAbility(MK, {
    id: 'blackout-kick',
    parent: EVISCERATE,
    ranks: [{ level: 6 }],
    familyBit: FAMILY_BIT.BLACKOUT_KICK,
    firstRankSource: 'TRAINER',
    name: 'Blackout Kick',
    description: 'Kicks with the blinding strength of the sun,'
        + ' dealing $m1% weapon damage.',
    icon: 'ability_monk_roundhousekick',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    visual: { id: VISUAL_KICK },
    clearedEffects: [1],
    customize: rank => weaponStrike(rank, BLACKOUT_KICK_PERCENT),
});

// ---------------------------------------------------------------- utility

export const ROLL = createRankedAbility(MK, {
    id: 'roll',
    parent: JUMP_JETS_VEHICLE,
    ranks: [{ level: 8 }],
    familyBit: FAMILY_BIT.ROLL,
    firstRankSource: 'TRAINER',
    name: 'Roll',
    description: 'Rolls a short distance forward.',
    icon: 'ability_monk_roll',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Cooldown.Time.set(20000);
        // The vehicle version aims along a client-side trajectory; this lands 15 yards ahead.
        rank.Effects.get(0)
            .ImplicitTargetA.set('DEST_CASTER_FRONT_LEAP')
            .Radius.set(RADIUS.YARDS_15);
    },
});

export const EXPEL_HARM = createRankedAbility(MK, {
    id: 'expel-harm',
    parent: RUNE_TAP,
    ranks: [{ level: 10 }],
    familyBit: FAMILY_BIT.EXPEL_HARM,
    firstRankSource: 'TRAINER',
    name: 'Expel Harm',
    description: 'Expels negative Chi from your body, healing you for $s1% of your maximum health plus '
        + withAttackPower('0', AP_EXPEL_HARM) + ' and generating 1 Chi, or 2 Chi in Stance of the Fierce Tiger.',
    icon: 'Ability_Monk_ExpelHarm',
    school: 'NATURE',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'energy', energy: 40 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        healsPercent(rank, 10, AP_EXPEL_HARM);
        rank.Cooldown.Time.set(15000);
    },
});

export const SPEAR_HAND_STRIKE = createRankedAbility(MK, {
    id: 'spear-hand-strike',
    parent: KICK,
    familyBit: FAMILY_BIT.SPEAR_HAND_STRIKE,
    firstRankSource: 'TRAINER',
    name: 'Spear Hand Strike',
    description: 'Jabs the target in the throat, interrupting spellcasting and preventing any spell'
        + ' in that school from being cast for $d.',
    icon: 'Ability_Monk_SpearHand',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'energy', energy: 15 },
});

export const PROVOKE = createRankedAbility(MK, {
    id: 'provoke',
    parent: TAUNT,
    familyBit: FAMILY_BIT.PROVOKE,
    firstRankSource: 'TRAINER',
    name: 'Provoke',
    description: 'You mock the target, forcing it to attack you.  Has no effect if the target is already attacking you.',
    icon: 'Ability_Monk_Provoke',
    school: 'PHYSICAL',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'free' },
});

// ---------------------------------------------------------------- stances

interface StanceDefinition {
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

/** A permanent self aura; casting another stance replaces it. */
function createStance(definition: StanceDefinition) {
    const stance = createRankedAbility(MK, {
        id: definition.id,
        parent: ASPECT_OF_THE_MONKEY,
        ranks: [{ level: definition.level }],
        familyBit: definition.familyBit,
        firstRankSource: definition.level === 1 ? 'START' : 'TRAINER',
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        school: 'PHYSICAL',
        skillLine: definition.skillLine,
        cost: { kind: 'free' },
        globalCooldown: GLOBAL_COOLDOWN_MS,
        visual: { id: VISUAL_STANCE },
        customize: rank => {
            rank.AuraDescription.enGB.set(definition.auraDescription);
            // Aspect of the Monkey's dodge, its PvP aura and the hunter aspect trigger.
            [0, 1, 2].forEach(index => rank.Effects.get(index).clear());
            setSelfAuraEffects(rank, definition.effects);
        },
    });
    std.SQL.spell_group.add(STANCE_GROUP, stance.firstRank.ID);
    return stance;
}

std.SQL.spell_group_stack_rules.add(STANCE_GROUP, { stack_rule: SPELL_GROUP_EXCLUSIVE });

export const STANCE_OF_THE_FIERCE_TIGER = createStance({
    id: 'stance-of-the-fierce-tiger',
    familyBit: FAMILY_BIT.STANCE_OF_THE_FIERCE_TIGER,
    level: 1,
    name: 'Stance of the Fierce Tiger',
    description: 'Increases your physical damage by $s1% and your movement speed by $s2%, and makes Jab and'
        + ' Expel Harm generate 1 additional Chi.  Only one stance can be active at a time.',
    auraDescription: 'Physical damage increased by $s1%.  Movement speed increased by $s2%.'
        + '  Jab and Expel Harm generate 1 additional Chi.',
    icon: 'Monk_Stance_WhiteTiger',
    skillLine: SKILL_WINDWALKER,
    // Jab's second effect adds its combo point; Expel Harm's extra Chi comes from the livescripts.
    effects: [damageDone(['PHYSICAL'], 10), movementSpeed(10), abilityFlat('EFFECT2', 1, [JAB])],
});

export const STANCE_OF_THE_STURDY_OX = createStance({
    id: 'stance-of-the-sturdy-ox',
    familyBit: FAMILY_BIT.STANCE_OF_THE_STURDY_OX,
    level: 10,
    name: 'Stance of the Sturdy Ox',
    description: 'Reduces all damage taken by $s1%, increases your armor from items by $s2% and the threat'
        + ' you cause by $s3%.  Only one stance can be active at a time.',
    auraDescription: 'Damage taken reduced by $s1%.  Armor increased by $s2%.  Threat increased by $s3%.',
    icon: 'Monk_Stance_DrunkenOx',
    skillLine: SKILL_BREWMASTER,
    effects: [damageTaken(ALL_SCHOOLS, -15), armorFromItems(80), threat(80)],
});

export const STANCE_OF_THE_WISE_SERPENT = createStance({
    id: 'stance-of-the-wise-serpent',
    familyBit: FAMILY_BIT.STANCE_OF_THE_WISE_SERPENT,
    level: 20,
    name: 'Stance of the Wise Serpent',
    description: 'Increases your healing done by $s1% and your energy regeneration by $s2%.'
        + '  Only one stance can be active at a time.',
    auraDescription: 'Healing done increased by $s1%.  Energy regeneration increased by $s2%.',
    icon: 'Monk_Stance_WiseSerpent',
    skillLine: SKILL_MISTWEAVER,
    effects: [healingDone(25), powerRegenPercent('ENERGY', 25)],
});

// ---------------------------------------------------------------- healing

export const SURGING_MIST = createRankedAbility(MK, {
    id: 'surging-mist',
    parent: RUNE_TAP,
    ranks: [{ level: 4 }],
    familyBit: FAMILY_BIT.SURGING_MIST,
    firstRankSource: 'TRAINER',
    name: 'Surging Mist',
    description: 'Heals the target for $s1% of its maximum health plus ' + withAttackPower('0', AP_SURGING_MIST)
        + ' and generates 1 Chi.  Instant while channeling Soothing Mist.',
    icon: 'Ability_Monk_SurgingMist',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'energy', energy: 30 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_SURGING_MIST },
    customize: rank => {
        healsPercent(rank, 12, AP_SURGING_MIST);
        rank.CastTime.setSimple(SURGING_MIST_CAST_MS);
        // Rune Tap is instant and so is never interrupted; these are Flash Heal's.
        rank.InterruptFlags.set(['ON_MOVEMENT', 'ON_PUSHBACK', 'ON_INTERRUPT_CAST', 'ON_INTERRUPT']);
        rank.Range.set(RANGE.YARDS_40);
        rank.Effects.get(0).ImplicitTargetA.set('UNIT_TARGET_ALLY');
    },
});

export const RENEWING_MIST = createRankedAbility(MK, {
    id: 'renewing-mist',
    parent: REJUVENATION,
    familyBit: FAMILY_BIT.RENEWING_MIST,
    firstRankSource: 'TRAINER',
    name: 'Renewing Mist',
    description: 'Surrounds the target and up to 2 nearby injured allies with healing mists, restoring '
        + withAttackPower('$o1', AP_RENEWING_MIST_PER_TICK * RENEWING_MIST_TICKS) + ' health over $d,'
        + ' and generates 1 Chi.',
    icon: 'Ability_Monk_RenewingMists',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'energy', energy: 25 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_RENEWING_MIST },
    customize: rank => {
        periodicDamageScalesWithAttackPower(rank, AP_RENEWING_MIST_PER_TICK);
        rank.AuraDescription.enGB.set('Healing $s1 every $t1 sec.');
        rank.Cooldown.Time.set(RENEWING_MIST_COOLDOWN_MS);
        // Chain heal targeting: the target, then the most injured allies near it.
        rank.Effects.get(0)
            .ImplicitTargetA.set('UNIT_TARGET_CHAINHEAL_ALLY')
            .ChainTarget.set(RENEWING_MIST_TARGETS);
    },
});

// ---------------------------------------------------------------- more baseline

export const SPINNING_CRANE_KICK = createRankedAbility(MK, {
    id: 'spinning-crane-kick',
    parent: WHIRLWIND,
    ranks: [{ level: 24 }],
    familyBit: FAMILY_BIT.SPINNING_CRANE_KICK,
    firstRankSource: 'TRAINER',
    name: 'Spinning Crane Kick',
    description: 'Spins with outstretched fists and feet, striking up to $i enemies within $a1 yards'
        + ' for weapon damage with both hands.',
    icon: 'Ability_Monk_CraneKick_New',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'energy', energy: 40 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    // Whirlwind's 10 sec cooldown; Spinning Crane Kick is limited by energy alone.
    customize: rank => rank.Cooldown.Time.set(0).Cooldown.CategoryTime.set(0),
});

export const PARALYSIS = createRankedAbility(MK, {
    id: 'paralysis',
    parent: GOUGE,
    ranks: [{ level: 28 }],
    familyBit: FAMILY_BIT.PARALYSIS,
    firstRankSource: 'TRAINER',
    name: 'Paralysis',
    description: 'Strikes a pressure point, incapacitating the target for $d.'
        + '  Any damage breaks the effect.  Target must be facing you.',
    icon: 'Ability_Monk_Paralysis',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'energy', energy: 20 },
    // Gouge's attack-power damage is a rogue script, and Paralysis generates no Chi.
    clearedEffects: [0, 1],
    customize: rank => rank.Cooldown.Time.set(15000),
});

const TOUCH_OF_DEATH_CHI = 3;

export const TOUCH_OF_DEATH = createRankedAbility(MK, {
    id: 'touch-of-death',
    parent: SINISTER_STRIKE,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.TOUCH_OF_DEATH,
    firstRankSource: 'TRAINER',
    name: 'Touch of Death',
    description: `You exploit the enemy's weakest point, instantly killing it.`
        + '  Only usable on creatures with less health than your maximum health, or players at 10% health or less.',
    icon: 'Ability_Monk_TouchOfDeath',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    visual: { id: VISUAL_DEATH_BLOW },
    customize: rank => {
        rank.Cooldown.Time.set(90000);
        // The livescripts check the target's health; once allowed, the touch cannot miss.
        rank.DefenseType.set(0);
        rank.Effects.get(0).clear();
        const kill = rank.Effects.get(1);
        kill.clear();
        kill.Type.INSTAKILL.set().ImplicitTargetA.set('UNIT_TARGET_ENEMY');
    },
});

export const FORTIFYING_BREW = createRankedAbility(MK, {
    id: 'fortifying-brew',
    parent: SHIELD_WALL,
    ranks: [{ level: 30 }],
    familyBit: FAMILY_BIT.FORTIFYING_BREW,
    firstRankSource: 'TRAINER',
    name: 'Fortifying Brew',
    description: 'Drinks a fortifying brew, reducing all damage taken by $s1% and increasing your maximum'
        + ' health by $s2% for $d.',
    icon: 'Ability_Monk_FortifyingAle_New',
    school: 'PHYSICAL',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'free' },
    customize: rank => {
        // Shield Wall needs a shield.
        rank.row.EquippedItemClass.set(-1);
        rank.Duration.set(DURATION.SEC_20)
            .Cooldown.Time.set(180000)
            .AuraDescription.enGB.set('Damage taken reduced by $s1%.  Maximum health increased by $s2%.');
        setSelfAuraEffects(rank, [damageTaken(ALL_SCHOOLS, -20), maxHealthPercent(20)]);
    },
});

export const LEGACY_OF_THE_EMPEROR = createRankedAbility(MK, {
    id: 'legacy-of-the-emperor',
    parent: BATTLE_SHOUT,
    ranks: [{ level: 22 }],
    familyBit: FAMILY_BIT.LEGACY_OF_THE_EMPEROR,
    firstRankSource: 'TRAINER',
    name: 'Legacy of the Emperor',
    description: 'Increases the Strength, Agility, Stamina, Intellect and Spirit of all party and raid'
        + ' members within $a1 yards by $s1% for $d.',
    icon: 'Ability_Monk_LegacyOfTheEmperor',
    school: 'PHYSICAL',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Duration.set(DURATION.MIN_60)
            .AuraDescription.enGB.set('All stats increased by $s1%.');
        // Keeps Battle Shout's party and raid targeting.
        statPercent('ALL', 5)(rank.Effects.get(0), 1);
        rank.Effects.get(1).clear();
    },
});

export const DUAL_WIELD = createRankedAbility(MK, {
    id: 'dual-wield',
    parent: DUAL_WIELD_PASSIVE,
    familyBit: FAMILY_BIT.DUAL_WIELD,
    firstRankSource: 'START',
    name: 'Dual Wield',
    description: 'Allows one-hand and off-hand weapons to be equipped in the off-hand.',
    icon: 'Ability_DualWield',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
});

// ---------------------------------------------------------------- talents: Brewmaster

export const KEG_SMASH = createRankedAbility(MK, {
    id: 'keg-smash',
    parent: AXE_VOLLEY_NPC,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.KEG_SMASH,
    firstRankSource: 'TALENT',
    name: 'Keg Smash',
    description: 'Smashes a keg of brew into the target, dealing weapon damage to all enemies within $a1 yards,'
        + ' reducing their movement speed by $s2% for $d and generating 2 Chi.',
    icon: 'Achievement_brewery_2',
    school: 'PHYSICAL',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'energy', energy: 40 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_THROWN_KEG, missileSpeed: 20 },
    customize: rank => {
        rank.Range.set(RANGE.YARDS_20)
            .Duration.set(DURATION.SEC_8)
            .Cooldown.Time.set(8000)
            .AuraDescription.enGB.set('Movement speed reduced by $s2%.');
        // A melee-class attack, so weapon damage uses the melee attack table.
        rank.DefenseType.set(2);
        const smash = rank.Effects.get(0);
        smash.clear();
        smash.Type.NORMALIZED_WEAPON_DMG.set()
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8);
        rank.Effects.get(1).Type.APPLY_AURA.set()
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8)
            .Aura.MOD_DECREASE_SPEED.set().PercentBase.set(-50);
        // Chi goes on the primary target only, which holds the monk's Chi.
        rank.Effects.get(2).Type.ADD_COMBO_POINTS.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .CountBase.set(2);
    },
});

const BREATH_OF_FIRE_CHI = 2;

export const BREATH_OF_FIRE = createRankedAbility(MK, {
    id: 'breath-of-fire',
    parent: DRAGONS_BREATH,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.BREATH_OF_FIRE,
    firstRankSource: 'TALENT',
    name: 'Breath of Fire',
    description: 'Breathes fire on enemies in a cone in front of you, dealing '
        + withAttackPower('$s1', AP_BREATH_OF_FIRE) + ' Fire damage, burning them for an additional $o2'
        + ' over $d and reducing their movement speed by $s3%.',
    icon: 'Ability_Monk_BreathofFire',
    school: 'FIRE',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        scalesWithAttackPower(rank, AP_BREATH_OF_FIRE);
        periodicDamageScalesWithAttackPower(rank, AP_BREATH_OF_FIRE_PER_TICK);
        rank.Duration.set(DURATION.SEC_8)
            .Cooldown.Time.set(15000)
            .AuraDescription.enGB.set('Burning for $s2 Fire damage every $t2 sec.  Movement slowed by $s3%.');
        // Dragon's Breath disorients until damaged; the monk version burns instead.
        rank.Mechanic.set(0);
        rank.AuraInterruptFlags.set(0);
        rank.Effects.get(0).PointsBase.set(150);
        const burn = rank.Effects.get(1);
        burn.Mechanic.set(0);
        burn.Aura.PERIODIC_DAMAGE.set()
            .DamageBase.set(30)
            .DamagePeriod.set(2000);
    },
});

export const DAMPEN_HARM = createRankedAbility(MK, {
    id: 'dampen-harm',
    parent: SHIELD_WALL,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.DAMPEN_HARM,
    firstRankSource: 'TALENT',
    name: 'Dampen Harm',
    description: 'The next $n attacks against you within $d deal $s1% less damage.',
    icon: 'Ability_Monk_DampenHarm',
    school: 'PHYSICAL',
    skillLine: SKILL_BREWMASTER,
    cost: { kind: 'free' },
    customize: rank => {
        rank.row.EquippedItemClass.set(-1);
        rank.Duration.set(DURATION.SEC_30)
            .Cooldown.Time.set(90000)
            .AuraDescription.enGB.set('Damage taken from the next attacks reduced by $s1%.');
        setSelfAuraEffects(rank, [damageTaken(ALL_SCHOOLS, -50)]);
        // Each hit taken uses a charge; the aura ends when they run out.
        rank.Proc.TriggerMask.set(procMaskOfHitsTaken());
        rank.Proc.Chance.set(100);
        rank.Proc.Charges.set(5);
    },
});

/** Melee, ranged and spell hits taken, without periodic damage. */
function procMaskOfHitsTaken() {
    return procMask([
        'TAKEN_MELEE_AUTO_ATTACK', 'TAKEN_MELEE_SPELL', 'TAKEN_RANGED_AUTO_ATTACK', 'TAKEN_RANGED_SPELL',
        'TAKEN_NO_CLASS_SPELL_NEGATIVE', 'TAKEN_MAGIC_SPELL_NEGATIVE',
    ]);
}

// ---------------------------------------------------------------- talents: Mistweaver

const ENVELOPING_MIST_CHI = 3;

export const ENVELOPING_MIST = createRankedAbility(MK, {
    id: 'enveloping-mist',
    parent: RIPTIDE,
    familyBit: FAMILY_BIT.ENVELOPING_MIST,
    firstRankSource: 'TALENT',
    name: 'Enveloping Mist',
    description: 'Wraps the target in healing mists, healing it for '
        + withAttackPower('$s1', AP_ENVELOPING_MIST) + ' and another $o2 over $d.'
        + '  Instant while channeling Soothing Mist.',
    icon: 'Spell_Monk_EnvelopingMist',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        scalesWithAttackPower(rank, AP_ENVELOPING_MIST);
        periodicDamageScalesWithAttackPower(rank, AP_ENVELOPING_MIST_PER_TICK);
        rank.CastTime.setSimple(ENVELOPING_MIST_CAST_MS);
        rank.AuraDescription.enGB.set('Healing $s2 every $t2 sec.');
    },
});

export const LIFE_COCOON = createRankedAbility(MK, {
    id: 'life-cocoon',
    parent: GUARDIAN_SPIRIT,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.LIFE_COCOON,
    firstRankSource: 'TALENT',
    name: 'Life Cocoon',
    description: 'Encases the target in a cocoon of Chi for $d, increasing healing received by $s1%'
        + ' and reducing damage taken by $s2%.',
    icon: 'Ability_Monk_ChiCocoon',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Duration.set(DURATION.SEC_12)
            .Cooldown.Time.set(120000)
            .AuraDescription.enGB.set('Healing received increased by $s1%.  Damage taken reduced by $s2%.');
        // Guardian Spirit's second aura prevents death through a priest script.
        rank.Effects.get(1).Aura.MOD_DAMAGE_PERCENT_TAKEN.set()
            .Schools.set(ALL_SCHOOLS)
            .PercentBase.set(-40);
    },
});

export const REVIVAL = createRankedAbility(MK, {
    id: 'revival',
    parent: RUNE_TAP,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.REVIVAL,
    firstRankSource: 'TALENT',
    name: 'Revival',
    description: 'Heals all party and raid members within $a1 yards for $s1% of their maximum health plus '
        + withAttackPower('0', AP_REVIVAL) + '.',
    icon: 'Spell_Monk_Revival',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'energy', energy: 50 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_TRANQUILITY },
    customize: rank => {
        healsPercent(rank, 15, AP_REVIVAL);
        rank.Cooldown.Time.set(180000);
        rank.Effects.get(0)
            .ImplicitTargetA.set('UNIT_CASTER_AREA_RAID')
            .Radius.set(RADIUS.YARDS_40);
    },
});

// ---------------------------------------------------------------- talents: Windwalker

const RISING_SUN_KICK_CHI = 2;
const RISING_SUN_KICK_PERCENT = 300;

export const RISING_SUN_KICK = createRankedAbility(MK, {
    id: 'rising-sun-kick',
    parent: EVISCERATE,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.RISING_SUN_KICK,
    firstRankSource: 'TALENT',
    name: 'Rising Sun Kick',
    description: 'Kicks upward for $m1% weapon damage,'
        + ' increasing the damage the target takes by $s2% for $d.',
    icon: 'Ability_Monk_RisingSunKick',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    visual: { id: VISUAL_SLAM },
    customize: rank => {
        weaponStrike(rank, RISING_SUN_KICK_PERCENT);
        rank.Duration.set(DURATION.SEC_15)
            .Cooldown.Time.set(8000)
            .AuraDescription.enGB.set('Damage taken increased by $s2%.');
        const wounds = rank.Effects.get(1);
        wounds.clear();
        wounds.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Aura.MOD_DAMAGE_PERCENT_TAKEN.set()
            .Schools.set(ALL_SCHOOLS)
            .PercentBase.set(10);
    },
});

export const FLYING_SERPENT_KICK = createRankedAbility(MK, {
    id: 'flying-serpent-kick',
    parent: INTERCEPT,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.FLYING_SERPENT_KICK,
    firstRankSource: 'TALENT',
    name: 'Flying Serpent Kick',
    description: 'Soars at an enemy and kicks it for $s2% weapon damage, reducing its movement speed by $s3%'
        + ' for $d.  Usable in combat.',
    icon: 'Ability_Monk_FlyingDragonKick',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Duration.set(DURATION.SEC_4)
            .Cooldown.Time.set(25000)
            .AuraDescription.enGB.set('Movement speed reduced by $s3%.');
        // Replaces Intercept's scripted stun.
        const kick = rank.Effects.get(1);
        kick.clear();
        kick.Type.WEAPON_PERCENT_DAMAGE.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Percentage.set(100);
        rank.Effects.get(2).Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Aura.MOD_DECREASE_SPEED.set().PercentBase.set(-50);
    },
});

/** One second of Fists of Fury: a flurry of blows in a cone that briefly stuns. */
export const FISTS_OF_FURY_STRIKE = createFamilySpell(MK, {
    id: 'fists-of-fury-strike',
    parent: WHIRLWIND,
    familyBit: FAMILY_BIT.FISTS_OF_FURY_STRIKE,
    name: 'Fists of Fury',
    icon: 'Monk_Ability_FistofFury',
    school: 'PHYSICAL',
    visual: { id: VISUAL_PUNCH },
    configure: spell => {
        spell.Power.CostBase.set(0)
            .MaxTargets.set(0)
            .Duration.set(DURATION.SEC_2);
        spell.Effects.get(0)
            .ImplicitTargetA.set('SRC_CASTER')
            .ImplicitTargetB.set('UNIT_CONE_ENEMY104')
            .Radius.set(RADIUS.YARDS_8);
        // Whirlwind's off-hand spin becomes a short stun.
        const stun = spell.Effects.get(1);
        stun.clear();
        stun.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('SRC_CASTER')
            .ImplicitTargetB.set('UNIT_CONE_ENEMY104')
            .Radius.set(RADIUS.YARDS_8)
            .Aura.MOD_STUN.set();
        stun.Mechanic.set('STUNNED');
    },
});

const FISTS_OF_FURY_CHI = 3;

export const FISTS_OF_FURY = createRankedAbility(MK, {
    id: 'fists-of-fury',
    parent: AXE_FLURRY_NPC,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.FISTS_OF_FURY,
    firstRankSource: 'TALENT',
    name: 'Fists of Fury',
    description: 'Channels a flurry of punches for $d, striking all enemies in'
        + ' front of you for weapon damage every second and stunning them.  You cannot move while channeling.',
    icon: 'Monk_Ability_FistofFury',
    school: 'PHYSICAL',
    skillLine: SKILL_WINDWALKER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // The NPC channel needs an axe in hand.
        rank.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
        rank.Duration.set(DURATION.SEC_4)
            .Cooldown.Time.set(25000);
        rank.Effects.get(0).TriggerSpell.set(FISTS_OF_FURY_STRIKE.ID);
        rank.Effects.get(0).AuraPeriod.set(1000);
        rank.Effects.get(1).clear();
        rank.Effects.get(2).clear();
    },
});

// ---------------------------------------------------------------- Chi

costsChi(TIGER_PALM, TIGER_PALM_CHI);
costsChi(BLACKOUT_KICK, BLACKOUT_KICK_CHI);
costsChi(RISING_SUN_KICK, RISING_SUN_KICK_CHI);
costsChi(FISTS_OF_FURY, FISTS_OF_FURY_CHI);
costsChi(TOUCH_OF_DEATH, TOUCH_OF_DEATH_CHI);
costsChi(BREATH_OF_FIRE, BREATH_OF_FIRE_CHI);
costsChi(ENVELOPING_MIST, ENVELOPING_MIST_CHI);
[EXPEL_HARM, SURGING_MIST, RENEWING_MIST].forEach(ability => tagAbility(ability, CHI_TAGS.generatesOne));
tagAbility(EXPEL_HARM, CHI_TAGS.tigerStanceBonus);
tagAbility(STANCE_OF_THE_FIERCE_TIGER, CHI_TAGS.tigerStance);
tagAbility(TOUCH_OF_DEATH, CHI_TAGS.touchOfDeath);
tagAbility(BLACKOUT_KICK, CHI_TAGS.blackoutKick);
[JAB, KEG_SMASH].forEach(ability => tagAbility(ability, CHI_TAGS.builder));

/** The Monk's abilities apart from the Mistweaver healing in MistAbilities.ts. */
export const CORE_ABILITIES: RankedAbility[] = [
    JAB, TIGER_PALM, BLACKOUT_KICK, ROLL, EXPEL_HARM, SPEAR_HAND_STRIKE, PROVOKE,
    STANCE_OF_THE_FIERCE_TIGER, STANCE_OF_THE_STURDY_OX, STANCE_OF_THE_WISE_SERPENT,
    SURGING_MIST, RENEWING_MIST, SPINNING_CRANE_KICK, PARALYSIS, TOUCH_OF_DEATH, FORTIFYING_BREW,
    LEGACY_OF_THE_EMPEROR, DUAL_WIELD,
    KEG_SMASH, BREATH_OF_FIRE, DAMPEN_HARM, ENVELOPING_MIST, LIFE_COCOON, REVIVAL,
    RISING_SUN_KICK, FLYING_SERPENT_KICK, FISTS_OF_FURY,
];
