import { createFamilySpell, createRankedAbility, RankedAbility, RankSpec, scalesWithAttackPower, withAttackPower } from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";
import { SKILL_HAMMER, SKILL_MOUNTAIN, SKILL_THUNDER } from "../MountainKingSkills";

// Parent spells. Rank chains supply WotLK levels and values; NPC spells
// (marked) supply mechanics and visuals with no player version.
const SINISTER_STRIKE = 1752;
const STORMBOLT_NPC = 19136;          // Warcraft III Mountain King Storm Bolt
const CHARGE = 100;
const THUNDER_CLAP = 6343;
const BATTLE_SHOUT = 6673;
const DEMORALIZING_SHOUT = 1160;
const PUMMEL = 6552;
const TAUNT = 355;
const SHIELD_BLOCK = 2565;
const GROUND_SMASH_NPC = 12734;
const CLEAVE = 845;
const SHIELD_WALL = 871;
const HAMMER_OF_WRATH = 24275;
const STORMSTRIKE = 17364;
const STORMSTRIKE_MAIN_HAND = 32175;
const THUNDERSTORM = 51490;
const MORTAL_STRIKE = 12294;
const BLADESTORM = 46924;
const BLADESTORM_WHIRLWIND = 50622;
const SHOCKWAVE = 46968;
const AVATAR_NPC = 19135;             // Warcraft III Mountain King Avatar

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_MIGHTY_BLOW = 2069;      // heavy NPC hammer impact
const VISUAL_THROWN_HAMMER = 5779;    // Storm Bolt hammer projectile (NPC 20685)
const VISUAL_STONEFORM = 5787;        // dwarven Stoneform racial
const VISUAL_SMASH = 5559;            // crushing NPC smash

// TrinityCore spell_group ids, so shouts follow the warrior versions' stacking rules.
const BATTLE_SHOUT_GROUP = 1003;
const DEMORALIZING_SHOUT_GROUP = 1062;

const RANGE_30_YARDS = 4;
const DURATION_3_SEC = 27;
const DURATION_20_SEC = 18;
const DURATION_60_MIN = 42;
const STANDARD_GLOBAL_COOLDOWN_MS = 1500;
// SPELL_ATTR0_ON_NEXT_SWING on the Ground Smash NPC spell; Earthshatter is instant.
const ATTR0_ON_NEXT_SWING = 0x4;

// Attack power coefficients of the abilities whose damage is not weapon based.
const AP_STORM_BOLT = 0.5;
const AP_THUNDER_CLAP = 0.25;
const AP_EARTHSHATTER = 0.35;
const AP_MOUNTAINS_WRATH = 0.6;
const AP_THUNDERSTORM = 0.4;
const AP_AVALANCHE = 0.75;

// Strength of the Mountain is the class's signature buff: stronger than
// Battle Shout while leveling, and scaled to endgame gear at its final rank.
const SIGNATURE_BUFF_MULTIPLIER = 2;
// Battle Shout's level 80 rank is learned at 78.
const ENDGAME_RANK_MIN_LEVEL = 78;

// ---------------------------------------------------------------- baseline

export const HAMMER_BLOW = createRankedAbility(MK, {
    id: 'hammer-blow',
    parent: SINISTER_STRIKE,
    familyBit: 0,
    firstRankSource: 'START',
    name: 'Hammer Blow',
    description: 'A crushing hammer blow that causes $m1 damage in addition to your normal weapon damage.',
    icon: 'INV_Hammer_09',
    school: 'PHYSICAL',
    skillLine: SKILL_HAMMER,
    cost: { kind: 'rage', rage: 15 },
    visual: { id: VISUAL_MIGHTY_BLOW },
    // Combo points.
    clearedEffects: [1],
    // Rogues use a 1 sec global cooldown.
    customize: rank => rank.Cooldown.GlobalTime.set(STANDARD_GLOBAL_COOLDOWN_MS),
});

/** Nature damage per rank; the stun lasts 3 sec at every rank. */
const STORM_BOLT_RANKS: [level: number, damage: number][] = [
    [4, 12], [12, 30], [20, 55], [28, 85], [36, 120],
    [44, 165], [52, 215], [60, 270], [70, 360], [78, 450],
];

export const STORM_BOLT = createRankedAbility(MK, {
    id: 'storm-bolt',
    parent: STORMBOLT_NPC,
    ranks: STORM_BOLT_RANKS.map(([level, damage]): RankSpec => ({
        level,
        configure: rank => rank.Effects.get(0).PointsBase.set(damage),
    })),
    familyBit: 1,
    firstRankSource: 'TRAINER',
    name: 'Storm Bolt',
    description: 'Hurls a storm-charged hammer at an enemy, dealing ' + withAttackPower('$m1', AP_STORM_BOLT)
        + ' Nature damage and stunning it for $d.',
    icon: 'Warrior_talent_icon_Stormbolt',
    school: 'NATURE',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_THROWN_HAMMER, missileSpeed: 20 },
    customize: rank => {
        scalesWithAttackPower(rank, AP_STORM_BOLT);
        rank.Range.set(RANGE_30_YARDS)
            .Duration.set(DURATION_3_SEC)
            .Cooldown.Time.set(25000)
            .Cooldown.GlobalTime.set(STANDARD_GLOBAL_COOLDOWN_MS);
        // Puts the stun in the stun diminishing-returns category.
        rank.Effects.get(1).Mechanic.set('STUNNED');
    },
});

export const THUNDER_CHARGE = createRankedAbility(MK, {
    id: 'thunder-charge',
    parent: CHARGE,
    // Charge's later ranks only add rage, which is set explicitly below.
    maxRanks: 1,
    familyBit: 2,
    firstRankSource: 'TRAINER',
    name: 'Thunder Charge',
    description: 'Charge an enemy with the force of a thunderclap, generating $/10;s2 rage'
        + ' and stunning it for $7922d.  Cannot be used in combat.',
    icon: 'Ability_Warrior_Charge',
    school: 'PHYSICAL',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'free' },
    // Charge's rage comes from the warrior script, which cloned spells do not run.
    customize: rank => rank.Effects.get(1).Type.ENERGIZE.set()
        .PowerType.set('RAGE')
        .PowerBase.set(150)
        .ImplicitTargetA.set('UNIT_CASTER'),
});

export const THUNDER_CLAP_MK = createRankedAbility(MK, {
    id: 'thunder-clap',
    parent: THUNDER_CLAP,
    familyBit: 3,
    firstRankSource: 'TRAINER',
    name: 'Thunder Clap',
    description: 'Strikes the ground with thunder, dealing ' + withAttackPower('$s1', AP_THUNDER_CLAP)
        + ' Nature damage to nearby enemies and increasing the time between their attacks by $s2% for $d.',
    icon: 'Spell_Nature_ThunderClap',
    school: 'NATURE',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'parent' },
    customize: rank => scalesWithAttackPower(rank, AP_THUNDER_CLAP),
});

export const STRENGTH_OF_THE_MOUNTAIN = createRankedAbility(MK, {
    id: 'strength-of-the-mountain',
    parent: BATTLE_SHOUT,
    familyBit: 4,
    firstRankSource: 'TRAINER',
    name: 'Strength of the Mountain',
    description: 'A rallying dwarven war cry that increases the attack power of all party'
        + ' and raid members within $a1 yards by $s1.  Lasts $d.',
    icon: 'Spell_Nature_StrengthOfEarthTotem02',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'parent' },
    spellGroup: BATTLE_SHOUT_GROUP,
    customize: rank => {
        rank.Duration.set(DURATION_60_MIN);
        const multiplier = rank.Levels.Spell.get() >= ENDGAME_RANK_MIN_LEVEL
            ? ENDGAME_POWER_FACTOR
            : SIGNATURE_BUFF_MULTIPLIER;
        // Battle Shout's melee and ranged attack power auras.
        [0, 1].forEach(effectIndex => {
            const points = rank.Effects.get(effectIndex).PointsBase;
            points.set(Math.round(points.get() * multiplier));
        });
    },
});

export const THUNDEROUS_ROAR = createRankedAbility(MK, {
    id: 'thunderous-roar',
    parent: DEMORALIZING_SHOUT,
    familyBit: 5,
    firstRankSource: 'TRAINER',
    name: 'Thunderous Roar',
    description: 'A deafening roar that reduces the melee attack power of all enemies'
        + ' within $a1 yards by $s1 for $d.',
    icon: 'Ability_Warrior_WarCry',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'parent' },
    spellGroup: DEMORALIZING_SHOUT_GROUP,
});

export const HAMMER_KNOCK = createRankedAbility(MK, {
    id: 'hammer-knock',
    parent: PUMMEL,
    familyBit: 6,
    firstRankSource: 'TRAINER',
    name: 'Hammer Knock',
    description: 'Knocks the target with your hammer, interrupting spellcasting and preventing'
        + ' any spell in that school from being cast for $d.',
    icon: 'INV_Hammer_18',
    school: 'PHYSICAL',
    skillLine: SKILL_HAMMER,
    cost: { kind: 'parent' },
    // Warriors learn Pummel at 38; an interrupt belongs earlier in the kit.
    customize: rank => rank.Levels.Spell.set(10).Levels.Base.set(10),
});

export const CHALLENGE = createRankedAbility(MK, {
    id: 'challenge',
    parent: TAUNT,
    familyBit: 7,
    firstRankSource: 'TRAINER',
    name: 'Challenge',
    description: 'Challenges the target to attack you, but has no effect if the target is already attacking you.',
    icon: 'Spell_Nature_Reincarnation',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'free' },
});

export const STONE_SHIELD = createRankedAbility(MK, {
    id: 'stone-shield',
    parent: SHIELD_BLOCK,
    familyBit: 8,
    firstRankSource: 'TRAINER',
    name: 'Stone Shield',
    description: 'Hardens your shield into living stone, increasing your chance to block'
        + ' and block value by $s1% for $d.',
    icon: 'Ability_Defend',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'free' },
});

export const EARTHSHATTER = createRankedAbility(MK, {
    id: 'earthshatter',
    parent: GROUND_SMASH_NPC,
    ranks: [{ level: 20 }],
    familyBit: 9,
    firstRankSource: 'TRAINER',
    name: 'Earthshatter',
    description: 'Slams the ground, dealing ' + withAttackPower('$s1', AP_EARTHSHATTER)
        + ' damage to nearby enemies and stunning them for $d.',
    icon: 'Spell_Nature_Earthquake',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'rage', rage: 15 },
    customize: rank => {
        rank.row.Attributes.set(rank.row.Attributes.get() & ~ATTR0_ON_NEXT_SWING);
        scalesWithAttackPower(rank, AP_EARTHSHATTER);
        rank.Cooldown.Time.set(45000)
            .Cooldown.GlobalTime.set(STANDARD_GLOBAL_COOLDOWN_MS);
        rank.Effects.get(1).Mechanic.set('STUNNED');
    },
});

export const SWEEPING_HAMMER = createRankedAbility(MK, {
    id: 'sweeping-hammer',
    parent: CLEAVE,
    familyBit: 10,
    firstRankSource: 'TRAINER',
    name: 'Sweeping Hammer',
    description: 'A wide hammer sweep on your next swing that does your weapon damage'
        + ' plus $s1 to the target and its nearest ally.',
    icon: 'Ability_Warrior_Cleave',
    school: 'PHYSICAL',
    skillLine: SKILL_HAMMER,
    cost: { kind: 'parent' },
});

export const GRANITE_SKIN = createRankedAbility(MK, {
    id: 'granite-skin',
    parent: SHIELD_WALL,
    familyBit: 11,
    firstRankSource: 'TRAINER',
    name: 'Granite Skin',
    description: 'Turns your skin to granite, reducing all damage taken by $s1% for $d.',
    icon: 'Spell_Nature_StoneSkinTotem',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'free' },
    visual: { id: VISUAL_STONEFORM },
    // Shield Wall needs a shield; Mountain Kings also fight with two-handers.
    customize: rank => rank.row.EquippedItemClass.set(-1),
});

export const MOUNTAINS_WRATH = createRankedAbility(MK, {
    id: 'mountains-wrath',
    parent: HAMMER_OF_WRATH,
    familyBit: 12,
    firstRankSource: 'TRAINER',
    name: 'Mountain\'s Wrath',
    description: 'Hurls a storm-charged hammer at an enemy, dealing ' + withAttackPower('$m1', AP_MOUNTAINS_WRATH)
        + ' to ' + withAttackPower('$M1', AP_MOUNTAINS_WRATH) + ' Nature damage.'
        + '  Only usable on enemies that have 20% or less health.',
    icon: 'Ability_ThunderClap',
    school: 'NATURE',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'rage', rage: 15 },
    customize: rank => scalesWithAttackPower(rank, AP_MOUNTAINS_WRATH),
});

// ---------------------------------------------------------------- talents

/** The weapon strike Thunderstrike triggers; its own spell so talents can modify it. */
export const THUNDERSTRIKE_HIT = createFamilySpell(MK, {
    id: 'thunderstrike-hit',
    parent: STORMSTRIKE_MAIN_HAND,
    familyBit: 14,
    name: 'Thunderstrike',
    icon: 'Ability_Shaman_Stormstrike',
    school: 'NATURE',
});

export const THUNDERSTRIKE = createRankedAbility(MK, {
    id: 'thunderstrike',
    parent: STORMSTRIKE,
    familyBit: 13,
    firstRankSource: 'TALENT',
    name: 'Thunderstrike',
    description: 'Strikes with lightning-charged steel for weapon damage as Nature damage.  In addition,'
        + ' the next $n sources of Nature damage you deal to the target are increased by $s1%.  Lasts $d.',
    icon: 'Ability_Shaman_Stormstrike',
    school: 'NATURE',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'rage', rage: 20 },
    // Off-hand strike; Mountain Kings do not dual wield.
    clearedEffects: [2],
    customize: rank => {
        rank.Effects.get(1).TriggerSpell.set(THUNDERSTRIKE_HIT.ID);
        rank.AuraDescription.enGB.set('Nature damage taken from the Mountain King increased by $s1%.');
    },
});

export const THUNDERSTORM_MK = createRankedAbility(MK, {
    id: 'thunderstorm',
    parent: THUNDERSTORM,
    familyBit: 15,
    firstRankSource: 'TALENT',
    name: 'Thunderstorm',
    description: 'Calls down a bolt of lightning, dealing ' + withAttackPower('$s1', AP_THUNDERSTORM)
        + ' Nature damage to enemies within $a1 yards, knocking them back and restoring $s2% of your maximum rage.',
    icon: 'Spell_Shaman_ThunderStorm',
    school: 'NATURE',
    skillLine: SKILL_THUNDER,
    cost: { kind: 'free' },
    customize: rank => {
        // The shaman version scales with spell power and restores mana.
        scalesWithAttackPower(rank, AP_THUNDERSTORM);
        rank.Effects.get(1).Type.ENERGIZE_PCT.set()
            .PowerType.set('RAGE')
            .PowerPctBase.set(20);
    },
});

export const MOUNTAIN_BREAKER = createRankedAbility(MK, {
    id: 'mountain-breaker',
    parent: MORTAL_STRIKE,
    familyBit: 16,
    firstRankSource: 'TALENT',
    name: 'Mountain Breaker',
    description: 'A crushing blow that deals weapon damage plus $s2 and cracks the target\'s armor,'
        + ' reducing it by $S1% for $d.',
    icon: 'Ability_Smash',
    school: 'PHYSICAL',
    skillLine: SKILL_HAMMER,
    cost: { kind: 'parent' },
    visual: { id: VISUAL_SMASH },
    // Replaces Mortal Strike's healing reduction with an armor reduction.
    customize: rank => {
        rank.Effects.get(0).Aura.MOD_RESISTANCE_PCT.set()
            .Schools.set('PHYSICAL')
            .PercentBase.set(-10);
        rank.AuraDescription.enGB.set('Armor reduced by $s1%.');
    },
});

/** The periodic spin Hammerstorm triggers; its own spell so the combat log and talents name it. */
export const HAMMERSTORM_WHIRL = createFamilySpell(MK, {
    id: 'hammerstorm-whirl',
    parent: BLADESTORM_WHIRLWIND,
    familyBit: 18,
    name: 'Hammerstorm',
    icon: 'Ability_Whirlwind',
    school: 'PHYSICAL',
    // Off-hand swing; Mountain Kings do not dual wield.
    configure: spell => { spell.Effects.get(1).clear(); },
});

export const HAMMERSTORM = createRankedAbility(MK, {
    id: 'hammerstorm',
    parent: BLADESTORM,
    familyBit: 17,
    firstRankSource: 'TALENT',
    name: 'Hammerstorm',
    description: 'You become a whirling storm of steel, striking nearby enemies every $t1 sec for $d.'
        + '  You cannot be stopped by movement impairing or loss of control effects while active.',
    icon: 'Ability_Whirlwind',
    school: 'PHYSICAL',
    skillLine: SKILL_HAMMER,
    cost: { kind: 'parent' },
    customize: rank => rank.Effects.get(0).TriggerSpell.set(HAMMERSTORM_WHIRL.ID),
});

export const AVALANCHE = createRankedAbility(MK, {
    id: 'avalanche',
    parent: SHOCKWAVE,
    familyBit: 19,
    firstRankSource: 'TALENT',
    name: 'Avalanche',
    description: 'Sends a rolling wave of stone in front of you, dealing ' + withAttackPower('$s2', AP_AVALANCHE)
        + ' damage and stunning all enemies within $a1 yards in a frontal cone for $d.',
    icon: 'Ability_Warrior_Shockwave',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'parent' },
    // Shockwave's damage is computed by TrinityCore for the warrior family only;
    // give the clone real base damage and Shockwave's 75% attack power scaling.
    clearedEffects: [2],
    customize: rank => {
        rank.Effects.get(1).PointsBase.set(25);
        scalesWithAttackPower(rank, AP_AVALANCHE);
    },
});

export const AVATAR = createRankedAbility(MK, {
    id: 'avatar',
    parent: AVATAR_NPC,
    ranks: [{ level: 60 }],
    familyBit: 20,
    firstRankSource: 'TALENT',
    name: 'Avatar',
    description: 'You become an avatar of the mountain for $d, increasing your size by $s3%,'
        + ' your armor by $s2% and your maximum health by $s1%.',
    icon: 'Warrior_talent_icon_Avatar',
    school: 'PHYSICAL',
    skillLine: SKILL_MOUNTAIN,
    cost: { kind: 'free' },
    customize: rank => {
        rank.Duration.set(DURATION_20_SEC)
            .Cooldown.Time.set(180000)
            .Cooldown.GlobalTime.set(STANDARD_GLOBAL_COOLDOWN_MS)
            .AuraDescription.enGB.set('Size, armor and maximum health increased.');
        // The Warcraft III Avatar raised damage; the tank version raises health instead.
        rank.Effects.get(0).Aura.MOD_INCREASE_HEALTH_PERCENT.set().PercentBase.set(30);
    },
});

/** Every ability a Mountain King can learn; the trainer sells all ranks not learned elsewhere. */
export const ALL_ABILITIES: RankedAbility[] = [
    HAMMER_BLOW, STORM_BOLT, THUNDER_CHARGE, THUNDER_CLAP_MK, STRENGTH_OF_THE_MOUNTAIN,
    THUNDEROUS_ROAR, HAMMER_KNOCK, CHALLENGE, STONE_SHIELD, EARTHSHATTER, SWEEPING_HAMMER,
    GRANITE_SKIN, MOUNTAINS_WRATH,
    THUNDERSTRIKE, THUNDERSTORM_MK, MOUNTAIN_BREAKER, HAMMERSTORM, AVALANCHE, AVATAR,
];
