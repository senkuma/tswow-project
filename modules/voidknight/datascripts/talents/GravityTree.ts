import {
    abilityFlat, abilityPercent, attackPowerPercent, createTalentTree, damageDone, onAbilityHit, onKillingBlow,
    onMeleeHit, statPercent, triggerSpell,
} from "classkit";
import {
    ANNIHILATE, COLLAPSE, CRUSHING_DESCENT, GRAVITATIONAL_PULL, GRAVITON_SURGE, GRAVITY_LASH, GRAVITY_LOCK,
    IMPLOSION, SINGULARITY, STELLAR_COLLAPSE, TAP_THE_VOID, VOID_STRIKE,
} from "../abilities/GravityAbilities";
import { VOID_SHARDS } from "../abilities/VoidShards";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import {
    CRUSHING_PRESSURE, GRAVITIC_CRUSH, GRAVITIC_CRUSH_DAMAGE_TEXT, GRAVITIC_DRAG, GRAVITIC_MOMENTUM,
    HAWKING_RADIATION, TIDAL_LOCK,
} from "./GravityProcs";

/** Damage through control: crushing blows, pulls and roots, and Void Shards spent in area collapses. */
export const GRAVITY_TREE = createTalentTree(VK, {
    id: 'gravity',
    name: 'Gravity',
    tabIndex: 0,
    background: 'PriestShadow',
    icon: 'Spell_Shadow_UnholyFrenzy',
    talents: [
        {
            kind: 'passive', id: 'dense-matter', row: 0, column: 0, ranks: 5,
            name: 'Dense Matter', icon: 'INV_Enchant_VoidSphere',
            description: 'Increases the damage of Void Strike by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [VOID_STRIKE])],
        },
        {
            kind: 'passive', id: 'void-attunement', row: 0, column: 1, ranks: 5,
            name: 'Void Attunement', icon: 'Spell_Shadow_ShadowPower',
            description: 'Increases all Shadow damage you deal by $s1%.',
            effects: [damageDone(['SHADOW'], 1)],
        },
        {
            kind: 'passive', id: 'effortless-weight', row: 0, column: 2, ranks: 3,
            name: 'Effortless Weight', icon: 'Spell_Shadow_DarkRitual',
            description: 'Reduces the rage cost of Void Strike by $/10;S1.',
            // Rage costs are stored in tenths of a point.
            effects: [abilityFlat('COST', -10, [VOID_STRIKE])],
        },
        {
            kind: 'passive', id: 'tidal-forces', row: 1, column: 0, ranks: 3,
            name: 'Tidal Forces', icon: 'Spell_Shadow_ShadowMend',
            description: 'Increases the damage of Gravity Lash by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [GRAVITY_LASH])],
        },
        {
            kind: 'passive', id: 'gravitic-reach', row: 1, column: 1, ranks: 2,
            name: 'Gravitic Reach', icon: 'Spell_Shadow_Teleport',
            description: 'Increases the range of Gravity Lash and Gravitational Pull by $s1 yards.',
            effects: [abilityFlat('RANGE', 3, [GRAVITY_LASH, GRAVITATIONAL_PULL])],
        },
        {
            kind: 'passive', id: 'weight-of-worlds', row: 1, column: 2, ranks: 5,
            name: 'Weight of Worlds', icon: 'Spell_Shadow_UnholyStrength',
            description: 'Increases your Strength by $s1%.',
            effects: [statPercent('STRENGTH', 2)],
        },
        {
            kind: 'passive', id: 'tidal-lock', row: 2, column: 0, ranks: 3,
            requires: 'tidal-forces',
            name: 'Tidal Lock', icon: 'Spell_DeathKnight_Strangulate',
            description: 'Your Gravity Lash has a $h% chance to lock the target in place, immobilizing it'
                + ` for $${TIDAL_LOCK.ID}d.`,
            effects: [triggerSpell(TIDAL_LOCK.ID)],
            configure: onAbilityHit(VK, 10, [GRAVITY_LASH]),
        },
        { kind: 'active', id: 'singularity', row: 2, column: 1, ability: SINGULARITY },
        {
            kind: 'passive', id: 'crushing-depths', row: 2, column: 2, ranks: 3,
            name: 'Crushing Depths', icon: 'Spell_Shadow_PainSpike',
            description: 'Increases the critical strike damage bonus of Collapse and Annihilate by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [COLLAPSE, ANNIHILATE])],
        },
        {
            kind: 'passive', id: 'orbital-decay', row: 3, column: 0, ranks: 2,
            name: 'Orbital Decay', icon: 'Spell_Shadow_ShadowWard',
            description: 'Increases the duration of Gravity Lock by $/1000;s1 sec and reduces its cooldown'
                + ' by $/1000;S2 sec.',
            effects: [
                abilityFlat('DURATION', 1000, [GRAVITY_LOCK]),
                abilityFlat('COOLDOWN', -2500, [GRAVITY_LOCK]),
            ],
        },
        {
            kind: 'passive', id: 'improved-singularity', row: 3, column: 1, ranks: 2,
            requires: 'singularity',
            name: 'Improved Singularity', icon: 'Spell_Shadow_Shadesofdarkness',
            description: 'Increases the damage of Singularity by $s1% and its radius by $s2 yards.',
            effects: [
                abilityPercent('DAMAGE', 10, [SINGULARITY]),
                abilityFlat('RADIUS', 2, [SINGULARITY]),
            ],
        },
        {
            kind: 'passive', id: 'neutron-density', row: 3, column: 2, ranks: 3,
            name: 'Neutron Density', icon: 'INV_Enchant_VoidCrystal',
            description: 'Increases the damage bonus each Void Shard grants to Collapse and Implosion by $s1%.',
            effects: [abilityPercent('EFFECT1', 10, [VOID_SHARDS])],
        },
        {
            kind: 'passive', id: 'abyssal-thirst', row: 3, column: 3, ranks: 2,
            name: 'Abyssal Thirst', icon: 'Spell_Shadow_SoulLeech_3',
            description: 'Reduces the cooldown of Tap the Void by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -10000, [TAP_THE_VOID])],
        },
        {
            kind: 'passive', id: 'shockfront', row: 4, column: 0, ranks: 2,
            name: 'Shockfront', icon: 'Spell_Shadow_AuraOfDarkness',
            description: 'Increases the radius of Implosion and Gravity Lock by $s1 yards.',
            effects: [abilityFlat('RADIUS', 2, [IMPLOSION, GRAVITY_LOCK])],
        },
        {
            kind: 'passive', id: 'critical-mass', row: 4, column: 1, ranks: 3,
            name: 'Critical Mass', icon: 'Spell_Shadow_SoulGem',
            description: 'Critical strikes with Void Strike and Gravity Lash have a $h% chance to grant you'
                + ' an additional Void Shard.',
            effects: [triggerSpell(VOID_SHARDS.ID)],
            configure: onAbilityHit(VK, 33, [VOID_STRIKE, GRAVITY_LASH], 'CRITICAL'),
        },
        {
            kind: 'passive', id: 'inexorable-pull', row: 4, column: 2, ranks: 2,
            name: 'Inexorable Pull', icon: 'Spell_Shadow_DemonicCircleTeleport',
            description: 'Reduces the cooldown of Gravitational Pull by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -5000, [GRAVITATIONAL_PULL])],
        },
        {
            kind: 'passive', id: 'roche-limit', row: 5, column: 0, ranks: 3,
            name: 'Roche Limit', icon: 'Spell_Shadow_SeedOfDestruction',
            description: 'Increases the damage of Implosion by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [IMPLOSION])],
        },
        {
            kind: 'passive', id: 'crushing-gravity', row: 5, column: 1, ranks: 5,
            name: 'Crushing Gravity', icon: 'Spell_Shadow_MindTwisting',
            description: 'Your melee attacks have a $h% chance to crush the target beneath its own weight,'
                + ` dealing ${GRAVITIC_CRUSH_DAMAGE_TEXT} Shadow damage.`,
            effects: [triggerSpell(GRAVITIC_CRUSH.ID)],
            configure: onMeleeHit(2),
        },
        {
            kind: 'passive', id: 'dark-matter', row: 5, column: 2, ranks: 3,
            name: 'Dark Matter', icon: 'INV_Elemental_Mote_Shadow01',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'gravitic-drag', row: 6, column: 0, ranks: 2,
            name: 'Gravitic Drag', icon: 'Spell_Shadow_GatherShadows',
            description: 'Enemies struck by your Implosion and Singularity have a $h% chance to be dragged down,'
                + ` reducing their movement speed by $${GRAVITIC_DRAG.ID}s1% for $${GRAVITIC_DRAG.ID}d.`,
            effects: [triggerSpell(GRAVITIC_DRAG.ID)],
            configure: onAbilityHit(VK, 50, [IMPLOSION, SINGULARITY]),
        },
        { kind: 'active', id: 'graviton-surge', row: 6, column: 1, ability: GRAVITON_SURGE },
        {
            kind: 'passive', id: 'improved-graviton-surge', row: 6, column: 2, ranks: 2,
            requires: 'graviton-surge',
            name: 'Improved Graviton Surge', icon: 'Spell_Shadow_ShadowEmbrace',
            description: 'Increases the duration of Graviton Surge by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 2500, [GRAVITON_SURGE])],
        },
        {
            kind: 'passive', id: 'crushing-pressure', row: 7, column: 0, ranks: 3,
            name: 'Crushing Pressure', icon: 'Spell_Shadow_Shadowfury',
            description: 'Your Collapse has a $h% chance to pin the target beneath crushing gravity, stunning it'
                + ` for $${CRUSHING_PRESSURE.ID}d.`,
            effects: [triggerSpell(CRUSHING_PRESSURE.ID)],
            configure: onAbilityHit(VK, 10, [COLLAPSE]),
        },
        {
            kind: 'passive', id: 'gravitic-momentum', row: 7, column: 1, ranks: 3,
            name: 'Gravitic Momentum', icon: 'Spell_Shadow_ShadowWordDominate',
            description: 'Your Collapse and Implosion have a $h% chance to grant you Gravitic Momentum, increasing'
                + ` all damage you deal by $${GRAVITIC_MOMENTUM.ID}s1% for $${GRAVITIC_MOMENTUM.ID}d.`,
            effects: [triggerSpell(GRAVITIC_MOMENTUM.ID)],
            configure: onAbilityHit(VK, 33, [COLLAPSE, IMPLOSION]),
        },
        {
            kind: 'passive', id: 'meteoric-descent', row: 7, column: 2, ranks: 2,
            name: 'Meteoric Descent', icon: 'Ability_HeroicLeap',
            description: 'Reduces the cooldown of Crushing Descent by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -7500, [CRUSHING_DESCENT])],
        },
        {
            kind: 'passive', id: 'terminal-velocity', row: 8, column: 0, ranks: 3,
            name: 'Terminal Velocity', icon: 'Spell_Shadow_FingerOfDeath',
            description: 'Increases the critical strike chance of Annihilate by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 5, [ANNIHILATE])],
        },
        {
            kind: 'passive', id: 'hawking-radiation', row: 8, column: 2, ranks: 2,
            name: 'Hawking Radiation', icon: 'Spell_Shadow_DarkSummoning',
            description: 'Your killing blows on enemies that yield experience or honor have a $h% chance to restore'
                + ` $/10;${HAWKING_RADIATION.ID}s1 rage and grant you a Void Shard.`,
            effects: [triggerSpell(HAWKING_RADIATION.ID)],
            configure: onKillingBlow(50),
        },
        {
            kind: 'passive', id: 'collapsar', row: 9, column: 1, ranks: 3,
            name: 'Collapsar', icon: 'Spell_Shadow_DeathsEmbrace',
            description: 'Increases the damage of Singularity, Implosion and Stellar Collapse by $s1%.',
            // Stellar Collapse deals its damage over time, which the damage modifier does not cover.
            effects: [
                abilityPercent('DAMAGE', 4, [SINGULARITY, IMPLOSION, STELLAR_COLLAPSE]),
                abilityPercent('DOT', 4, [STELLAR_COLLAPSE]),
            ],
        },
        { kind: 'active', id: 'stellar-collapse', row: 10, column: 1, ability: STELLAR_COLLAPSE },
    ],
});
