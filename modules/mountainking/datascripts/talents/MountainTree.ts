import {
    abilityFlat, abilityPercent, ALL_SCHOOLS, armorFromItems, attackerMeleeCrit, block, createTalentTree,
    damageTaken, dodge, MAGIC_SCHOOLS, maxHealthPercent, parry, statPercent, threat,
} from "classkit";
import {
    AVALANCHE, AVATAR, CHALLENGE, EARTHSHATTER, GRANITE_SKIN, STONE_SHIELD, THUNDER_CLAP_MK, THUNDEROUS_ROAR,
} from "../abilities/MountainKingAbilities";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";

export const MOUNTAIN_TREE = createTalentTree(MK, {
    id: 'mountain',
    name: 'Mountain',
    tabIndex: 2,
    background: 'WarriorProtection',
    icon: 'Spell_Nature_StoneSkinTotem',
    talents: [
        {
            kind: 'passive', id: 'stone-skin', row: 0, column: 1, ranks: 5,
            name: 'Stone Skin', icon: 'INV_Stone_15',
            description: 'Increases your armor value from items by $s1%.',
            effects: [armorFromItems(2)],
        },
        {
            kind: 'passive', id: 'stubborn', row: 0, column: 2, ranks: 5,
            name: 'Stubborn', icon: 'INV_Stone_04',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'mountains-endurance', row: 1, column: 0, ranks: 5,
            name: 'Mountain\'s Endurance', icon: 'INV_Elemental_Primal_Earth',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'improved-challenge', row: 1, column: 1, ranks: 2,
            name: 'Improved Challenge', icon: 'Spell_Nature_Reincarnation',
            description: 'Reduces the cooldown of Challenge by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [CHALLENGE])],
        },
        {
            kind: 'passive', id: 'shield-mastery', row: 1, column: 2, ranks: 3,
            name: 'Shield Mastery', icon: 'Ability_Warrior_ShieldMastery',
            description: 'Increases your chance to block by $s1%.',
            effects: [block(2)],
        },
        {
            kind: 'passive', id: 'unbreakable', row: 2, column: 0, ranks: 5,
            name: 'Unbreakable', icon: 'Ability_Parry',
            description: 'Increases your chance to parry by $s1%.',
            effects: [parry(1)],
        },
        {
            kind: 'passive', id: 'bedrock', row: 2, column: 1, ranks: 3,
            name: 'Bedrock', icon: 'Spell_Nature_EarthBindTotem',
            description: 'Increases all threat you generate by $s1%.',
            effects: [threat(15)],
        },
        {
            kind: 'passive', id: 'improved-stone-shield', row: 3, column: 0, ranks: 2,
            name: 'Improved Stone Shield', icon: 'INV_Shield_05',
            description: 'Reduces the cooldown of Stone Shield by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -10000, [STONE_SHIELD])],
        },
        {
            kind: 'passive', id: 'stoneblood', row: 3, column: 2, ranks: 3,
            name: 'Stoneblood', icon: 'Spell_Nature_SkinofEarth',
            description: 'Reduces all damage taken by $S1%.',
            effects: [damageTaken(ALL_SCHOOLS, -1)],
        },
        {
            kind: 'passive', id: 'rooted', row: 4, column: 1, ranks: 5,
            name: 'Rooted', icon: 'Spell_Nature_EarthBind',
            description: 'Reduces the chance you\'ll be critically hit by melee attacks by $S1%.',
            effects: [attackerMeleeCrit(-1)],
        },
        {
            kind: 'passive', id: 'earthen-roar', row: 5, column: 0, ranks: 2,
            name: 'Earthen Roar', icon: 'Ability_Warrior_WarCry',
            description: 'Increases the attack power reduction of Thunderous Roar by $s1%.',
            effects: [abilityPercent('EFFECT1', 20, [THUNDEROUS_ROAR])],
        },
        {
            kind: 'passive', id: 'earthen-ward', row: 5, column: 2, ranks: 3,
            name: 'Earthen Ward', icon: 'Spell_Nature_EarthElemental_Totem',
            description: 'Reduces all spell damage taken by $S1%.',
            effects: [damageTaken(MAGIC_SCHOOLS, -2)],
        },
        { kind: 'active', id: 'avalanche', row: 6, column: 1, ability: AVALANCHE },
        {
            kind: 'passive', id: 'improved-avalanche', row: 7, column: 1, ranks: 2,
            requires: 'avalanche',
            name: 'Improved Avalanche', icon: 'Ability_Warrior_Shockwave',
            description: 'Reduces the cooldown of Avalanche by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2000, [AVALANCHE])],
        },
        {
            kind: 'passive', id: 'granite-fortitude', row: 7, column: 2, ranks: 3,
            name: 'Granite Fortitude', icon: 'Spell_Nature_StoneSkinTotem',
            description: 'Reduces the cooldown of Granite Skin by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [GRANITE_SKIN])],
        },
        {
            kind: 'passive', id: 'mountainous-presence', row: 8, column: 0, ranks: 3,
            name: 'Mountainous Presence', icon: 'Spell_Nature_TremorTotem',
            description: 'Increases the threat generated by Thunder Clap, Avalanche and Earthshatter by $s1%.',
            effects: [abilityPercent('THREAT', 25, [THUNDER_CLAP_MK, AVALANCHE, EARTHSHATTER])],
        },
        {
            kind: 'passive', id: 'heart-of-the-mountain', row: 8, column: 2, ranks: 3,
            name: 'Heart of the Mountain', icon: 'INV_Crystallized_Earth',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        {
            kind: 'passive', id: 'unyielding-stone', row: 9, column: 1, ranks: 3,
            name: 'Unyielding Stone', icon: 'INV_Stone_11',
            description: 'Increases your armor value from items by an additional $s1%.',
            effects: [armorFromItems(3)],
        },
        { kind: 'active', id: 'avatar', row: 10, column: 1, ability: AVATAR },
    ],
});
