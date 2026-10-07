import {
    abilityFlat, abilityPercent, attackPowerPercent, createTalentTree, damageDone, damageTaken,
    meleeCrit, meleeHaste, meleeHit, onMeleeHit, statPercent, stunDuration, triggerSpell,
} from "classkit";
import {
    MOUNTAINS_WRATH, STORM_BOLT, THUNDER_CLAP_MK, THUNDERSTORM_MK, THUNDERSTRIKE, THUNDERSTRIKE_HIT,
} from "../abilities/MountainKingAbilities";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";
import { CHARGED_STRIKE, CHARGED_STRIKE_DAMAGE_TEXT } from "./ProcEffects";

const THUNDER_ABILITIES = [
    THUNDER_CLAP_MK, STORM_BOLT, MOUNTAINS_WRATH, THUNDERSTRIKE_HIT, THUNDERSTORM_MK, CHARGED_STRIKE,
];

export const THUNDER_TREE = createTalentTree(MK, {
    id: 'thunder',
    name: 'Thunder',
    tabIndex: 0,
    background: 'ShamanElementalCombat',
    icon: 'Spell_Nature_ThunderClap',
    talents: [
        {
            kind: 'passive', id: 'storm-caller', row: 0, column: 1, ranks: 5,
            name: 'Storm Caller', icon: 'Spell_Nature_CallStorm',
            description: 'Increases all Nature damage you deal by $s1%.',
            effects: [damageDone(['NATURE'], 1)],
        },
        {
            kind: 'passive', id: 'galvanized-hammers', row: 0, column: 2, ranks: 5,
            name: 'Galvanized Hammers', icon: 'Spell_Nature_LightningShield',
            description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
            effects: [meleeCrit(1)],
        },
        {
            kind: 'passive', id: 'improved-storm-bolt', row: 1, column: 0, ranks: 2,
            name: 'Improved Storm Bolt', icon: 'INV_Hammer_01',
            description: 'Reduces the cooldown of Storm Bolt by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2500, [STORM_BOLT])],
        },
        {
            kind: 'passive', id: 'rolling-thunder', row: 1, column: 1, ranks: 3,
            name: 'Rolling Thunder', icon: 'Spell_Nature_ThunderClap',
            description: 'Increases the damage of Thunder Clap by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [THUNDER_CLAP_MK])],
        },
        {
            kind: 'passive', id: 'charged-strikes', row: 1, column: 2, ranks: 5,
            name: 'Charged Strikes', icon: 'Spell_Shaman_StaticShock',
            description: 'Your melee attacks have a $h% chance to strike the target with lightning,'
                + ' dealing ' + CHARGED_STRIKE_DAMAGE_TEXT + ' Nature damage.',
            effects: [triggerSpell(CHARGED_STRIKE.ID)],
            configure: onMeleeHit(2),
        },
        {
            kind: 'passive', id: 'grounded', row: 2, column: 0, ranks: 3,
            name: 'Grounded', icon: 'Spell_Nature_LightningOverload',
            description: 'Reduces all Nature damage taken by $S1%.',
            effects: [damageTaken(['NATURE'], -4)],
        },
        {
            kind: 'passive', id: 'storms-reach', row: 2, column: 1, ranks: 2,
            name: 'Storm\'s Reach', icon: 'Spell_Nature_StormReach',
            description: 'Increases the range of Storm Bolt and Mountain\'s Wrath by $s1 yards.',
            effects: [abilityFlat('RANGE', 5, [STORM_BOLT, MOUNTAINS_WRATH])],
        },
        {
            kind: 'passive', id: 'electrified-grip', row: 2, column: 2, ranks: 3,
            name: 'Electrified Grip', icon: 'Spell_Nature_Lightning',
            description: 'Reduces the rage cost of Thunder Clap and Storm Bolt by $/10;S1.',
            // Rage costs are stored in tenths of a point.
            effects: [abilityFlat('COST', -20, [THUNDER_CLAP_MK, STORM_BOLT])],
        },
        {
            kind: 'passive', id: 'eye-of-the-storm', row: 3, column: 1, ranks: 5,
            name: 'Eye of the Storm', icon: 'Spell_Nature_EyeOfTheStorm',
            description: 'Increases the critical strike damage bonus of your Thunder abilities by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 6, THUNDER_ABILITIES)],
        },
        {
            kind: 'passive', id: 'lightning-reflexes', row: 3, column: 2, ranks: 3,
            name: 'Lightning Reflexes', icon: 'Spell_Nature_UnrelentingStorm',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'overcharge', row: 4, column: 0, ranks: 3,
            name: 'Overcharge', icon: 'Ability_ThunderClap',
            description: 'Increases the damage of Mountain\'s Wrath by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [MOUNTAINS_WRATH])],
        },
        {
            kind: 'passive', id: 'thundering-presence', row: 4, column: 1, ranks: 2,
            name: 'Thundering Presence', icon: 'Spell_Nature_ChainLightning',
            description: 'Increases the radius of Thunder Clap by $s1 yards.',
            effects: [abilityFlat('RADIUS', 2, [THUNDER_CLAP_MK])],
        },
        {
            kind: 'passive', id: 'strength-of-the-storm', row: 5, column: 1, ranks: 3,
            name: 'Strength of the Storm', icon: 'Spell_Shaman_StormEarthFire',
            description: 'Increases your Strength by $s1%.',
            effects: [statPercent('STRENGTH', 2)],
        },
        {
            kind: 'passive', id: 'static-discharge', row: 5, column: 2, ranks: 2,
            name: 'Static Discharge', icon: 'Spell_Nature_WispSplode',
            description: 'Increases the damage of Charged Strikes by $s1%.',
            effects: [abilityPercent('DAMAGE', 25, [CHARGED_STRIKE])],
        },
        { kind: 'active', id: 'thunderstrike', row: 6, column: 1, ability: THUNDERSTRIKE },
        {
            kind: 'passive', id: 'improved-thunderstrike', row: 7, column: 1, ranks: 3,
            requires: 'thunderstrike',
            name: 'Improved Thunderstrike', icon: 'Spell_Shaman_ImprovedStormstrike',
            description: 'Reduces the cooldown of Thunderstrike by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [THUNDERSTRIKE])],
        },
        {
            kind: 'passive', id: 'tempest', row: 7, column: 2, ranks: 3,
            name: 'Tempest', icon: 'Spell_Nature_Cyclone',
            description: 'Increases your chance to hit with melee attacks by $s1%.',
            effects: [meleeHit(1)],
        },
        {
            kind: 'passive', id: 'galvanic-might', row: 8, column: 0, ranks: 3,
            name: 'Galvanic Might', icon: 'Spell_Nature_LightningBolt',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'storm-ward', row: 8, column: 2, ranks: 2,
            name: 'Storm Ward', icon: 'Spell_Nature_GroundingTotem',
            description: 'Reduces the duration of stun effects used against you by $S1%.',
            effects: [stunDuration(-15)],
        },
        {
            kind: 'passive', id: 'thunderlord', row: 9, column: 1, ranks: 3,
            name: 'Thunderlord', icon: 'Ability_GolemThunderClap',
            description: 'Increases the critical strike chance of Thunder Clap and Thunderstrike by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 3, [THUNDER_CLAP_MK, THUNDERSTRIKE_HIT])],
        },
        { kind: 'active', id: 'thunderstorm', row: 10, column: 1, ability: THUNDERSTORM_MK },
    ],
});
