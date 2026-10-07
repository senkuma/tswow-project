import {
    ALL_SCHOOLS, createFamilySpell, createRankedAbility, damageDone, DURATION, healingDone, RankedAbility, RankSpec,
    setSelfAuraEffects,
} from "classkit";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { PLAGUE_DOCTOR_CONTEXT as PD } from "../PlagueDoctorClass";
import { SKILL_ALCHEMY, SKILL_PESTILENCE, SKILL_REMEDY } from "../PlagueDoctorSkills";
import { FAMILY_BIT } from "./FamilyBits";

/**
 * The Plague Doctor is a mana caster built from the casters' WotLK rank
 * chains, so levels, mana costs, cast times and spell power scaling follow
 * the spells they replace. Spells that only work through their original
 * class's scripts (Devouring Plague's self heal, Wild Growth's targeting,
 * Weakened Soul) are avoided or described without that part.
 */

// Parent spells: first ranks of WotLK rank chains, or single spells.
const WRATH = 5176;
const CORRUPTION = 172;
const DEVOURING_PLAGUE = 2944;
const DEATH_AND_DECAY = 43265;        // ground-targeted cloud that damages enemies inside it
const ENTANGLING_ROOTS = 339;
const DRAIN_LIFE = 689;
const HEALING_TOUCH = 5185;
const REJUVENATION = 774;
const REGROWTH = 8936;
const PURIFY = 1152;                  // removes a poison and a disease
const RESURRECTION = 2006;
const EVOCATION = 12051;
const INSECT_SWARM = 5570;
const SILENCE = 15487;
const UNSTABLE_AFFLICTION = 30108;
const FLAMESTRIKE = 2120;
const POWER_WORD_SHIELD = 17;
const ARCANE_POWER = 12042;
const POWER_INFUSION = 10060;
const PRAYER_OF_HEALING = 596;
const CHAIN_HEAL = 1064;

// Spell power per tick of the periodic effects whose parents scale with attack power or not at all.
const SP_MIASMA_PER_TICK = 0.06;
const SP_FESTERING_BLIGHT_PER_TICK = 0.05;

const SMELLING_SALTS_HEALTH_PERCENT = 35;
const PHILOSOPHERS_DRAUGHT_BONUS_PERCENT = 20;

const handMadeRanks = (ranks: [level: number, value: number][], effectIndex = 0): RankSpec[] =>
    ranks.map(([level, value]) => ({
        level,
        configure: rank => rank.Effects.get(effectIndex).PointsBase.set(value),
    }));

// ---------------------------------------------------------------- Pestilence: toxins, gas and disease

export const TOXIC_VIAL = createRankedAbility(PD, {
    id: 'toxic-vial',
    parent: WRATH,
    familyBit: FAMILY_BIT.TOXIC_VIAL,
    firstRankSource: 'START',
    name: 'Toxic Vial',
    description: 'Hurls a vial of caustic toxin at the enemy, causing $s1 Nature damage.',
    icon: 'Spell_Nature_CorrosiveBreath',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
});

export const BLIGHT_INJECTION = createRankedAbility(PD, {
    id: 'blight-injection',
    parent: CORRUPTION,
    familyBit: FAMILY_BIT.BLIGHT_INJECTION,
    firstRankSource: 'TRAINER',
    name: 'Blight Injection',
    description: 'Injects the target with a festering blight that causes $o1 Nature damage over $d.',
    icon: 'Ability_Creature_Disease_03',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('$s1 Nature damage every $t1 sec.'),
});

export const CONTAGION = createRankedAbility(PD, {
    id: 'contagion',
    parent: DEVOURING_PLAGUE,
    familyBit: FAMILY_BIT.CONTAGION,
    firstRankSource: 'TRAINER',
    name: 'Contagion',
    description: 'Afflicts the target with a virulent plague, causing $o1 Shadow damage over $d.'
        + '  Contagion is a disease.',
    icon: 'Spell_Shadow_CreepingPlague',
    school: 'SHADOW',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('$s1 Shadow damage every $t1 sec.'),
});

export const MIASMA = createRankedAbility(PD, {
    id: 'miasma',
    parent: DEATH_AND_DECAY,
    ranks: handMadeRanks([[20, 14], [30, 24], [40, 36], [50, 50], [60, 66], [70, 88], [80, 112]]),
    familyBit: FAMILY_BIT.MIASMA,
    firstRankSource: 'TRAINER',
    name: 'Miasma',
    description: 'Shatters a flask of foul gas at the target location.  The choking cloud deals $s1 Nature damage'
        + ' every $t1 sec to enemies within $a1 yards for $d.',
    icon: 'Spell_Shadow_PlagueCloud',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'mana-percent', percent: 18 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // Death and Decay costs runes and scales with attack power.
        rank.row.RuneCostID.set(0);
        rank.BonusData.APDotBonus.set(0)
            .BonusData.DotBonus.set(SP_MIASMA_PER_TICK);
        rank.Cooldown.Time.set(20000);
    },
});

export const PARALYTIC_TOXIN = createRankedAbility(PD, {
    id: 'paralytic-toxin',
    parent: ENTANGLING_ROOTS,
    familyBit: FAMILY_BIT.PARALYTIC_TOXIN,
    firstRankSource: 'TRAINER',
    name: 'Paralytic Toxin',
    description: 'Splashes the enemy with a paralytic toxin that roots it in place and causes $o2 Nature damage'
        + ' over $d.  Damage caused may interrupt the effect.',
    icon: 'Ability_PoisonSting',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('Rooted.  $s2 Nature damage every $t2 sec.'),
});

export const LEECH_THERAPY = createRankedAbility(PD, {
    id: 'leech-therapy',
    parent: DRAIN_LIFE,
    familyBit: FAMILY_BIT.LEECH_THERAPY,
    firstRankSource: 'TRAINER',
    name: 'Leech Therapy',
    description: 'Applies hungry leeches to the target, transferring $s1 health every $t1 sec from the target'
        + ' to you for $d.',
    icon: 'Spell_Shadow_LifeDrain02',
    school: 'SHADOW',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
});

// ---------------------------------------------------------------- Remedy: draughts, tonics and injections

export const RESTORATIVE_DRAUGHT = createRankedAbility(PD, {
    id: 'restorative-draught',
    parent: HEALING_TOUCH,
    familyBit: FAMILY_BIT.RESTORATIVE_DRAUGHT,
    firstRankSource: 'START',
    name: 'Restorative Draught',
    description: 'Administers a carefully measured draught that heals a friendly target for $s1.',
    icon: 'INV_Potion_51',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
});

export const HERBAL_TONIC = createRankedAbility(PD, {
    id: 'herbal-tonic',
    parent: REJUVENATION,
    familyBit: FAMILY_BIT.HERBAL_TONIC,
    firstRankSource: 'TRAINER',
    name: 'Herbal Tonic',
    description: 'A bitter herbal tonic that heals the target for $o1 over $d.',
    icon: 'Spell_Nature_Rejuvenation',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('Heals $s1 damage every $t1 sec.'),
});

export const RESTORATIVE_INJECTION = createRankedAbility(PD, {
    id: 'restorative-injection',
    parent: REGROWTH,
    familyBit: FAMILY_BIT.RESTORATIVE_INJECTION,
    firstRankSource: 'TRAINER',
    name: 'Restorative Injection',
    description: 'Injects a friendly target with a restorative serum, healing it for $s1 and another $o2 over $d.',
    icon: 'Spell_Nature_ResistNature',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('Heals $s2 damage every $t2 sec.'),
});

export const PURIFYING_ANTIDOTE = createRankedAbility(PD, {
    id: 'purifying-antidote',
    parent: PURIFY,
    familyBit: FAMILY_BIT.PURIFYING_ANTIDOTE,
    firstRankSource: 'TRAINER',
    name: 'Purifying Antidote',
    description: 'Administers an antidote to a friendly target, removing 1 poison effect and 1 disease effect.',
    icon: 'Spell_Nature_NullifyPoison_02',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
});

export const SMELLING_SALTS = createRankedAbility(PD, {
    id: 'smelling-salts',
    parent: RESURRECTION,
    ranks: [{ level: 12 }],
    familyBit: FAMILY_BIT.SMELLING_SALTS,
    firstRankSource: 'TRAINER',
    name: 'Smelling Salts',
    description: 'A whiff of pungent salts jolts a dead target back to life with $s1% of its health.'
        + '  Cannot be cast when in combat.',
    icon: 'Spell_Holy_Resurrection',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'mana-percent', percent: 60 },
    customize: rank => {
        // Resurrection restores a flat amount of health and mana; this effect type restores a percentage.
        rank.Effects.get(0).Type.RESURRECT.set().HealBase.set(SMELLING_SALTS_HEALTH_PERCENT);
        rank.Effects.get(0).MiscValueA.set(0);
    },
});

// ---------------------------------------------------------------- Alchemy: reagents and concoctions

export const DISTILL_ESSENCE = createRankedAbility(PD, {
    id: 'distill-essence',
    parent: EVOCATION,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.DISTILL_ESSENCE,
    firstRankSource: 'TRAINER',
    name: 'Distill Essence',
    description: 'Distills arcane essence from your reagents, restoring $o1% of your total mana over $d.',
    icon: 'Trade_Alchemy',
    school: 'ARCANE',
    skillLine: SKILL_ALCHEMY,
    cost: { kind: 'free' },
});

// ---------------------------------------------------------------- talents: Pestilence

export const PLAGUE_SWARM = createRankedAbility(PD, {
    id: 'plague-swarm',
    parent: INSECT_SWARM,
    familyBit: FAMILY_BIT.PLAGUE_SWARM,
    firstRankSource: 'TALENT',
    name: 'Plague Swarm',
    description: 'Releases a swarm of plague-ridden flies on the enemy, decreasing its chance to hit by $s2%'
        + ' and causing $o1 Nature damage over $d.',
    icon: 'Spell_Nature_InsectSwarm',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('Chance to hit decreased by $s2%.  $s1 Nature damage every $t1 sec.'),
});

export const CHOKING_GAS = createRankedAbility(PD, {
    id: 'choking-gas',
    parent: SILENCE,
    familyBit: FAMILY_BIT.CHOKING_GAS,
    firstRankSource: 'TALENT',
    name: 'Choking Gas',
    description: 'Fills the enemy\'s lungs with choking gas, silencing it for $d.',
    icon: 'Spell_Shadow_CurseOfTounges',
    school: 'NATURE',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
});

export const BLACK_DEATH = createRankedAbility(PD, {
    id: 'black-death',
    parent: UNSTABLE_AFFLICTION,
    familyBit: FAMILY_BIT.BLACK_DEATH,
    firstRankSource: 'TALENT',
    name: 'Black Death',
    description: 'Infects the enemy with the Black Death, causing $o1 Shadow damage over $d.',
    icon: 'Spell_Shadow_AnimateDead',
    school: 'SHADOW',
    skillLine: SKILL_PESTILENCE,
    cost: { kind: 'parent' },
    customize: rank => rank.AuraDescription.enGB.set('$s1 Shadow damage every $t1 sec.'),
});

/** Inflicted by Toxic Vial hits through the Spreading Blight talent. */
export const FESTERING_BLIGHT = createFamilySpell(PD, {
    id: 'festering-blight',
    parent: CORRUPTION,
    familyBit: FAMILY_BIT.FESTERING_BLIGHT,
    name: 'Festering Blight',
    icon: 'Ability_Creature_Disease_02',
    school: 'NATURE',
    configure: spell => {
        spell.Power.CostBase.set(0).Power.CostPercent.set(0)
            .Duration.set(DURATION.SEC_12)
            .AuraDescription.enGB.set('$s1 Nature damage every $t1 sec.');
        spell.Effects.get(0).PointsBase.set(18);
        spell.Effects.get(0).AuraPeriod.set(3000);
        spell.BonusData.DotBonus.set(SP_FESTERING_BLIGHT_PER_TICK);
    },
});

// ---------------------------------------------------------------- talents: Alchemy

export const ALCHEMISTS_FIRE = createRankedAbility(PD, {
    id: 'alchemists-fire',
    parent: FLAMESTRIKE,
    familyBit: FAMILY_BIT.ALCHEMISTS_FIRE,
    firstRankSource: 'TALENT',
    name: 'Alchemist\'s Fire',
    description: 'Lobs a flask of alchemist\'s fire at the target location, dealing $s1 Fire damage to enemies'
        + ' within $a1 yards and leaving a burning pool that deals an additional $o2 Fire damage over $d.',
    icon: 'INV_Misc_Bomb_04',
    school: 'FIRE',
    skillLine: SKILL_ALCHEMY,
    cost: { kind: 'parent' },
});

export const MERCURIAL_WARD = createRankedAbility(PD, {
    id: 'mercurial-ward',
    parent: POWER_WORD_SHIELD,
    ranks: handMadeRanks([[40, 900], [50, 1300], [60, 1800], [70, 2400], [80, 3100]]),
    familyBit: FAMILY_BIT.MERCURIAL_WARD,
    firstRankSource: 'TALENT',
    name: 'Mercurial Ward',
    description: 'Coats a friendly target in a film of quicksilver that absorbs $s1 damage.  Lasts $d.',
    icon: 'INV_Potion_83',
    school: 'ARCANE',
    skillLine: SKILL_ALCHEMY,
    cost: { kind: 'mana-percent', percent: 20 },
    customize: rank => {
        // Without Weakened Soul (a priest mechanic) the ward needs a cooldown of its own.
        rank.Cooldown.Time.set(8000)
            .AuraDescription.enGB.set('Absorbs damage.');
    },
});

export const PHILOSOPHERS_DRAUGHT = createRankedAbility(PD, {
    id: 'philosophers-draught',
    parent: ARCANE_POWER,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.PHILOSOPHERS_DRAUGHT,
    firstRankSource: 'TALENT',
    name: 'Philosopher\'s Draught',
    description: 'Drinks a draught distilled from the philosopher\'s stone, increasing all damage and healing'
        + ' you deal by $s1% for $d.',
    icon: 'INV_Potion_113',
    school: 'ARCANE',
    skillLine: SKILL_ALCHEMY,
    cost: { kind: 'free' },
    customize: rank => {
        rank.AuraDescription.enGB.set('Damage and healing done increased by $s1%.');
        // Arcane Power also raises the cost of mage spells.
        rank.Effects.clearAll();
        setSelfAuraEffects(rank, [
            damageDone(ALL_SCHOOLS, PHILOSOPHERS_DRAUGHT_BONUS_PERCENT),
            healingDone(PHILOSOPHERS_DRAUGHT_BONUS_PERCENT),
        ]);
    },
});

// ---------------------------------------------------------------- talents: Remedy

export const ADRENAL_INJECTION = createRankedAbility(PD, {
    id: 'adrenal-injection',
    parent: POWER_INFUSION,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.ADRENAL_INJECTION,
    firstRankSource: 'TALENT',
    name: 'Adrenal Injection',
    description: 'Injects a friendly target with an adrenal stimulant, increasing its casting speed by $s1%'
        + ' and reducing the mana cost of all its spells by $s2% for $d.',
    icon: 'Spell_Holy_PowerInfusion',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
});

export const HEALING_VAPORS = createRankedAbility(PD, {
    id: 'healing-vapors',
    parent: PRAYER_OF_HEALING,
    familyBit: FAMILY_BIT.HEALING_VAPORS,
    firstRankSource: 'TALENT',
    name: 'Healing Vapors',
    description: 'Releases a cloud of healing vapors that heals the target\'s party members within $a1 yards'
        + ' for $s1.',
    icon: 'Spell_Nature_Tranquility',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
});

export const PANACEA = createRankedAbility(PD, {
    id: 'panacea',
    parent: CHAIN_HEAL,
    ranks: handMadeRanks([[60, 800], [70, 1050], [80, 1300]]),
    familyBit: FAMILY_BIT.PANACEA,
    firstRankSource: 'TALENT',
    name: 'Panacea',
    description: 'Sprays a cure-all mist that heals the friendly target for $s1, then drifts to up to $x1 nearby'
        + ' wounded allies.  Each jump heals less.',
    icon: 'Spell_Nature_HealingWaveGreater',
    school: 'NATURE',
    skillLine: SKILL_REMEDY,
    cost: { kind: 'parent' },
});

/** Every ability a Plague Doctor can learn; the trainer sells all ranks not learned elsewhere. */
export const ALL_ABILITIES: RankedAbility[] = [
    TOXIC_VIAL, BLIGHT_INJECTION, CONTAGION, MIASMA, PARALYTIC_TOXIN, LEECH_THERAPY,
    RESTORATIVE_DRAUGHT, HERBAL_TONIC, RESTORATIVE_INJECTION, PURIFYING_ANTIDOTE, SMELLING_SALTS, DISTILL_ESSENCE,
    PLAGUE_SWARM, CHOKING_GAS, BLACK_DEATH, ALCHEMISTS_FIRE, MERCURIAL_WARD, PHILOSOPHERS_DRAUGHT,
    ADRENAL_INJECTION, HEALING_VAPORS, PANACEA,
];
