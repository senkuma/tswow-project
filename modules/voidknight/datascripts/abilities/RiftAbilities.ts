import {
    abilityPercent, ALL_SCHOOLS, consumedByModifiedSpells, createFamilySpell, createRankedAbility, damageDone,
    DURATION, FamilyTarget, meleeCrit, meleeHaste, periodicDamageScalesWithAttackPower, RankedAbility, RankSpec,
    setSelfAuraEffects, withAttackPower,
} from "classkit";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import { SKILL_RIFT } from "../VoidKnightSkills";
import { FAMILY_BIT } from "./FamilyBits";
import { grantVoidShard } from "./VoidShards";

/**
 * The Rift: the Void Knight cuts holes in space to cross it, strike through
 * it and slip out of reach. Movement and defensive parents come from rogues
 * and mages, strikes from warriors.
 */

// Parent spells. Rank chains supply WotLK levels and values.
const REND = 772;
const CLEAVE = 845;
const CHARGE = 100;
const BLINK = 1953;
const PUMMEL = 6552;
const EVASION = 5277;
const WHIRLWIND = 1680;
const SPRINT = 2983;
const MORTAL_STRIKE = 12294;
const SHADOWSTEP = 36554;
const SHADOWSTEP_TELEPORT = 36563;    // the step behind the target and the next-ability bonus
const ADRENALINE_RUSH = 13750;        // a 3 min self buff with no dispel type or mechanic

// Visuals borrowed from spells whose effects fit the ability.
const VISUAL_SHADOW_WORD_PAIN = 71;
const VISUAL_SHADOW_CLEAVE = 7684;    // NPC Shadow Cleave's dark arc
const VISUAL_DEMONIC_TELEPORT = 10694;
const VISUAL_SPELL_LOCK = 5282;
const VISUAL_PHASE_SHIFT = 72;        // the imp's Phase Shift shimmer, which Evasion also uses
const VISUAL_LEVITATE = 6768;
const VISUAL_SCOURGE_STRIKE = 11832;  // a shadow-wreathed weapon strike
const VISUAL_SHADOW_DANCE = 11827;

// SPELL_ATTR0_CANT_USED_IN_COMBAT on Charge; Fold Space is an in-combat gap closer.
const ATTR0_CANT_USED_IN_COMBAT = 0x10000000;
// Mortal Strike's healing reduction group, so Tear Reality does not stack with it.
const HEALING_REDUCTION_GROUP = 1061;

const AP_SPATIAL_REND_PER_TICK = 0.06;
const SPATIAL_REND_TICKS = 5;
const RIFT_AMBUSH_DAMAGE_BONUS = 20;

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
 * which other spells share (Sprint and Blink are both in category 44, so
 * Weightless would otherwise lock Rift Step for 3 min).
 */
function ownCooldown(rank: Spell, cooldownMs: number) {
    rank.Cooldown.Category.set(0)
        .Cooldown.CategoryTime.set(0)
        .Cooldown.Time.set(cooldownMs);
}

// ---------------------------------------------------------------- strikes

export const SPATIAL_REND = createRankedAbility(VK, {
    id: 'spatial-rend',
    parent: REND,
    familyBit: FAMILY_BIT.SPATIAL_REND,
    firstRankSource: 'TRAINER',
    name: 'Spatial Rend',
    description: 'Tears the space around the target, dealing '
        + withAttackPower('$o1', AP_SPATIAL_REND_PER_TICK * SPATIAL_REND_TICKS)
        + ' Shadow damage over $d, and grants a Void Shard.',
    icon: 'Spell_Shadow_PainSpike',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_SHADOW_WORD_PAIN },
    customize: rank => {
        rank.AuraDescription.enGB.set('Taking $s1 Shadow damage every $t1 sec.');
        // A wound in space rather than a bleed: bleed immunity and bleed effects do not apply.
        rank.Mechanic.set(0);
        rank.Effects.get(0).Mechanic.set(0);
        // Rend's weapon-based bonus comes from a warrior script; this scales with attack power instead.
        periodicDamageScalesWithAttackPower(rank, AP_SPATIAL_REND_PER_TICK);
        grantVoidShard(rank.Effects.get(1));
    },
});

export const RIFT_CLEAVE = createRankedAbility(VK, {
    id: 'rift-cleave',
    parent: CLEAVE,
    familyBit: FAMILY_BIT.RIFT_CLEAVE,
    firstRankSource: 'TRAINER',
    name: 'Rift Cleave',
    description: 'Your next swing cuts through space, dealing your weapon damage plus $s1'
        + ' to the target and its nearest ally.',
    icon: 'Ability_Rogue_ShadowStrikes',
    school: 'PHYSICAL',
    skillLine: SKILL_RIFT,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_SHADOW_CLEAVE },
});

// ---------------------------------------------------------------- movement and utility

export const FOLD_SPACE = createRankedAbility(VK, {
    id: 'fold-space',
    parent: CHARGE,
    familyBit: FAMILY_BIT.FOLD_SPACE,
    firstRankSource: 'TRAINER',
    name: 'Fold Space',
    description: 'Folds the space between you and an enemy, carrying you to it, generating $/10;s2 rage'
        + ' and stunning it for $7922d.',
    icon: 'Spell_Shadow_MindTwisting',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 8);
        rank.row.Attributes.set((rank.row.Attributes.get() & ~ATTR0_CANT_USED_IN_COMBAT) >>> 0);
        // Charge's category cooldown would be shared with any other Charge-based spell.
        ownCooldown(rank, 15000);
        // Charge's rage comes from the warrior script, which cloned spells do not run;
        // each rank keeps its parent rank's amount.
        const energize = rank.Effects.get(1);
        const rage = energize.PointsBase.get();
        energize.Type.ENERGIZE.set().PowerType.set('RAGE').ImplicitTargetA.set('UNIT_CASTER');
        energize.PointsBase.set(rage);
    },
});

export const RIFT_STEP = createRankedAbility(VK, {
    id: 'rift-step',
    parent: BLINK,
    ranks: [{ level: 22 }],
    familyBit: FAMILY_BIT.RIFT_STEP,
    firstRankSource: 'TRAINER',
    name: 'Rift Step',
    description: 'Steps through a rift, reappearing $a1 yards forward unless something is in the way.'
        + '  Also frees you from stuns and roots.',
    icon: 'Spell_Shadow_DemonicCircleTeleport',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    visual: { id: VISUAL_DEMONIC_TELEPORT },
    // Blink's own stun and root immunities let it be cast while stunned or rooted and break those effects.
    customize: rank => {
        ownCooldown(rank, 20000);
        rank.AuraDescription.enGB.set('Immune to stuns and roots.');
    },
});

export const NULL_STRIKE = createRankedAbility(VK, {
    id: 'null-strike',
    parent: PUMMEL,
    ranks: [{ level: 10 }],
    familyBit: FAMILY_BIT.NULL_STRIKE,
    firstRankSource: 'TRAINER',
    name: 'Null Strike',
    description: 'Strikes the target with a pulse of null space, interrupting spellcasting and preventing'
        + ' any spell in that school from being cast for $d.',
    icon: 'Spell_Shadow_MindRot',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'rage', rage: 10 },
    visual: { id: VISUAL_SPELL_LOCK },
    // Pummel shares its category cooldown with Kick.
    customize: rank => ownCooldown(rank, 10000),
});

const PHASE_SHIFT_DESCRIPTION = 'Shifts you partly out of phase with this world, increasing your dodge chance'
    + ' by $s1% for $d.';

export const PHASE_SHIFT = createRankedAbility(VK, {
    id: 'phase-shift',
    parent: EVASION,
    familyBit: FAMILY_BIT.PHASE_SHIFT,
    firstRankSource: 'TRAINER',
    name: 'Phase Shift',
    description: PHASE_SHIFT_DESCRIPTION,
    icon: 'Spell_Shadow_ImpPhaseShift',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    visual: { id: VISUAL_PHASE_SHIFT },
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 28);
        rank.Duration.set(DURATION.SEC_10);
        ownCooldown(rank, 180000);
        rank.AuraDescription.enGB.set('Dodge chance increased by $s1%.');
        // Evasion's second rank also turns aside ranged attacks.
        if (rankIndex > 0) {
            rank.Description.enGB.set(PHASE_SHIFT_DESCRIPTION
                + '  Ranged attacks are also $s2% less likely to hit you.');
            rank.AuraDescription.enGB.set('Dodge chance increased by $s1%.'
                + '  Chance to be hit by ranged attacks reduced by $s2%.');
        }
    },
});

export const DIMENSIONAL_RUPTURE = createRankedAbility(VK, {
    id: 'dimensional-rupture',
    parent: WHIRLWIND,
    ranks: handMadeRanks([[36, 40], [46, 75], [56, 110], [66, 150], [76, 195]]),
    familyBit: FAMILY_BIT.DIMENSIONAL_RUPTURE,
    firstRankSource: 'TRAINER',
    name: 'Dimensional Rupture',
    description: 'Whirls through a ring of rifts, striking up to $i enemies within $a1 yards'
        + ' for weapon damage plus $s1.',
    icon: 'Spell_Shadow_Shadowfury',
    school: 'PHYSICAL',
    skillLine: SKILL_RIFT,
    cost: { kind: 'rage', rage: 20 },
    // The off-hand spin; Void Knights fight with two-handers.
    clearedEffects: [1],
    customize: rank => ownCooldown(rank, 10000),
});

export const WEIGHTLESS = createRankedAbility(VK, {
    id: 'weightless',
    parent: SPRINT,
    familyBit: FAMILY_BIT.WEIGHTLESS,
    firstRankSource: 'TRAINER',
    name: 'Weightless',
    description: 'Sheds the pull of gravity, increasing your movement speed by $s1% for $d.',
    icon: 'Spell_Magic_FeatherFall',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    visual: { id: VISUAL_LEVITATE },
    customize: (rank, rankIndex) => {
        firstRankAt(rank, rankIndex, 26);
        rank.Duration.set(DURATION.SEC_8);
        ownCooldown(rank, 180000);
        rank.AuraDescription.enGB.set('Movement speed increased by $s1%.');
    },
});

// ---------------------------------------------------------------- talents

export const TEAR_REALITY = createRankedAbility(VK, {
    id: 'tear-reality',
    parent: MORTAL_STRIKE,
    // Mortal Strike starts at 40; Tear Reality is a second-row talent, so its ranks start at 20.
    ranks: handMadeRanks([
        [20, 30], [30, 55], [40, 85], [48, 110], [54, 135],
        [60, 160], [66, 185], [70, 210], [75, 320], [80, 380],
    ], 1),
    familyBit: FAMILY_BIT.TEAR_REALITY,
    firstRankSource: 'TALENT',
    name: 'Tear Reality',
    description: 'A void-charged strike that tears at the target\'s reality, dealing weapon damage plus $s2'
        + ' as Shadow damage and reducing all healing it receives by $s1% for $d.',
    icon: 'Spell_Shadow_RitualOfSacrifice',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'rage', rage: 20 },
    visual: { id: VISUAL_SCOURGE_STRIKE },
    spellGroup: HEALING_REDUCTION_GROUP,
    customize: rank => {
        ownCooldown(rank, 6000);
        rank.AuraDescription.enGB.set('Healing received reduced by $s1%.');
    },
});

/** The Void Knight's direct damage abilities, which Rift Ambush empowers. */
const AMBUSH_FOLLOW_UPS: FamilyTarget[] = [
    FAMILY_BIT.VOID_STRIKE, FAMILY_BIT.GRAVITY_LASH, FAMILY_BIT.COLLAPSE, FAMILY_BIT.IMPLOSION,
    FAMILY_BIT.ANNIHILATE, FAMILY_BIT.SINGULARITY, FAMILY_BIT.RIFT_CLEAVE, FAMILY_BIT.DIMENSIONAL_RUPTURE,
    FAMILY_BIT.TEAR_REALITY, FAMILY_BIT.CRUSHING_WEIGHT, FAMILY_BIT.GRAVITON_SHOCKWAVE,
].map(familyBit => ({ familyBit }));

/** The step behind the target that Rift Ambush triggers, and the damage bonus it leaves. */
export const RIFT_AMBUSH_STEP = createFamilySpell(VK, {
    id: 'rift-ambush-step',
    parent: SHADOWSTEP_TELEPORT,
    familyBit: FAMILY_BIT.RIFT_PROC_7,
    name: 'Rift Ambush',
    icon: 'Ability_Rogue_Shadowstep',
    school: 'SHADOW',
    configure: spell => {
        spell.AuraDescription.enGB.set('Damage caused by your next ability increased by $s2%.');
        // Shadowstep's modifiers target rogue abilities through their family flags.
        const bonus = spell.Effects.get(1);
        bonus.clear();
        abilityPercent('DAMAGE', RIFT_AMBUSH_DAMAGE_BONUS, AMBUSH_FOLLOW_UPS)(
            bonus.Type.APPLY_AURA.set().ImplicitTargetA.set('UNIT_CASTER'), 1);
        spell.Effects.get(2).clear();
        consumedByModifiedSpells(VK, spell, AMBUSH_FOLLOW_UPS, {
            consumerProcFlags: ['DONE_MELEE_SPELL', 'DONE_RANGED_SPELL', 'DONE_MAGIC_SPELL_NEGATIVE'],
            types: ['DAMAGE'],
            phase: 'HIT',
        });
    },
});

export const RIFT_AMBUSH = createRankedAbility(VK, {
    id: 'rift-ambush',
    parent: SHADOWSTEP,
    ranks: [{ level: 40 }],
    familyBit: FAMILY_BIT.RIFT_AMBUSH,
    firstRankSource: 'TALENT',
    name: 'Rift Ambush',
    description: 'Steps through a rift to reappear behind the target and increases your movement speed by $s3%'
        + ` for $d.  The damage of your next ability within $${RIFT_AMBUSH_STEP.ID}d is increased by`
        + ` $${RIFT_AMBUSH_STEP.ID}s2%.`,
    icon: 'Ability_Rogue_Shadowstep',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    // Shadowstep's threat reduction, unwanted on a tank.
    clearedEffects: [1],
    customize: rank => {
        ownCooldown(rank, 30000);
        rank.Effects.get(0).TriggerSpell.set(RIFT_AMBUSH_STEP.ID);
    },
});

export const SHATTER_REALITY = createRankedAbility(VK, {
    id: 'shatter-reality',
    parent: ADRENALINE_RUSH,
    ranks: [{ level: 60 }],
    familyBit: FAMILY_BIT.SHATTER_REALITY,
    firstRankSource: 'TALENT',
    name: 'Shatter Reality',
    description: 'Shatters the bounds of reality around you for $d, increasing all damage you deal by $s1%,'
        + ' your melee attack speed by $s2% and your chance to critically hit by $s3%.',
    icon: 'Spell_Shadow_Twilight',
    school: 'SHADOW',
    skillLine: SKILL_RIFT,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    visual: { id: VISUAL_SHADOW_DANCE },
    customize: rank => {
        rank.Duration.set(DURATION.SEC_20)
            .Cooldown.Time.set(180000)
            .AuraDescription.enGB.set('Damage done increased by $s1%.  Melee attack speed increased by $s2%.'
                + '  Critical strike chance increased by $s3%.');
        // Adrenaline Rush's energy regeneration.
        [0, 1, 2].forEach(index => rank.Effects.get(index).clear());
        setSelfAuraEffects(rank, [damageDone(ALL_SCHOOLS, 20), meleeHaste(20), meleeCrit(10)]);
    },
});

/** Every Rift ability, talent abilities included. */
export const RIFT_ABILITIES: RankedAbility[] = [
    SPATIAL_REND, RIFT_CLEAVE, FOLD_SPACE, RIFT_STEP, NULL_STRIKE, PHASE_SHIFT, DIMENSIONAL_RUPTURE, WEIGHTLESS,
    TEAR_REALITY, RIFT_AMBUSH, SHATTER_REALITY,
];
