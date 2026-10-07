import {
    abilityFlat, abilityPercent, attackPowerPercent, createProcBuffTalentRanks, createTalentTree,
    damageDone, maxHealthPercent, meleeCrit, meleeHaste, onMeleeHit, statPercent, triggerSpell,
} from "classkit";
import {
    EARTHSHATTER, HAMMER_BLOW, HAMMERSTORM, MOUNTAIN_BREAKER, STORM_BOLT, SWEEPING_HAMMER, THUNDER_CHARGE,
} from "../abilities/MountainKingAbilities";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";
import { BASH_STUN } from "./ProcEffects";

const BASH_COOLDOWN_MS = 6000;

export const HAMMER_TREE = createTalentTree(MK, {
    id: 'hammer',
    name: 'Hammer',
    tabIndex: 1,
    background: 'WarriorArms',
    icon: 'INV_Hammer_09',
    talents: [
        {
            kind: 'passive', id: 'heavy-hands', row: 0, column: 0, ranks: 5,
            name: 'Heavy Hands', icon: 'INV_Hammer_24',
            description: 'Increases the damage of Hammer Blow by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [HAMMER_BLOW])],
        },
        {
            kind: 'passive', id: 'forged-might', row: 0, column: 1, ranks: 5,
            name: 'Forged Might', icon: 'Spell_Holy_FistOfJustice',
            description: 'Increases your Strength by $s1%.',
            effects: [statPercent('STRENGTH', 2)],
        },
        {
            kind: 'passive', id: 'iron-momentum', row: 1, column: 0, ranks: 2,
            name: 'Iron Momentum', icon: 'Ability_Warrior_Charge',
            description: 'Reduces the cooldown of Thunder Charge by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2000, [THUNDER_CHARGE])],
        },
        {
            kind: 'passive', id: 'weapon-discipline', row: 1, column: 2, ranks: 5,
            name: 'Weapon Discipline', icon: 'Ability_Warrior_DecisiveStrike',
            description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
            effects: [meleeCrit(1)],
        },
        {
            kind: 'passive', id: 'wide-swings', row: 2, column: 0, ranks: 2,
            name: 'Wide Swings', icon: 'Ability_Warrior_Cleave',
            description: 'Increases the damage of Sweeping Hammer by $s1%.',
            effects: [abilityPercent('DAMAGE', 15, [SWEEPING_HAMMER])],
        },
        {
            kind: 'passive', id: 'bash', row: 2, column: 1, ranks: 3,
            name: 'Bash', icon: 'INV_Mace_01',
            description: `Your melee attacks have a $h% chance to bash the target, stunning it for $${BASH_STUN.ID}d.`
                + `  This effect cannot occur more often than once every ${BASH_COOLDOWN_MS / 1000} sec.`,
            effects: [triggerSpell(BASH_STUN.ID)],
            configure: onMeleeHit(3, BASH_COOLDOWN_MS),
        },
        {
            kind: 'passive', id: 'brute-force', row: 2, column: 2, ranks: 3,
            name: 'Brute Force', icon: 'Ability_SearingArrow',
            description: 'Increases the critical strike damage bonus of Hammer Blow, Sweeping Hammer'
                + ' and Mountain Breaker by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [HAMMER_BLOW, SWEEPING_HAMMER, MOUNTAIN_BREAKER])],
        },
        {
            kind: 'passive', id: 'concussive-force', row: 3, column: 0, ranks: 2,
            name: 'Concussive Force', icon: 'INV_Gauntlets_05',
            description: 'Increases the duration of the Storm Bolt and Earthshatter stuns by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 500, [STORM_BOLT, EARTHSHATTER])],
        },
        {
            kind: 'passive', id: 'two-handed-mastery', row: 3, column: 2, ranks: 3,
            name: 'Two-Handed Mastery', icon: 'INV_Hammer_05',
            description: 'Increases all physical damage you deal by $s1%.',
            effects: [damageDone(['PHYSICAL'], 2)],
        },
        {
            kind: 'custom', id: 'rhythm-of-the-forge', row: 4, column: 1, ranks: 5,
            createRanks: () => createProcBuffTalentRanks(MK, {
                id: 'rhythm-of-the-forge',
                name: 'Rhythm of the Forge',
                icon: 'INV_Hammer_Unique_Sulfuras',
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
            kind: 'passive', id: 'unstoppable-swing', row: 5, column: 0, ranks: 2,
            name: 'Unstoppable Swing', icon: 'INV_Hammer_03',
            description: 'Your Sweeping Hammer strikes up to $s1 additional targets.',
            effects: [abilityFlat('JUMP_TARGETS', 1, [SWEEPING_HAMMER])],
        },
        {
            kind: 'passive', id: 'dwarven-constitution', row: 5, column: 2, ranks: 3,
            name: 'Dwarven Constitution', icon: 'Spell_Nature_StoneClawTotem',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        { kind: 'active', id: 'mountain-breaker', row: 6, column: 1, ability: MOUNTAIN_BREAKER },
        {
            kind: 'passive', id: 'improved-mountain-breaker', row: 7, column: 1, ranks: 2,
            requires: 'mountain-breaker',
            name: 'Improved Mountain Breaker', icon: 'Ability_Smash',
            description: 'Reduces the cooldown of Mountain Breaker by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -500, [MOUNTAIN_BREAKER])],
        },
        {
            kind: 'passive', id: 'battle-hardened', row: 7, column: 2, ranks: 3,
            name: 'Battle Hardened', icon: 'INV_Hammer_11',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'weighted-hammers', row: 8, column: 0, ranks: 3,
            name: 'Weighted Hammers', icon: 'INV_Hammer_13',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'endurance-of-stone', row: 8, column: 2, ranks: 2,
            name: 'Endurance of Stone', icon: 'INV_Stone_10',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 3)],
        },
        {
            kind: 'passive', id: 'hammer-mastery', row: 9, column: 1, ranks: 3,
            name: 'Hammer Mastery', icon: 'INV_Hammer_16',
            description: 'Increases the critical strike chance of Hammer Blow and Mountain Breaker by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 3, [HAMMER_BLOW, MOUNTAIN_BREAKER])],
        },
        { kind: 'active', id: 'hammerstorm', row: 10, column: 1, ability: HAMMERSTORM },
    ],
});
