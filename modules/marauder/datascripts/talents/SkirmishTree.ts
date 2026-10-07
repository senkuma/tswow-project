import {
    abilityFlat, abilityPercent, createTalentTree, dodge, meleeHaste, meleeHit, movementSpeed, onAbilityHit,
    statPercent, triggerSpell,
} from "classkit";
import {
    AXE_STORM, AXE_STORM_HIT, AXE_VOLLEY, CHAIN_HOOK, HURL_AXE, REAVERS_LEAP, RICOCHET_AXE, SCRAPPERS_INSTINCT,
} from "../abilities/MarauderAbilities";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";
import { CRIPPLING_THROW } from "./ProcEffects";

const THROWN_AXES = [HURL_AXE, RICOCHET_AXE, AXE_VOLLEY, AXE_STORM_HIT];

/** Mobile skirmisher: thrown axes, hooks and leaps. */
export const SKIRMISH_TREE = createTalentTree(MR, {
    id: 'skirmish',
    name: 'Skirmish',
    tabIndex: 2,
    background: 'HunterSurvival',
    icon: 'INV_ThrowingAxe_03',
    talents: [
        {
            kind: 'passive', id: 'throwing-specialization', row: 0, column: 0, ranks: 5,
            name: 'Throwing Specialization', icon: 'Ability_Rogue_ThrowingSpecialization',
            description: 'Increases the damage of Hurl Axe by $s1%.',
            effects: [abilityPercent('DAMAGE', 4, [HURL_AXE])],
        },
        {
            kind: 'passive', id: 'wasteland-stride', row: 0, column: 1, ranks: 3,
            name: 'Wasteland Stride', icon: 'Ability_Rogue_FleetFooted',
            description: 'Increases your movement speed by $s1%.',
            effects: [movementSpeed(2)],
        },
        {
            kind: 'passive', id: 'survivalist', row: 0, column: 2, ranks: 3,
            name: 'Survivalist', icon: 'Spell_Nature_StoneClawTotem',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'long-chain', row: 1, column: 0, ranks: 2,
            name: 'Long Chain', icon: 'Spell_Frost_ChainsOfIce',
            description: 'Reduces the cooldown of Chain Hook by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2500, [CHAIN_HOOK])],
        },
        {
            kind: 'passive', id: 'precision', row: 1, column: 1, ranks: 5,
            name: 'Precision', icon: 'Ability_Marksmanship',
            description: 'Increases your chance to hit with melee weapons and thrown axes by $s1%.',
            effects: [meleeHit(1)],
        },
        {
            kind: 'passive', id: 'hit-and-run', row: 2, column: 0, ranks: 2,
            name: 'Hit and Run', icon: 'Ability_Warrior_Charge',
            description: 'Reduces the cooldown of Reaver\'s Leap by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -3000, [REAVERS_LEAP])],
        },
        { kind: 'active', id: 'ricochet-axe', row: 2, column: 1, ability: RICOCHET_AXE },
        {
            kind: 'passive', id: 'barbed-hook', row: 2, column: 2, ranks: 3,
            name: 'Barbed Hook', icon: 'Thrown_1H_Harpoon_D_01',
            description: 'Increases the damage of Chain Hook by $s1%.',
            effects: [abilityPercent('DAMAGE', 15, [CHAIN_HOOK])],
        },
        {
            kind: 'passive', id: 'rapid-hatchets', row: 3, column: 0, ranks: 2,
            name: 'Rapid Hatchets', icon: 'INV_Axe_23',
            description: 'Reduces the cooldown of Hurl Axe by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [HURL_AXE])],
        },
        {
            kind: 'passive', id: 'footwork', row: 3, column: 2, ranks: 3,
            name: 'Footwork', icon: 'Ability_Rogue_QuickRecovery',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'skirmisher', row: 4, column: 0, ranks: 3,
            name: 'Skirmisher', icon: 'Ability_HeroicLeap',
            description: 'Increases the damage of Reaver\'s Leap by $s1%.',
            effects: [abilityPercent('DAMAGE', 15, [REAVERS_LEAP])],
        },
        {
            kind: 'passive', id: 'axe-juggler', row: 4, column: 1, ranks: 5,
            name: 'Axe Juggler', icon: 'INV_Axe_94',
            description: 'Increases the critical strike damage bonus of your thrown axes by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 6, THROWN_AXES)],
        },
        {
            kind: 'passive', id: 'crippling-throws', row: 5, column: 0, ranks: 3,
            name: 'Crippling Throws', icon: 'INV_Axe_95',
            description: 'Your Hurl Axe and Ricochet Axe have a $h% chance to cripple the target,'
                + ` reducing its movement speed by $${CRIPPLING_THROW.ID}s1% for $${CRIPPLING_THROW.ID}d.`,
            effects: [triggerSpell(CRIPPLING_THROW.ID)],
            configure: onAbilityHit(MR, 33, [HURL_AXE, RICOCHET_AXE]),
        },
        {
            kind: 'passive', id: 'lightfooted', row: 5, column: 2, ranks: 2,
            name: 'Lightfooted', icon: 'Ability_Warrior_Riposte',
            description: 'Reduces the cooldown of Scrapper\'s Instinct by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [SCRAPPERS_INSTINCT])],
        },
        { kind: 'active', id: 'axe-volley', row: 6, column: 1, ability: AXE_VOLLEY },
        {
            kind: 'passive', id: 'improved-axe-volley', row: 6, column: 2, ranks: 2,
            requires: 'axe-volley',
            name: 'Improved Axe Volley', icon: 'INV_Axe_89',
            description: 'Reduces the cooldown of Axe Volley by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2000, [AXE_VOLLEY])],
        },
        {
            kind: 'passive', id: 'agile-killer', row: 7, column: 0, ranks: 3,
            name: 'Agile Killer', icon: 'Ability_Rogue_Ambush',
            description: 'Increases your Agility by $s1%.',
            effects: [statPercent('AGILITY', 2)],
        },
        {
            kind: 'passive', id: 'wind-and-steel', row: 7, column: 2, ranks: 3,
            name: 'Wind and Steel', icon: 'Ability_Rogue_BladeTwisting',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'axe-mastery', row: 8, column: 1, ranks: 5,
            name: 'Axe Mastery', icon: 'INV_Axe_66',
            description: 'Increases the damage of your thrown axes by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, THROWN_AXES)],
        },
        {
            kind: 'passive', id: 'storm-of-steel', row: 9, column: 1, ranks: 2,
            name: 'Storm of Steel', icon: 'INV_Axe_61',
            description: 'Reduces the energy cost of Ricochet Axe and Axe Volley by $S1.',
            effects: [abilityFlat('COST', -5, [RICOCHET_AXE, AXE_VOLLEY])],
        },
        { kind: 'active', id: 'axe-storm', row: 10, column: 1, ability: AXE_STORM },
    ],
});
