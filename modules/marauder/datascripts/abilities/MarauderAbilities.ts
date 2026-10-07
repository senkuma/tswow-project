import {
    abilityPercent, createFamilySpell, createRankedAbility, DURATION, FamilyTarget, onMeleeHit,
    periodicDamageScalesWithAttackPower, RADIUS, RANGE, RankedAbility, RankSpec, scalesWithAttackPower,
    setSelfAuraEffects, withAttackPower,
} from "classkit";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";
import { SKILL_CARNAGE, SKILL_PLUNDER, SKILL_SKIRMISH } from "../MarauderSkills";
import { FAMILY_BIT } from "./FamilyBits";
import {
    GORGE_HEALING_PER_SPOILS, grantSpoilsOfWar, grantSpoilsOfWarStacks, MAX_SPOILS, RANSACK_DAMAGE_PER_SPOILS,
} from "./SpoilsOfWar";

// Parent spells. Rank chains supply WotLK levels and values; NPC spells
// (marked) supply mechanics and visuals with no player version.
const SINISTER_STRIKE = 1752;
const REND = 772;
const AXE_FLURRY_THROW_NPC = 24020;   // thrown axe from the Zul'Gurub axe flurry
const SCOURGE_HOOK_NPC = 50335;       // abomination hook: damage and pull
const KICK = 1766;
const JUMP_ATTACK_NPC = 54487;        // leap at the target and strike
const EVASION = 5277;
const RUNE_TAP = 48982;
const SPELLSTEAL = 30449;
const INTIMIDATING_SHOUT = 5246;
const WHIRLWIND = 1680;
const DUAL_WIELD_PASSIVE = 674;
const MUTILATE = 1329;
const DEATH_WISH = 12292;
const BLADE_FLURRY = 13877;
const COLD_BLOOD = 14177;
const BASH_NPC = 25515;
const ADRENALINE_RUSH = 13750;
const AXE_VOLLEY_NPC = 53240;
const AXE_FLURRY_NPC = 24018;         // self aura that hurls axes around the caster

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_BLOODY_STRIKE = 5119;    // Hemorrhage's spray of blood
const VISUAL_HEAVY_STRIKE = 2069;     // heavy NPC weapon impact
const VISUAL_MAIM = 556;              // Hamstring's maiming impact
const VISUAL_CHARGE_TRAIL = 867;      // Charge's trail and landing dust
const VISUAL_WHIRLING_STEEL = 11756;  // Bladestorm's whirlwind with knife impacts
const VISUAL_THROWN_AXE = 7162;       // spinning axe missile
const VISUAL_BLOODSURGE = 10701;
const VISUAL_BERSERK = 47;            // Berserker Rage's red glow
const VISUAL_BLOOD_FRENZY = 6682;     // red glow with whirling wind
const VISUAL_BLADESTORM = 10704;      // ring of whirling blades

const THROWN_AXE_SPEED = 40;
// Sinister Strike's weapon requirement: every melee weapon type.
const ANY_MELEE_WEAPON_SUBCLASSES = 0x2a5f3;

// Attack power coefficients of the abilities whose damage is not weapon based.
const AP_HURL_AXE = 0.35;
const AP_CHAIN_HOOK = 0.2;
const AP_RICOCHET_AXE = 0.3;
const AP_AXE_VOLLEY = 0.4;
const AP_AXE_STORM = 0.25;
// Bleeds: per tick, with the tick count used for tooltip totals.
const AP_SERRATED_GASH_PER_TICK = 0.05;
const SERRATED_GASH_TICKS = 5;
const AP_DEEP_GASH_PER_TICK = 0.04;
const DEEP_GASH_TICKS = 3;

const handMadeRanks = (ranks: [level: number, damage: number][], effectIndex = 0): RankSpec[] =>
    ranks.map(([level, damage]) => ({
        level,
        configure: rank => rank.Effects.get(effectIndex).PointsBase.set(damage),
    }));

// ---------------------------------------------------------------- builders and finishers

export const SAVAGE_STRIKE = createRankedAbility(MR, {
    id: 'savage-strike',
    parent: SINISTER_STRIKE,
    familyBit: FAMILY_BIT.SAVAGE_STRIKE,
    firstRankSource: 'START',
    name: 'Savage Strike',
    description: 'A savage strike that causes $m1 damage in addition to your normal weapon damage'
        + ' and grants a stack of Spoils of War.',
    icon: 'Ability_Warrior_SavageBlow',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'energy', energy: 40 },
    visual: { id: VISUAL_BLOODY_STRIKE },
    // Replaces the combo point.
    customize: rank => grantSpoilsOfWar(rank.Effects.get(1)),
});

export const RANSACK = createRankedAbility(MR, {
    id: 'ransack',
    parent: SINISTER_STRIKE,
    familyBit: FAMILY_BIT.RANSACK,
    firstRankSource: 'START',
    name: 'Ransack',
    description: 'A brutal strike that causes $m1 damage in addition to your normal weapon damage.'
        + `  Consumes all Spoils of War, dealing ${RANSACK_DAMAGE_PER_SPOILS}% more damage per stack consumed`
        + ` (up to ${RANSACK_DAMAGE_PER_SPOILS * MAX_SPOILS}%).`,
    icon: 'Ability_Rogue_Eviscerate',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'energy', energy: 35 },
    visual: { id: VISUAL_HEAVY_STRIKE },
    // Combo point.
    clearedEffects: [1],
});

export const SERRATED_GASH = createRankedAbility(MR, {
    id: 'serrated-gash',
    parent: REND,
    familyBit: FAMILY_BIT.SERRATED_GASH,
    firstRankSource: 'TRAINER',
    name: 'Serrated Gash',
    description: 'Tears into the target with a serrated edge, causing it to bleed for '
        + withAttackPower('$o1', AP_SERRATED_GASH_PER_TICK * SERRATED_GASH_TICKS)
        + ' damage over $d, and grants a stack of Spoils of War.',
    icon: 'Ability_Rogue_BloodSplatter',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'energy', energy: 30 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // Rend's later ranks last longer; every Serrated Gash ticks five times.
        rank.Duration.set(DURATION.SEC_15);
        // Rend's weapon-based bonus comes from a warrior script; this scales with attack power instead.
        periodicDamageScalesWithAttackPower(rank, AP_SERRATED_GASH_PER_TICK);
        grantSpoilsOfWar(rank.Effects.get(1));
        rank.AuraDescription.enGB.set('Bleeding for $s1 damage every $t1 sec.');
    },
});

/** Shared by the thrown-axe abilities: the spinning axe missile, range and attack power scaling. */
function throwsAxe(rank: Spell, apCoefficient: number) {
    rank.Visual.set(VISUAL_THROWN_AXE)
        .Speed.set(THROWN_AXE_SPEED)
        .Range.set(RANGE.YARDS_30);
    scalesWithAttackPower(rank, apCoefficient);
}

export const HURL_AXE = createRankedAbility(MR, {
    id: 'hurl-axe',
    parent: AXE_FLURRY_THROW_NPC,
    ranks: handMadeRanks([
        [6, 14], [14, 32], [22, 55], [30, 85], [38, 120],
        [46, 160], [54, 205], [62, 255], [70, 315], [78, 390],
    ]),
    familyBit: FAMILY_BIT.HURL_AXE,
    firstRankSource: 'TRAINER',
    name: 'Hurl Axe',
    description: 'Hurls a spinning axe at the target, dealing ' + withAttackPower('$m1', AP_HURL_AXE)
        + ' damage, and grants a stack of Spoils of War.',
    icon: 'INV_ThrowingAxe_03',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 30 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    // The NPC version also stuns.
    clearedEffects: [1],
    customize: rank => {
        throwsAxe(rank, AP_HURL_AXE);
        rank.Cooldown.Time.set(8000);
        grantSpoilsOfWar(rank.Effects.get(2));
    },
});

// ---------------------------------------------------------------- utility

export const CHAIN_HOOK = createRankedAbility(MR, {
    id: 'chain-hook',
    parent: SCOURGE_HOOK_NPC,
    ranks: handMadeRanks([[10, 20]]),
    familyBit: FAMILY_BIT.CHAIN_HOOK,
    firstRankSource: 'TRAINER',
    name: 'Chain Hook',
    description: 'Hurls a barbed hook on a chain, dealing ' + withAttackPower('$m1', AP_CHAIN_HOOK)
        + ' damage, dragging the target to you and reducing its movement speed by $s3% for $d.',
    icon: 'INV_MISC_HOOK_01',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 20 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        scalesWithAttackPower(rank, AP_CHAIN_HOOK);
        rank.Range.set(RANGE.YARDS_30)
            .Duration.set(DURATION.SEC_4)
            .Cooldown.Time.set(20000)
            .AuraDescription.enGB.set('Movement speed reduced by $s3%.');
        const slow = rank.Effects.get(2);
        slow.Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Aura.MOD_DECREASE_SPEED.set().PercentBase.set(-50);
        slow.Mechanic.set('SNARED');
    },
});

export const POMMEL_STRIKE = createRankedAbility(MR, {
    id: 'pommel-strike',
    parent: KICK,
    familyBit: FAMILY_BIT.POMMEL_STRIKE,
    firstRankSource: 'TRAINER',
    name: 'Pommel Strike',
    description: 'A quick blow with the pommel that interrupts spellcasting and prevents any spell'
        + ' in that school from being cast for $d.',
    icon: 'Ability_Warrior_PunishingBlow',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 25 },
});

export const REAVERS_LEAP = createRankedAbility(MR, {
    id: 'reavers-leap',
    parent: JUMP_ATTACK_NPC,
    ranks: [{ level: 14 }],
    familyBit: FAMILY_BIT.REAVERS_LEAP,
    firstRankSource: 'TRAINER',
    name: 'Reaver\'s Leap',
    description: 'Leaps at an enemy and strikes it for $s2% weapon damage.',
    icon: 'Ability_HeroicLeap',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 15 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_CHARGE_TRAIL },
    customize: rank => {
        rank.Range.set(RANGE.CHARGE)
            .Cooldown.Time.set(20000);
    },
});

export const SCRAPPERS_INSTINCT = createRankedAbility(MR, {
    id: 'scrappers-instinct',
    parent: EVASION,
    familyBit: FAMILY_BIT.SCRAPPERS_INSTINCT,
    firstRankSource: 'TRAINER',
    name: 'Scrapper\'s Instinct',
    description: 'Your instincts take over, increasing your dodge chance by $s1% for $d.',
    icon: 'Ability_Warrior_Riposte',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'free' },
});

export const GORGE = createRankedAbility(MR, {
    id: 'gorge',
    parent: RUNE_TAP,
    ranks: [{ level: 18 }],
    familyBit: FAMILY_BIT.GORGE,
    firstRankSource: 'TRAINER',
    name: 'Gorge',
    description: 'Gorge on the spoils of battle, instantly restoring $s1% of your maximum health.'
        + `  Consumes all Spoils of War, healing for ${GORGE_HEALING_PER_SPOILS}% more per stack consumed.`,
    icon: 'Ability_Rogue_HungerforBlood',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'energy', energy: 25 },
    customize: rank => {
        rank.Effects.get(0).PointsBase.set(5);
        rank.Cooldown.Time.set(30000);
        // Rune Tap costs a blood rune and is a magic spell; Gorge is a plain heal.
        rank.row.RuneCostID.set(0);
        rank.DefenseType.set(0);
    },
});

export const PLUNDER = createRankedAbility(MR, {
    id: 'plunder',
    parent: SPELLSTEAL,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.PLUNDER,
    firstRankSource: 'TRAINER',
    name: 'Plunder',
    description: 'Rips a beneficial magic effect from the target and claims it for yourself,'
        + ' and grants a stack of Spoils of War.  The stolen effect lasts a maximum of 2 min.',
    icon: 'INV_Misc_Bag_11',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'energy', energy: 25 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Range.set(RANGE.YARDS_10)
            .Cooldown.Time.set(15000);
        // A mage's Spellsteal uses the spell hit table; plundering always lands.
        rank.DefenseType.set(0);
        grantSpoilsOfWar(rank.Effects.get(1));
    },
});

export const DREAD_HOWL = createRankedAbility(MR, {
    id: 'dread-howl',
    parent: INTIMIDATING_SHOUT,
    familyBit: FAMILY_BIT.DREAD_HOWL,
    firstRankSource: 'TRAINER',
    name: 'Dread Howl',
    description: 'A blood-curdling howl that causes up to $5246i enemies within $5246a2 yards to flee in terror'
        + ' for $d.  The targeted enemy cowers in place instead.',
    icon: 'Spell_Shadow_DeathScream',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'energy', energy: 25 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
});

export const REAVERS_WHIRL = createRankedAbility(MR, {
    id: 'reavers-whirl',
    parent: WHIRLWIND,
    ranks: [{ level: 24 }],
    familyBit: FAMILY_BIT.REAVERS_WHIRL,
    firstRankSource: 'TRAINER',
    name: 'Reaver\'s Whirl',
    description: 'Spins with both weapons, striking up to $i enemies within $a1 yards for weapon damage.',
    icon: 'Ability_Whirlwind',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'energy', energy: 30 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_WHIRLING_STEEL },
    customize: rank => rank.Cooldown.Time.set(8000),
});

export const BEHEAD = createRankedAbility(MR, {
    id: 'behead',
    parent: SINISTER_STRIKE,
    ranks: handMadeRanks([[40, 160], [50, 240], [60, 340], [70, 460], [80, 600]]),
    familyBit: FAMILY_BIT.BEHEAD,
    firstRankSource: 'TRAINER',
    name: 'Behead',
    description: 'Attempts to finish off a wounded foe, dealing $s2% of your weapon damage plus $m1.'
        + '  Only usable on enemies that have 20% or less health.',
    icon: 'INV_Misc_Bone_OrcSkull_01',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'energy', energy: 30 },
    visual: { id: VISUAL_MAIM },
    customize: rank => {
        rank.TargetAuraState.Include.set('HEALTHLESS_20_PERCENT');
        rank.Cooldown.Time.set(6000);
        // Replaces the combo point.
        rank.Effects.get(1).clear();
        rank.Effects.get(1).Type.WEAPON_PERCENT_DAMAGE.set()
            .ImplicitTargetA.set('UNIT_TARGET_ENEMY')
            .Percentage.set(150);
    },
});

export const DUAL_WIELD = createRankedAbility(MR, {
    id: 'dual-wield',
    parent: DUAL_WIELD_PASSIVE,
    familyBit: FAMILY_BIT.DUAL_WIELD,
    firstRankSource: 'START',
    name: 'Dual Wield',
    description: 'Allows one-hand and off-hand weapons to be equipped in the off-hand.',
    icon: 'Ability_DualWield',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'free' },
});

// ---------------------------------------------------------------- talents: Carnage

/** Every Twin Fangs weapon strike, for talents: the strikes deal the damage, not Twin Fangs itself. */
export const TWIN_FANGS_STRIKES: FamilyTarget = { familyBit: FAMILY_BIT.TWIN_FANGS_STRIKE };

/**
 * A copy of one of Mutilate's per-rank weapon strikes in the Marauder family,
 * so talents can modify it like the Marauder's other attacks.
 */
function createTwinFangsStrike(parent: number, hand: 'main-hand' | 'off-hand', rankIndex: number) {
    return createFamilySpell(MR, {
        id: `twin-fangs-${hand}-rank-${rankIndex + 1}`,
        parent,
        familyBit: TWIN_FANGS_STRIKES.familyBit,
        name: 'Twin Fangs',
        icon: 'Ability_Rogue_DualWeild',
        school: 'PHYSICAL',
        configure: strike => strike.row.EquippedItemSubclass.set(ANY_MELEE_WEAPON_SUBCLASSES),
    });
}

export const TWIN_FANGS = createRankedAbility(MR, {
    id: 'twin-fangs',
    parent: MUTILATE,
    familyBit: FAMILY_BIT.TWIN_FANGS,
    firstRankSource: 'TALENT',
    name: 'Twin Fangs',
    // Set per rank below: each rank's weapon strikes are separate spells.
    description: '',
    icon: 'Ability_Rogue_DualWeild',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'energy', energy: 50 },
    customize: (rank, rankIndex) => {
        // Mutilate requires daggers.
        rank.row.EquippedItemSubclass.set(ANY_MELEE_WEAPON_SUBCLASSES);
        // Replaces the combo points.
        grantSpoilsOfWar(rank.Effects.get(0));
        const [mainHand] = (['main-hand', 'off-hand'] as const).map((hand, handIndex) => {
            const trigger = rank.Effects.get(handIndex + 1).TriggerSpell;
            const strike = createTwinFangsStrike(trigger.get(), hand, rankIndex);
            trigger.set(strike.ID);
            return strike;
        });
        rank.Description.enGB.set('Instantly strikes with both weapons for 100% weapon damage plus an additional'
            + ` $${mainHand.ID}s1 with each weapon, and grants a stack of Spoils of War.`);
    },
});

export const RED_MIST = createRankedAbility(MR, {
    id: 'red-mist',
    parent: DEATH_WISH,
    familyBit: FAMILY_BIT.RED_MIST,
    firstRankSource: 'TALENT',
    name: 'Red Mist',
    description: 'A red mist falls over your eyes, increasing your physical damage by $s1%'
        + ' but also increasing all damage taken by $s3%.  Lasts $d.',
    icon: 'Ability_Racial_BloodRage',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_BERSERK },
});

/** The bleed of Bloodbath and of the Bloodletting talent. */
export const DEEP_GASH = createFamilySpell(MR, {
    id: 'deep-gash',
    parent: REND,
    familyBit: FAMILY_BIT.DEEP_GASH,
    name: 'Deep Gash',
    icon: 'Ability_Warrior_Trauma',
    school: 'PHYSICAL',
    configure: spell => {
        spell.Power.CostBase.set(0)
            .Duration.set(DURATION.SEC_6)
            .AuraDescription.enGB.set('Bleeding for $s1 damage every $t1 sec.');
        spell.Effects.get(0).PointsBase.set(12);
        spell.Effects.get(0).AuraPeriod.set(2000);
        periodicDamageScalesWithAttackPower(spell, AP_DEEP_GASH_PER_TICK);
    },
});

/** Deep Gash's total damage as a tooltip expression, for spells that describe it. */
export const DEEP_GASH_DAMAGE_TEXT = withAttackPower(`$${DEEP_GASH.ID}o1`, AP_DEEP_GASH_PER_TICK * DEEP_GASH_TICKS);

export const BLOODBATH = createRankedAbility(MR, {
    id: 'bloodbath',
    parent: BLADE_FLURRY,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.BLOODBATH,
    firstRankSource: 'TALENT',
    name: 'Bloodbath',
    description: 'You revel in the slaughter for $d, growing in size, increasing your attack speed by $s1%'
        + ` and causing every melee hit to inflict Deep Gash, which bleeds the target for ${DEEP_GASH_DAMAGE_TEXT}`
        + ` damage over $${DEEP_GASH.ID}d.`,
    icon: 'Ability_Warrior_BloodBath',
    school: 'PHYSICAL',
    skillLine: SKILL_CARNAGE,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_BLOOD_FRENZY },
    customize: rank => {
        rank.Duration.set(DURATION.SEC_12)
            .Cooldown.Time.set(120000)
            .AuraDescription.enGB.set('Attack speed increased by $s1%.  Melee hits inflict Deep Gash.');
        rank.Effects.get(0).Aura.MOD_MELEE_HASTE.set().PercentBase.set(30);
        rank.Effects.get(1).Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_CASTER')
            .Aura.PROC_TRIGGER_SPELL.set().TriggeredSpell.set(DEEP_GASH.ID);
        rank.Effects.get(2).Type.APPLY_AURA.set()
            .ImplicitTargetA.set('UNIT_CASTER')
            .Aura.MOD_SCALE.set().PercentBase.set(15);
        onMeleeHit(100)(rank, 1);
    },
});

// ---------------------------------------------------------------- talents: Plunder

export const SEIZE_THE_SPOILS = createRankedAbility(MR, {
    id: 'seize-the-spoils',
    parent: COLD_BLOOD,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.SEIZE_THE_SPOILS,
    firstRankSource: 'TALENT',
    name: 'Seize the Spoils',
    description: 'Instantly grants 3 stacks of Spoils of War.',
    icon: 'INV_Misc_Coin_17',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'free' },
    visual: { id: VISUAL_BLOODSURGE },
    customize: rank => {
        rank.Cooldown.Time.set(60000);
        grantSpoilsOfWarStacks(rank, 3);
    },
});

export const SHAKEDOWN = createRankedAbility(MR, {
    id: 'shakedown',
    parent: BASH_NPC,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.SHAKEDOWN,
    firstRankSource: 'TALENT',
    name: 'Shakedown',
    description: 'Roughs up the target, stunning it for $d, and grants 2 stacks of Spoils of War.',
    icon: 'Ability_Rogue_TurntheTables',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'energy', energy: 25 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // The NPC bash is a magic spell; this one is a melee attack.
        rank.DefenseType.set(2)
            .Range.set(RANGE.MELEE)
            .Duration.set(DURATION.SEC_3)
            .Cooldown.Time.set(30000);
        rank.Effects.get(0).Mechanic.set('STUNNED');
        grantSpoilsOfWar(rank.Effects.get(1));
        grantSpoilsOfWar(rank.Effects.get(2));
    },
});

export const KINGS_RANSOM = createRankedAbility(MR, {
    id: 'kings-ransom',
    parent: ADRENALINE_RUSH,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.KINGS_RANSOM,
    firstRankSource: 'TALENT',
    name: 'King\'s Ransom',
    description: 'For $d, Ransack costs no energy and deals $s1% more damage, and Gorge heals $s3% more.'
        + '  Stacks with Spoils of War.',
    icon: 'INV_Bijou_Gold',
    school: 'PHYSICAL',
    skillLine: SKILL_PLUNDER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        rank.Duration.set(DURATION.SEC_15)
            .Cooldown.Time.set(120000)
            .AuraDescription.enGB.set('Ransack costs no energy and deals $s1% more damage.  Gorge heals $s3% more.');
        setSelfAuraEffects(rank, [
            abilityPercent('DAMAGE', 100, [RANSACK]),
            abilityPercent('COST', -100, [RANSACK]),
            abilityPercent('ALL_EFFECTS', 200, [GORGE]),
        ]);
    },
});

// ---------------------------------------------------------------- talents: Skirmish

export const RICOCHET_AXE = createRankedAbility(MR, {
    id: 'ricochet-axe',
    parent: AXE_FLURRY_THROW_NPC,
    ranks: handMadeRanks([[20, 45], [40, 110], [55, 180], [70, 270], [80, 340]]),
    familyBit: FAMILY_BIT.RICOCHET_AXE,
    firstRankSource: 'TALENT',
    name: 'Ricochet Axe',
    description: 'Throws an axe that ricochets between up to $x1 enemies, dealing '
        + withAttackPower('$m1', AP_RICOCHET_AXE) + ' damage to each.',
    icon: 'INV_Axe_68',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 35 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    // The NPC version also stuns.
    clearedEffects: [1],
    customize: rank => {
        throwsAxe(rank, AP_RICOCHET_AXE);
        rank.Cooldown.Time.set(10000);
        rank.Effects.get(0).ChainTarget.set(4);
    },
});

export const AXE_VOLLEY = createRankedAbility(MR, {
    id: 'axe-volley',
    parent: AXE_VOLLEY_NPC,
    ranks: handMadeRanks([[40, 110], [55, 170], [70, 250], [80, 320]]),
    familyBit: FAMILY_BIT.AXE_VOLLEY,
    firstRankSource: 'TALENT',
    name: 'Axe Volley',
    description: 'Hurls a volley of axes at the target, dealing ' + withAttackPower('$m1', AP_AXE_VOLLEY)
        + ' damage to it and every enemy within $a1 yards.',
    icon: 'INV_Axe_89',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'energy', energy: 40 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        throwsAxe(rank, AP_AXE_VOLLEY);
        rank.Cooldown.Time.set(12000);
        rank.Effects.get(0)
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8);
    },
});

/** One second of Axe Storm: an axe at each of up to three nearby enemies. */
export const AXE_STORM_HIT = createFamilySpell(MR, {
    id: 'axe-storm-hit',
    parent: AXE_FLURRY_THROW_NPC,
    familyBit: FAMILY_BIT.AXE_STORM_HIT,
    name: 'Axe Storm',
    icon: 'Ability_Warrior_Bladestorm',
    school: 'PHYSICAL',
    visual: { id: VISUAL_THROWN_AXE, missileSpeed: THROWN_AXE_SPEED },
    configure: spell => {
        scalesWithAttackPower(spell, AP_AXE_STORM);
        spell.MaxTargets.set(3);
        spell.Effects.get(0)
            .ImplicitTargetA.set('SRC_CASTER')
            .ImplicitTargetB.set('UNIT_SRC_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_15)
            .PointsBase.set(150);
        // The NPC version also stuns.
        spell.Effects.get(1).clear();
    },
});

export const AXE_STORM = createRankedAbility(MR, {
    id: 'axe-storm',
    parent: AXE_FLURRY_NPC,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.AXE_STORM,
    firstRankSource: 'TALENT',
    name: 'Axe Storm',
    description: 'Surrounds you with a storm of whirling axes for $d.  Every second, an axe flies at each of'
        + ` up to 3 enemies within 15 yards, dealing ${withAttackPower(`$${AXE_STORM_HIT.ID}m1`, AP_AXE_STORM)}`
        + ' damage.  You can move and fight while the storm rages.',
    icon: 'Ability_Warrior_Bladestorm',
    school: 'PHYSICAL',
    skillLine: SKILL_SKIRMISH,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_BLADESTORM },
    customize: rank => {
        // The NPC version is a channel that needs an axe in hand and stops on movement.
        rank.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
        rank.Attributes.CHANNELED2.set(false);
        rank.ChannelInterruptFlags.clearAll();
        rank.Duration.set(DURATION.SEC_8)
            .Cooldown.Time.set(90000)
            .AuraDescription.enGB.set('Hurling axes at nearby enemies.');
        rank.Effects.get(0).TriggerSpell.set(AXE_STORM_HIT.ID);
        rank.Effects.get(0).AuraPeriod.set(1000);
        rank.Effects.get(1).clear();
        rank.Effects.get(2).clear();
    },
});

/** Every ability a Marauder can learn; the trainer sells all ranks not learned elsewhere. */
export const ALL_ABILITIES: RankedAbility[] = [
    SAVAGE_STRIKE, RANSACK, SERRATED_GASH, HURL_AXE, CHAIN_HOOK, POMMEL_STRIKE, REAVERS_LEAP,
    SCRAPPERS_INSTINCT, GORGE, PLUNDER, DREAD_HOWL, REAVERS_WHIRL, BEHEAD, DUAL_WIELD,
    TWIN_FANGS, RED_MIST, BLOODBATH, SEIZE_THE_SPOILS, SHAKEDOWN, KINGS_RANSOM,
    RICOCHET_AXE, AXE_VOLLEY, AXE_STORM,
];
