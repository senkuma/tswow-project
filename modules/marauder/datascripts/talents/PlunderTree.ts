import {
    abilityFlat, abilityPercent, attackPowerPercent, createTalentTree, dodge, movementSpeed, onAbilityHit,
    onKillingBlow, triggerSpell,
} from "classkit";
import {
    BEHEAD, CHAIN_HOOK, GORGE, HURL_AXE, KINGS_RANSOM, PLUNDER, POMMEL_STRIKE, RANSACK, SEIZE_THE_SPOILS, SHAKEDOWN,
} from "../abilities/MarauderAbilities";
import { SPOILS_OF_WAR } from "../abilities/SpoilsOfWar";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";
import { DOUBLE_DEALING, SPOILS_OF_VICTORY } from "./ProcEffects";

/** Spoils of War specialist: bigger hauls, bigger Ransacks and dirty tricks. */
export const PLUNDER_TREE = createTalentTree(MR, {
    id: 'plunder',
    name: 'Plunder',
    tabIndex: 1,
    background: 'RogueCombat',
    icon: 'INV_Misc_Coin_02',
    talents: [
        {
            kind: 'passive', id: 'greed', row: 0, column: 0, ranks: 5,
            name: 'Greed', icon: 'INV_Misc_Coin_10',
            description: 'Increases the damage of Ransack by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [RANSACK])],
        },
        {
            kind: 'passive', id: 'sleight-of-hand', row: 0, column: 1, ranks: 5,
            name: 'Sleight of Hand', icon: 'Ability_Rogue_Feint',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'light-fingers', row: 0, column: 2, ranks: 2,
            name: 'Light Fingers', icon: 'INV_Misc_Bag_10_Black',
            description: 'Reduces the cooldown of Plunder by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2500, [PLUNDER])],
        },
        {
            kind: 'passive', id: 'hoarder', row: 1, column: 0, ranks: 3,
            name: 'Hoarder', icon: 'INV_Misc_Bag_17',
            description: 'Increases the duration of Spoils of War by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 5000, [SPOILS_OF_WAR])],
        },
        {
            kind: 'passive', id: 'ruthlessness', row: 1, column: 1, ranks: 5,
            name: 'Ruthlessness', icon: 'Ability_Rogue_SliceDice',
            description: 'Increases the critical strike chance of Ransack and Behead by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 2, [RANSACK, BEHEAD])],
        },
        {
            kind: 'passive', id: 'swift-getaway', row: 2, column: 0, ranks: 2,
            name: 'Swift Getaway', icon: 'Ability_Rogue_Sprint',
            description: 'Increases your movement speed by $s1%.',
            effects: [movementSpeed(4)],
        },
        { kind: 'active', id: 'seize-the-spoils', row: 2, column: 1, ability: SEIZE_THE_SPOILS },
        {
            kind: 'passive', id: 'cheap-tricks', row: 2, column: 2, ranks: 3,
            name: 'Cheap Tricks', icon: 'Ability_Rogue_Distract',
            description: 'Reduces the energy cost of Pommel Strike, Chain Hook and Plunder by $S1.',
            effects: [abilityFlat('COST', -3, [POMMEL_STRIKE, CHAIN_HOOK, PLUNDER])],
        },
        {
            kind: 'passive', id: 'war-profiteer', row: 3, column: 0, ranks: 3,
            name: 'War Profiteer', icon: 'INV_Misc_Coin_06',
            description: 'Increases the physical damage bonus of each stack of Spoils of War by $s1%.',
            effects: [abilityPercent('EFFECT1', 50, [SPOILS_OF_WAR])],
        },
        {
            kind: 'passive', id: 'double-dealing', row: 3, column: 2, ranks: 3,
            name: 'Double Dealing', icon: 'INV_Misc_Coin_18',
            description: `Your Ransack has a $h% chance to restore $${DOUBLE_DEALING.ID}s1 energy.`,
            effects: [triggerSpell(DOUBLE_DEALING.ID)],
            configure: onAbilityHit(MR, 10, [RANSACK]),
        },
        {
            kind: 'passive', id: 'dirty-fighting', row: 4, column: 0, ranks: 3,
            name: 'Dirty Fighting', icon: 'Ability_Rogue_UnfairAdvantage',
            description: 'Increases the damage of Hurl Axe and Chain Hook by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [HURL_AXE, CHAIN_HOOK])],
        },
        {
            kind: 'passive', id: 'cutthroat', row: 4, column: 1, ranks: 5,
            name: 'Cutthroat', icon: 'Ability_Rogue_SlaughterfromtheShadows',
            description: 'Increases the critical strike damage bonus of Ransack and Behead by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 6, [RANSACK, BEHEAD])],
        },
        {
            kind: 'passive', id: 'iron-stomach', row: 5, column: 0, ranks: 2,
            name: 'Iron Stomach', icon: 'INV_Misc_Food_88_RavagerNuggets',
            description: 'Increases the healing of Gorge by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 15, [GORGE])],
        },
        {
            kind: 'passive', id: 'cold-calculation', row: 5, column: 2, ranks: 2,
            name: 'Cold Calculation', icon: 'Ability_Rogue_FocusedAttacks',
            description: 'Reduces the energy cost of Ransack by $S1.',
            effects: [abilityFlat('COST', -5, [RANSACK])],
        },
        { kind: 'active', id: 'shakedown', row: 6, column: 1, ability: SHAKEDOWN },
        {
            kind: 'passive', id: 'improved-shakedown', row: 6, column: 2, ranks: 2,
            requires: 'shakedown',
            name: 'Improved Shakedown', icon: 'Ability_Rogue_KidneyShot',
            description: 'Increases the duration of Shakedown by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 500, [SHAKEDOWN])],
        },
        {
            kind: 'passive', id: 'fortunes-edge', row: 7, column: 0, ranks: 3,
            name: 'Fortune\'s Edge', icon: 'INV_Misc_Coin_08',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'pillager', row: 7, column: 2, ranks: 3,
            name: 'Pillager', icon: 'INV_Misc_Bone_OrcSkull_01',
            description: 'Increases the damage of Behead by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [BEHEAD])],
        },
        {
            kind: 'passive', id: 'spoils-of-victory', row: 8, column: 1, ranks: 2,
            name: 'Spoils of Victory', icon: 'INV_Misc_Bone_HumanSkull_01',
            description: 'Your killing blows on enemies that yield experience or honor have a $h% chance'
                + ' to grant 2 stacks of Spoils of War.',
            effects: [triggerSpell(SPOILS_OF_VICTORY.ID)],
            configure: onKillingBlow(50),
        },
        {
            kind: 'passive', id: 'plunder-mastery', row: 9, column: 1, ranks: 3,
            name: 'Plunder Mastery', icon: 'INV_Misc_Coin_19',
            description: 'Increases the bonus damage Ransack gains from each stack of Spoils of War by $s1%.',
            effects: [abilityPercent('EFFECT2', 20, [SPOILS_OF_WAR])],
        },
        { kind: 'active', id: 'kings-ransom', row: 10, column: 1, ability: KINGS_RANSOM },
    ],
});
