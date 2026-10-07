import {
    abilityFlat, abilityPercent, consumedByModifiedSpells, createFamilySpell, createPassiveSpell, createRankedAbility,
    DURATION, periodicDamageScalesWithAttackPower, RANGE, RankedAbility, setSelfAuraEffects, withAttackPower,
} from "classkit";
import { GLOBAL_COOLDOWN_MS } from "../Constants";
import { MONK_CONTEXT as MK } from "../MonkClass";
import { SKILL_MISTWEAVER } from "../MonkSkills";
import { CHI_TAGS, costsChi, tagAbility, tagSpell } from "./Chi";
import { FAMILY_BIT } from "./FamilyBits";
import { ENVELOPING_MIST, healsPercent, RENEWING_MIST, SURGING_MIST } from "./MonkAbilities";

/**
 * Mistweaver healing the Mists of Pandaria way: Soothing Mist channels into
 * instant Surging Mists and Enveloping Mists (which the livescripts weave into
 * the channel, livescripts/SoothingMist.ts), Renewing Mist spreads across
 * the group for Uplift to heal, and Thunder Focus Tea empowers the next
 * Surging Mist. Detox and Resuscitate complete the healer's kit.
 */

// Parent spells.
const HEALTH_FUNNEL = 755;            // channeled heal, with a beam from caster to target
const COLD_BLOOD = 14177;             // off-global-cooldown self buff spent by the next ability
const RUNE_TAP = 48982;               // percent-of-health heal
const CLEANSE = 4987;                 // removes a poison, a disease and a magic effect
const RESURRECTION = 2006;

const SOOTHING_MIST_HEAL_PER_TICK = 20;
const AP_SOOTHING_MIST_PER_TICK = 0.1;
const SOOTHING_MIST_TICK_MS = 1000;
const SOOTHING_MIST_ENERGY = 20;
const UPLIFT_CHI = 2;
const UPLIFT_HEALTH_PERCENT = 6;
const AP_UPLIFT = 0.15;
const THUNDER_FOCUS_TEA_CHI = 1;
const THUNDER_FOCUS_TEA_BONUS_PERCENT = 100;
const RESUSCITATE_HEALTH_PERCENT = 35;

export const SOOTHING_MIST = createRankedAbility(MK, {
    id: 'soothing-mist',
    parent: HEALTH_FUNNEL,
    ranks: [{ level: 10 }],
    familyBit: FAMILY_BIT.SOOTHING_MIST,
    firstRankSource: 'TRAINER',
    name: 'Soothing Mist',
    description: 'Channels healing mists on the target, restoring '
        + withAttackPower('$o1', AP_SOOTHING_MIST_PER_TICK * 8) + ' health over $d.  Every second has a 30% chance'
        + ' to generate 1 Chi.  While channeling, Surging Mist and Enveloping Mist are instant'
        + ' and do not interrupt Soothing Mist.',
    icon: 'Ability_Monk_SoothingMists',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'energy', energy: SOOTHING_MIST_ENERGY },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // Health Funnel drains the caster's health every second for its pet.
        rank.Power.CostPerSecond.set(0).Power.CostPerSecondPerLevel.set(0);
        // Health Funnel's channel shortens with haste; a fixed length lets the livescripts
        // resume an interrupted channel for exactly the time it had left.
        rank.Attributes.HASTE_AFFECT_DURATION.set(false);
        rank.Range.set(RANGE.YARDS_40)
            .Duration.set(DURATION.SEC_8)
            .AuraDescription.enGB.set('Healing $s1 every $t1 sec.');
        rank.Effects.get(0)
            .ImplicitTargetA.set('UNIT_TARGET_ALLY')
            .Aura.PERIODIC_HEAL.set()
            .HealBase.set(SOOTHING_MIST_HEAL_PER_TICK)
            .HealPeriod.set(SOOTHING_MIST_TICK_MS);
        periodicDamageScalesWithAttackPower(rank, AP_SOOTHING_MIST_PER_TICK);
        // Health Funnel's second aura stops the caster's health regeneration; this one lasts as
        // long as the channel and makes the heals it weaves in instant.
        const weaving = rank.Effects.get(1);
        weaving.clear();
        abilityPercent('CASTING_TIME', -100, [SURGING_MIST, ENVELOPING_MIST])(
            weaving.Type.APPLY_AURA.set().ImplicitTargetA.set('UNIT_CASTER'), 1);
    },
});

/**
 * Applied by the livescripts for an instant before resuming Soothing Mist, with
 * the time the interrupted channel had already run as a negative duration.
 */
export const SOOTHING_MIST_RESUME = createPassiveSpell(MK, 'soothing-mist-resume', {
    name: 'Soothing Mist',
    description: '',
    icon: 'Ability_Monk_SoothingMists',
    effects: [abilityFlat('DURATION', 0, [SOOTHING_MIST])],
});

/** Cast by the livescripts on every ally Uplift heals. */
export const UPLIFT_HEAL = createFamilySpell(MK, {
    id: 'uplift-heal',
    parent: RUNE_TAP,
    familyBit: FAMILY_BIT.UPLIFT_HEAL,
    name: 'Uplift',
    icon: 'Ability_Monk_Uplift',
    school: 'NATURE',
    configure: spell => {
        healsPercent(spell, UPLIFT_HEALTH_PERCENT, AP_UPLIFT);
        spell.Range.set(RANGE.YARDS_40);
        spell.Effects.get(0).ImplicitTargetA.set('UNIT_TARGET_ALLY');
    },
});

export const UPLIFT = createRankedAbility(MK, {
    id: 'uplift',
    parent: RUNE_TAP,
    ranks: [{ level: 30 }],
    familyBit: FAMILY_BIT.UPLIFT,
    firstRankSource: 'TRAINER',
    name: 'Uplift',
    description: 'Heals you and every party and raid member within 40 yards who has your Renewing Mist for'
        + ` $${UPLIFT_HEAL.ID}s1% of their maximum health plus ${withAttackPower('0', AP_UPLIFT)}.`,
    icon: 'Ability_Monk_Uplift',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => {
        // Rune Tap's rune cost and cooldown; the livescripts find the targets and heal them.
        rank.row.RuneCostID.set(0);
        rank.Cooldown.Time.set(0);
        rank.Effects.get(0).clear();
        rank.Effects.get(0).Type.DUMMY.set().ImplicitTargetA.set('UNIT_CASTER');
    },
});

export const THUNDER_FOCUS_TEA = createRankedAbility(MK, {
    id: 'thunder-focus-tea',
    parent: COLD_BLOOD,
    ranks: [{ level: 34 }],
    familyBit: FAMILY_BIT.THUNDER_FOCUS_TEA,
    firstRankSource: 'TRAINER',
    name: 'Thunder Focus Tea',
    description: 'Your next Surging Mist heals for $s1% more.',
    icon: 'Ability_Monk_ThunderFocusTea',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    customize: rank => {
        rank.Cooldown.Time.set(45000)
            .Duration.set(DURATION.SEC_30)
            .AuraDescription.enGB.set('Your next Surging Mist heals for $s1% more.');
        setSelfAuraEffects(rank, [abilityPercent('DAMAGE', THUNDER_FOCUS_TEA_BONUS_PERCENT, [SURGING_MIST])]);
        consumedByModifiedSpells(MK, rank, [SURGING_MIST], {
            consumerProcFlags: ['DONE_NO_CLASS_SPELL_POSITIVE'],
            types: ['HEAL'],
            phase: 'HIT',
        });
    },
});

export const DETOX = createRankedAbility(MK, {
    id: 'detox',
    parent: CLEANSE,
    ranks: [{ level: 20 }],
    familyBit: FAMILY_BIT.DETOX,
    firstRankSource: 'TRAINER',
    name: 'Detox',
    description: 'Removes $s1 poison effect, $s2 disease effect and $s3 magic effect from a friendly target.',
    icon: 'ability_rogue_improvedrecuperate',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'energy', energy: 20 },
    globalCooldown: GLOBAL_COOLDOWN_MS,
    customize: rank => rank.Cooldown.Time.set(8000),
});

export const RESUSCITATE = createRankedAbility(MK, {
    id: 'resuscitate',
    parent: RESURRECTION,
    ranks: [{ level: 18 }],
    familyBit: FAMILY_BIT.RESUSCITATE,
    firstRankSource: 'TRAINER',
    name: 'Resuscitate',
    description: 'Returns the spirit to the body, restoring a dead target to life with $s1% of its health.'
        + '  Cannot be cast when in combat.',
    icon: 'Ability_Druid_LunarGuidance',
    school: 'NATURE',
    skillLine: SKILL_MISTWEAVER,
    cost: { kind: 'free' },
    customize: rank => {
        // Resurrection restores a flat amount of health and mana; this effect type restores a percentage.
        rank.Effects.get(0).Type.RESURRECT.set().HealBase.set(RESUSCITATE_HEALTH_PERCENT);
        rank.Effects.get(0).MiscValueA.set(0);
    },
});

costsChi(UPLIFT, UPLIFT_CHI);
costsChi(THUNDER_FOCUS_TEA, THUNDER_FOCUS_TEA_CHI);
tagAbility(UPLIFT, CHI_TAGS.uplift);
tagAbility(RENEWING_MIST, CHI_TAGS.renewingMist);
tagSpell(UPLIFT_HEAL.ID, CHI_TAGS.upliftHeal);
tagAbility(SOOTHING_MIST, CHI_TAGS.soothingMist);
tagAbility(SURGING_MIST, CHI_TAGS.soothingMistWeave);
tagAbility(ENVELOPING_MIST, CHI_TAGS.soothingMistWeave);
tagSpell(SOOTHING_MIST_RESUME.ID, CHI_TAGS.soothingMistResume);

export const MIST_ABILITIES: RankedAbility[] = [SOOTHING_MIST, UPLIFT, THUNDER_FOCUS_TEA, DETOX, RESUSCITATE];
