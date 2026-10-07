import {
    abilityFlat, abilityPercent, createProcBuffTalentRanks, createTalentTree, damageDone, meleeCrit, meleeHaste,
    movementSpeed, onAbilityHit, powerRegenPercent, statPercent, triggerSpell,
} from "classkit";
import {
    BLACKOUT_KICK, FISTS_OF_FURY, FLYING_SERPENT_KICK, JAB, RISING_SUN_KICK, SPINNING_CRANE_KICK, TIGER_PALM,
    TOUCH_OF_DEATH,
} from "../abilities/MonkAbilities";
import { MONK_CONTEXT as MK } from "../MonkClass";
import { COMBO_BREAKER } from "./ProcEffects";

// Rogue Dual Wield Specialization: off-hand damage, which works for any class as is.
const DUAL_WIELD_SPECIALIZATION_RANKS = [13715, 13848, 13849, 13851, 13852];

/** Damage: a whirlwind of fists and feet fuelled by Chi. */
export const WINDWALKER_TREE = createTalentTree(MK, {
    id: 'windwalker',
    name: 'Windwalker',
    tabIndex: 2,
    background: 'DruidFeralCombat',
    icon: 'Spell_Monk_WindWalker_Spec',
    talents: [
        {
            kind: 'passive', id: 'fists-of-iron', row: 0, column: 0, ranks: 5,
            name: 'Fists of Iron', icon: 'ability_monk_PalmStrike',
            description: 'Increases the damage of Jab by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [JAB])],
        },
        {
            kind: 'passive', id: 'tiger-strikes', row: 0, column: 1, ranks: 5,
            name: 'Tiger Strikes', icon: 'ability_monk_dpsstance',
            description: 'Increases your chance to get a critical strike with melee attacks by $s1%.',
            effects: [meleeCrit(1)],
        },
        { kind: 'cloned', id: 'dual-wield-specialization', row: 1, column: 0, parentRanks: DUAL_WIELD_SPECIALIZATION_RANKS },
        {
            kind: 'passive', id: 'celerity', row: 1, column: 2, ranks: 3,
            name: 'Celerity', icon: 'Ability_Monk_TigersLust',
            description: 'Increases your movement speed by $s1%.',
            effects: [movementSpeed(3)],
        },
        {
            kind: 'passive', id: 'tiger-power', row: 2, column: 0, ranks: 3,
            name: 'Tiger Power', icon: 'Ability_Monk_PrideOfTheTiger',
            description: 'Increases the damage bonus of Tiger Palm\'s Tiger Power by $s1%.',
            effects: [abilityPercent('EFFECT2', 20, [TIGER_PALM])],
        },
        { kind: 'active', id: 'rising-sun-kick', row: 2, column: 1, ability: RISING_SUN_KICK },
        {
            kind: 'passive', id: 'ferocity-of-xuen', row: 2, column: 2, ranks: 5,
            name: 'Ferocity of Xuen', icon: 'Ability_Monk_TigerStyle',
            description: 'Increases your Agility by $s1%.',
            effects: [statPercent('AGILITY', 2)],
        },
        {
            kind: 'passive', id: 'combo-breaker', row: 3, column: 0, ranks: 3,
            name: 'Combo Breaker', icon: 'ABILITY_MONK_CHISWIRL',
            description: 'Your Jab has a $h% chance to make your next Blackout Kick cost no Chi.',
            effects: [triggerSpell(COMBO_BREAKER.ID)],
            configure: onAbilityHit(MK, 4, [JAB]),
        },
        {
            kind: 'passive', id: 'blackout-mastery', row: 3, column: 2, ranks: 3,
            name: 'Blackout Mastery', icon: 'Ability_monk_BlackoutStrike',
            description: 'Increases the damage of Blackout Kick by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [BLACKOUT_KICK])],
        },
        {
            kind: 'passive', id: 'energizing-brew', row: 4, column: 0, ranks: 3,
            name: 'Energizing Brew', icon: 'Ability_Monk_EnergizingWine',
            description: 'Increases your energy regeneration by $s1%.',
            effects: [powerRegenPercent('ENERGY', 4)],
        },
        {
            kind: 'custom', id: 'flurry-of-blows', row: 4, column: 1, ranks: 5,
            createRanks: () => createProcBuffTalentRanks(MK, {
                id: 'flurry-of-blows',
                name: 'Flurry of Blows',
                icon: 'INV_Ability_ShadopanMonk_FlurryStrikes',
                // Warrior Flurry: talent ranks, the buff each triggers, and TDB's chain-wide proc rows.
                talentRanks: [12319, 12971, 12972, 12973, 12974],
                buffRanks: [12966, 12967, 12968, 12969, 12970],
                talentProcRow: -12319,
                buffProcRow: -12966,
                description: buffId => `Increases your attack speed by $${buffId}s1% for your next 3 swings`
                    + ' after dealing a melee critical strike.',
                buffDescription: 'Attack speed increased by $s1%.',
            }),
        },
        {
            kind: 'passive', id: 'rising-fury', row: 5, column: 0, ranks: 2,
            name: 'Rising Fury', icon: 'Ability_Monk_RisingSunKick',
            description: 'Reduces the cooldown of Rising Sun Kick by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [RISING_SUN_KICK])],
        },
        {
            kind: 'passive', id: 'crane-mastery', row: 5, column: 2, ranks: 3,
            name: 'Crane Mastery', icon: 'ability_monk_cranekick',
            description: 'Increases the damage of Spinning Crane Kick by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [SPINNING_CRANE_KICK])],
        },
        { kind: 'active', id: 'flying-serpent-kick', row: 6, column: 1, ability: FLYING_SERPENT_KICK },
        {
            kind: 'passive', id: 'serpents-swiftness', row: 6, column: 2, ranks: 2,
            requires: 'flying-serpent-kick',
            name: 'Serpent\'s Swiftness', icon: 'Ability_Monk_ZenFlight',
            description: 'Reduces the cooldown of Flying Serpent Kick by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -5000, [FLYING_SERPENT_KICK])],
        },
        {
            kind: 'passive', id: 'hit-combo', row: 7, column: 0, ranks: 3,
            name: 'Hit Combo', icon: 'Ability_Monk_PowerStrikes',
            description: 'Increases all physical damage you deal by $s1%.',
            effects: [damageDone(['PHYSICAL'], 1)],
        },
        {
            kind: 'passive', id: 'deaths-touch', row: 7, column: 2, ranks: 3,
            name: 'Death\'s Touch', icon: 'Ability_Monk_TouchofKarma',
            description: 'Reduces the cooldown of Touch of Death by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -15000, [TOUCH_OF_DEATH])],
        },
        {
            kind: 'passive', id: 'windwalking', row: 8, column: 1, ranks: 5,
            name: 'Windwalking', icon: 'Ability_Monk_RideTheWind',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(1)],
        },
        {
            kind: 'passive', id: 'storm-earth-and-fire', row: 9, column: 1, ranks: 3,
            name: 'Storm, Earth and Fire', icon: 'Spell_Shaman_StormEarthFire',
            description: 'Increases the critical strike damage bonus of Tiger Palm, Blackout Kick and'
                + ' Rising Sun Kick by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [TIGER_PALM, BLACKOUT_KICK, RISING_SUN_KICK])],
        },
        { kind: 'active', id: 'fists-of-fury', row: 10, column: 1, ability: FISTS_OF_FURY },
    ],
});
