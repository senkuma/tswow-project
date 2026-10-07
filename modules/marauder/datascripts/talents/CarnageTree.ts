import {
    abilityFlat, abilityPercent, armorFromItems, attackPowerPercent, createProcBuffTalentRanks, createTalentTree,
    damageDone, meleeCrit, meleeHaste, onAbilityHit, statPercent, triggerSpell,
} from "classkit";
import {
    BLOODBATH, DEEP_GASH, DEEP_GASH_DAMAGE_TEXT, RANSACK, RED_MIST, SAVAGE_STRIKE, SERRATED_GASH, TWIN_FANGS,
    TWIN_FANGS_STRIKES,
} from "../abilities/MarauderAbilities";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";

// Rogue Dual Wield Specialization: off-hand damage, which works for any class as is.
const DUAL_WIELD_SPECIALIZATION_RANKS = [13715, 13848, 13849, 13851, 13852];

/** Dual-wielding berserker: savage strikes, bleeds and frenzy. */
export const CARNAGE_TREE = createTalentTree(MR, {
    id: 'carnage',
    name: 'Carnage',
    tabIndex: 0,
    background: 'WarriorFury',
    icon: 'Ability_Warrior_Rampage',
    talents: [
        {
            kind: 'passive', id: 'serrated-edges', row: 0, column: 0, ranks: 5,
            name: 'Serrated Edges', icon: 'INV_Axe_17',
            description: 'Increases the damage of Savage Strike by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [SAVAGE_STRIKE])],
        },
        {
            kind: 'passive', id: 'feral-precision', row: 0, column: 1, ranks: 5,
            name: 'Feral Precision', icon: 'Ability_Rogue_BloodyEye',
            description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
            effects: [meleeCrit(1)],
        },
        { kind: 'cloned', id: 'dual-wield-specialization', row: 1, column: 0, parentRanks: DUAL_WIELD_SPECIALIZATION_RANKS },
        {
            kind: 'passive', id: 'lacerate', row: 1, column: 2, ranks: 3,
            name: 'Lacerate', icon: 'Ability_Druid_InfectedWound',
            description: 'Increases the bleed damage of Serrated Gash and Deep Gash by $s1%.',
            effects: [abilityPercent('DOT', 10, [SERRATED_GASH, DEEP_GASH])],
        },
        {
            kind: 'passive', id: 'blood-scent', row: 2, column: 0, ranks: 3,
            name: 'Blood Scent', icon: 'Ability_Druid_Mangle2',
            description: 'Reduces the energy cost of Savage Strike by $S1.',
            effects: [abilityFlat('COST', -2, [SAVAGE_STRIKE])],
        },
        { kind: 'active', id: 'twin-fangs', row: 2, column: 1, ability: TWIN_FANGS },
        {
            kind: 'passive', id: 'savage-vigor', row: 2, column: 2, ranks: 5,
            name: 'Savage Vigor', icon: 'Spell_Nature_BloodLust',
            description: 'Increases your Agility by $s1%.',
            effects: [statPercent('AGILITY', 2)],
        },
        {
            kind: 'passive', id: 'bloodletting', row: 3, column: 0, ranks: 3,
            name: 'Bloodletting', icon: 'Ability_Warrior_Trauma',
            description: 'Critical strikes with Savage Strike, Twin Fangs and Ransack have a $h% chance to inflict'
                + ` Deep Gash, bleeding the target for ${DEEP_GASH_DAMAGE_TEXT} damage over $${DEEP_GASH.ID}d.`,
            effects: [triggerSpell(DEEP_GASH.ID)],
            configure: (spell, rank) => {
                onAbilityHit(MR, 33, [SAVAGE_STRIKE, TWIN_FANGS_STRIKES, RANSACK], 'CRITICAL')(spell, rank);
                // Twin Fangs strikes are triggered by Twin Fangs.
                spell.Proc.AttributesMask.set('CAN_PROC_ON_TRIGGERED');
            },
        },
        {
            kind: 'passive', id: 'savage-momentum', row: 3, column: 2, ranks: 5,
            name: 'Savage Momentum', icon: 'Ability_Warrior_InnerRage',
            description: 'Increases all physical damage you deal by $s1%.',
            effects: [damageDone(['PHYSICAL'], 1)],
        },
        {
            kind: 'passive', id: 'thick-hide', row: 4, column: 0, ranks: 3,
            name: 'Thick Hide', icon: 'Ability_Warrior_DefensiveStance',
            description: 'Increases your armor value from items by $s1%.',
            effects: [armorFromItems(4)],
        },
        {
            kind: 'custom', id: 'battle-trance', row: 4, column: 1, ranks: 5,
            createRanks: () => createProcBuffTalentRanks(MR, {
                id: 'battle-trance',
                name: 'Battle Trance',
                icon: 'Ability_GhoulFrenzy',
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
            kind: 'passive', id: 'unbridled-fury', row: 5, column: 0, ranks: 3,
            name: 'Unbridled Fury', icon: 'Ability_Warrior_EndlessRage',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'feral-endurance', row: 5, column: 2, ranks: 3,
            name: 'Feral Endurance', icon: 'Ability_Warrior_StrengthOfArms',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        { kind: 'active', id: 'red-mist', row: 6, column: 1, ability: RED_MIST },
        {
            kind: 'passive', id: 'improved-red-mist', row: 6, column: 2, ranks: 2,
            requires: 'red-mist',
            name: 'Improved Red Mist', icon: 'Ability_Racial_BloodRage',
            description: 'Reduces the cooldown of Red Mist by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [RED_MIST])],
        },
        {
            kind: 'passive', id: 'gaping-wounds', row: 7, column: 0, ranks: 3,
            name: 'Gaping Wounds', icon: 'Ability_Rogue_Rupture',
            description: 'Increases the duration of Serrated Gash by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 3000, [SERRATED_GASH])],
        },
        {
            kind: 'passive', id: 'frenzied-assault', row: 7, column: 2, ranks: 3,
            name: 'Frenzied Assault', icon: 'Ability_Warrior_Bloodsurge',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'tear-asunder', row: 8, column: 1, ranks: 3,
            name: 'Tear Asunder', icon: 'Ability_Rogue_DualWeild',
            description: 'Increases the damage of Twin Fangs by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [TWIN_FANGS_STRIKES])],
        },
        {
            kind: 'passive', id: 'savage-mastery', row: 9, column: 1, ranks: 3,
            name: 'Savage Mastery', icon: 'Ability_Warrior_DecisiveStrike',
            description: 'Increases the critical strike damage bonus of Savage Strike, Twin Fangs and Ransack by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [SAVAGE_STRIKE, TWIN_FANGS_STRIKES, RANSACK])],
        },
        { kind: 'active', id: 'bloodbath', row: 10, column: 1, ability: BLOODBATH },
    ],
});
