import {
    abilityFlat, abilityPercent, ALL_SCHOOLS, armorFromItems, attackPowerPercent, block, createHeroTree,
    damageDone, damageTaken, dodge, maxHealthPercent, meleeCrit, meleeHaste, meleeHit, movementSpeed,
    onAbilityHit, onMeleeHitTaken, statPercent, triggerSpell,
} from "classkit";
import {
    AVALANCHE, EARTHSHATTER, GRANITE_SKIN, HAMMER_BLOW, MOUNTAIN_BREAKER, MOUNTAINS_WRATH, STORM_BOLT,
    STRENGTH_OF_THE_MOUNTAIN, THUNDER_CHARGE, THUNDER_CLAP_MK, THUNDERSTORM_MK, THUNDERSTRIKE_HIT,
} from "../abilities/MountainKingAbilities";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";
import {
    CHAIN_THUNDER, CHAIN_THUNDER_DAMAGE, LIVING_STONE, STORM_SURGE, STORMCALLER_BOLT, STORMCALLER_BOLT_DAMAGE,
    THANES_RESOLVE_HEAL, THANES_RESOLVE_HEALING, WILDHAMMER_THROW, WILDHAMMER_THROW_DAMAGE,
} from "./HeroEffects";

const THUNDER_ABILITIES = [THUNDER_CLAP_MK, STORM_BOLT, MOUNTAINS_WRATH, THUNDERSTRIKE_HIT, THUNDERSTORM_MK, STORMCALLER_BOLT];

const STORM_SURGE_COOLDOWN_MS = 20000;
const LIVING_STONE_COOLDOWN_MS = 30000;
const CHAIN_THUNDER_COOLDOWN_MS = 10000;

/** Thunder and Hammer: lightning woven into every swing. */
export const STORMCALLER = createHeroTree(MK, {
    id: 'stormcaller',
    keystone: {
        id: 'thunderous-wrath', name: 'Thunderous Wrath', icon: 'INV_Ability_MountainThaneWarrior_ThorimsMight',
        description: 'Your Hammer Blow, Thunder Clap and Storm Bolt have a $h% chance to call down a'
            + ' Stormcaller\'s Bolt on the target, dealing ' + STORMCALLER_BOLT_DAMAGE + ' Nature damage.',
        effects: [triggerSpell(STORMCALLER_BOLT.ID)],
        configure: onAbilityHit(MK, 20, [HAMMER_BLOW, THUNDER_CLAP_MK, STORM_BOLT]),
    },
    rows: [
        [
            {
                id: 'static-buildup', name: 'Static Buildup', icon: 'Spell_Nature_LightningShield',
                description: 'Increases all Nature damage you deal by $s1%.',
                effects: [damageDone(['NATURE'], 4)],
            },
            {
                id: 'crackling-steel', name: 'Crackling Steel', icon: 'INV_Hammer_09',
                description: 'Increases the damage of Hammer Blow by $s1%.',
                effects: [abilityPercent('DAMAGE', 10, [HAMMER_BLOW])],
            },
        ],
        [
            {
                id: 'chain-of-thunder', name: 'Chain of Thunder', icon: 'Spell_Nature_ThunderClap',
                description: 'Increases the radius of Thunder Clap by $s1 yards.',
                effects: [abilityFlat('RADIUS', 3, [THUNDER_CLAP_MK])],
            },
            {
                id: 'storms-fury', name: 'Storm\'s Fury', icon: 'INV_Hammer_01',
                description: 'Reduces the cooldown of Storm Bolt by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -5000, [STORM_BOLT])],
            },
        ],
        [
            {
                id: 'galvanic-reflexes', name: 'Galvanic Reflexes', icon: 'Spell_Nature_UnrelentingStorm',
                description: 'Increases your melee attack speed by $s1%.',
                effects: [meleeHaste(5)],
            },
            {
                id: 'conduit', name: 'Conduit', icon: 'Spell_Nature_LightningOverload',
                description: 'Increases the damage of Stormcaller\'s Bolt by $s1%.',
                effects: [abilityPercent('DAMAGE', 30, [STORMCALLER_BOLT])],
            },
        ],
        [
            {
                id: 'unchained-lightning', name: 'Unchained Lightning', icon: 'Spell_Shaman_ThunderStorm',
                description: 'Reduces the cooldown of Thunderstorm by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -15000, [THUNDERSTORM_MK])],
            },
            {
                id: 'thunderlords-grip', name: 'Thunderlord\'s Grip', icon: 'Ability_GolemThunderClap',
                description: 'Reduces the rage cost of Thunder Clap by $/10;S1.',
                // Rage costs are stored in tenths of a point.
                effects: [abilityFlat('COST', -50, [THUNDER_CLAP_MK])],
            },
        ],
        [
            {
                id: 'tempest-blade', name: 'Tempest Blade', icon: 'Spell_Nature_Cyclone',
                description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
                effects: [meleeCrit(3)],
            },
            {
                id: 'eye-of-fury', name: 'Eye of Fury', icon: 'Spell_Nature_EyeOfTheStorm',
                description: 'Increases the critical strike damage bonus of your Thunder abilities by $s1%.',
                effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, THUNDER_ABILITIES)],
            },
        ],
        [
            {
                id: 'rolling-storm', name: 'Rolling Storm', icon: 'Spell_Nature_StormReach',
                description: 'Increases the range of Storm Bolt by $s1 yards.',
                effects: [abilityFlat('RANGE', 10, [STORM_BOLT])],
            },
            {
                id: 'lightning-rod', name: 'Lightning Rod', icon: 'Spell_Nature_GroundingTotem',
                description: 'Reduces all Nature damage taken by $S1%.',
                effects: [damageTaken(['NATURE'], -10)],
            },
        ],
    ],
    capstone: {
        id: 'storm-surge', name: 'Storm Surge', icon: 'Spell_Nature_UnrelentingStorm',
        description: `Critical strikes with your Thunder abilities fill you with Storm Surge for $${STORM_SURGE.ID}d,`
            + ` increasing your attack speed by $${STORM_SURGE.ID}s1% and your Nature damage by $${STORM_SURGE.ID}s2%.`
            + `  This effect cannot occur more often than once every ${STORM_SURGE_COOLDOWN_MS / 1000} sec.`,
        effects: [triggerSpell(STORM_SURGE.ID)],
        configure: onAbilityHit(MK, 100, THUNDER_ABILITIES, 'CRITICAL', STORM_SURGE_COOLDOWN_MS),
    },
});

/** Hammer and Mountain: the unbreakable lord of a dwarven hold. */
export const THANE_OF_IRONFORGE = createHeroTree(MK, {
    id: 'thane',
    keystone: {
        id: 'thanes-resolve', name: 'Thane\'s Resolve', icon: 'Spell_Holy_SealOfMight',
        description: 'Your Hammer Blow and Mountain Breaker restore ' + THANES_RESOLVE_HEALING + ' health.',
        effects: [triggerSpell(THANES_RESOLVE_HEAL.ID)],
        configure: onAbilityHit(MK, 100, [HAMMER_BLOW, MOUNTAIN_BREAKER]),
    },
    rows: [
        [
            {
                id: 'bedrock-armor', name: 'Bedrock Armor', icon: 'INV_Stone_15',
                description: 'Increases your armor value from items by $s1%.',
                effects: [armorFromItems(10)],
            },
            {
                id: 'iron-constitution', name: 'Iron Constitution', icon: 'INV_Elemental_Primal_Earth',
                description: 'Increases your maximum health by $s1%.',
                effects: [maxHealthPercent(5)],
            },
        ],
        [
            {
                id: 'unbreakable-bulwark', name: 'Unbreakable Bulwark', icon: 'Ability_Warrior_ShieldMastery',
                description: 'Increases your chance to block by $s1%.',
                effects: [block(8)],
            },
            {
                id: 'steadfast', name: 'Steadfast', icon: 'INV_Stone_04',
                description: 'Increases your chance to dodge by $s1%.',
                effects: [dodge(4)],
            },
        ],
        [
            {
                id: 'mountains-might', name: 'Mountain\'s Might', icon: 'Spell_Holy_FistOfJustice',
                description: 'Increases your Strength by $s1%.',
                effects: [statPercent('STRENGTH', 5)],
            },
            {
                id: 'thanes-command', name: 'Thane\'s Command', icon: 'Spell_Nature_StrengthOfEarthTotem02',
                description: 'Increases the attack power granted by Strength of the Mountain by $s1%.',
                // The shout's melee and ranged attack power auras.
                effects: [
                    abilityPercent('EFFECT1', 20, [STRENGTH_OF_THE_MOUNTAIN]),
                    abilityPercent('EFFECT2', 20, [STRENGTH_OF_THE_MOUNTAIN]),
                ],
            },
        ],
        [
            {
                id: 'granite-bastion', name: 'Granite Bastion', icon: 'Spell_Nature_StoneSkinTotem',
                description: 'Reduces the cooldown of Granite Skin by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -60000, [GRANITE_SKIN])],
            },
            {
                id: 'avalanche-mastery', name: 'Avalanche Mastery', icon: 'Ability_Warrior_Shockwave',
                description: 'Reduces the cooldown of Avalanche by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -5000, [AVALANCHE])],
            },
        ],
        [
            {
                id: 'heavy-strikes', name: 'Heavy Strikes', icon: 'Ability_Smash',
                description: 'Increases the critical strike chance of Mountain Breaker by $s1%.',
                effects: [abilityFlat('CRITICAL_CHANCE', 10, [MOUNTAIN_BREAKER])],
            },
            {
                id: 'stonehide', name: 'Stonehide', icon: 'Spell_Nature_SkinofEarth',
                description: 'Reduces all damage taken by $S1%.',
                effects: [damageTaken(ALL_SCHOOLS, -5)],
            },
        ],
        [
            {
                id: 'crushing-weight', name: 'Crushing Weight', icon: 'INV_Hammer_24',
                description: 'Increases the damage of Hammer Blow by $s1%.',
                effects: [abilityPercent('DAMAGE', 15, [HAMMER_BLOW])],
            },
            {
                id: 'earthen-embrace', name: 'Earthen Embrace', icon: 'Spell_Nature_EarthElemental_Totem',
                description: 'Increases the healing of Thane\'s Resolve by $s1%.',
                effects: [abilityPercent('DAMAGE', 50, [THANES_RESOLVE_HEAL])],
            },
        ],
    ],
    capstone: {
        id: 'heart-of-the-mountain', name: 'Heart of the Mountain', icon: 'Spell_Nature_StoneSkinTotem',
        description: `Melee attacks against you have a $h% chance to turn you to Living Stone for $${LIVING_STONE.ID}d,`
            + ` reducing all damage taken by $${LIVING_STONE.ID}S1% and increasing your armor by $${LIVING_STONE.ID}s2%.`
            + `  This effect cannot occur more often than once every ${LIVING_STONE_COOLDOWN_MS / 1000} sec.`,
        effects: [triggerSpell(LIVING_STONE.ID)],
        configure: onMeleeHitTaken(10, LIVING_STONE_COOLDOWN_MS),
    },
});

/** Thunder and Mountain: gryphon riders of the Aerie Peak, hurling stormhammers from above. */
export const WILDHAMMER = createHeroTree(MK, {
    id: 'wildhammer',
    keystone: {
        id: 'wildhammer-throw', name: 'Wildhammer Throw', icon: 'INV_Hammer_03',
        description: 'Your Storm Bolt hurls a second, spectral hammer at the target, dealing '
            + WILDHAMMER_THROW_DAMAGE + ' Nature damage.',
        effects: [triggerSpell(WILDHAMMER_THROW.ID)],
        configure: onAbilityHit(MK, 100, [STORM_BOLT]),
    },
    rows: [
        [
            {
                id: 'wind-rider', name: 'Wind Rider', icon: 'Ability_Mount_Gryphon_01',
                description: 'Increases your movement speed by $s1%.',
                effects: [movementSpeed(10)],
            },
            {
                id: 'aerie-training', name: 'Aerie Training', icon: 'Ability_Marksmanship',
                description: 'Increases your chance to hit with melee attacks by $s1%.',
                effects: [meleeHit(2)],
            },
        ],
        [
            {
                id: 'gryphons-dive', name: 'Gryphon\'s Dive', icon: 'Ability_Warrior_Charge',
                description: 'Reduces the cooldown of Thunder Charge by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -5000, [THUNDER_CHARGE])],
            },
            {
                id: 'tailwind', name: 'Tailwind', icon: 'Spell_Nature_Cyclone',
                description: 'Increases your melee attack speed by $s1%.',
                effects: [meleeHaste(4)],
            },
        ],
        [
            {
                id: 'hammer-juggler', name: 'Hammer Juggler', icon: 'INV_Hammer_01',
                description: 'Reduces the cooldown of Storm Bolt by $/1000;S1 sec.',
                effects: [abilityFlat('COOLDOWN', -5000, [STORM_BOLT])],
            },
            {
                id: 'featherlight-plate', name: 'Featherlight Plate', icon: 'Ability_Mount_GoldenGryphon',
                description: 'Increases your chance to dodge by $s1%.',
                effects: [dodge(3)],
            },
        ],
        [
            {
                id: 'storm-rider', name: 'Storm Rider', icon: 'Spell_Shaman_ThunderStorm',
                description: 'Increases the radius of Thunderstorm by $s1 yards.',
                effects: [abilityFlat('RADIUS', 5, [THUNDERSTORM_MK])],
            },
            {
                id: 'thundering-descent', name: 'Thundering Descent', icon: 'Spell_Nature_Earthquake',
                description: 'Increases the radius of Earthshatter by $s1 yards.',
                effects: [abilityFlat('RADIUS', 3, [EARTHSHATTER])],
            },
        ],
        [
            {
                id: 'wildhammer-fury', name: 'Wildhammer Fury', icon: 'INV_Hammer_03',
                description: 'Increases the damage of Wildhammer Throw by $s1%.',
                effects: [abilityPercent('DAMAGE', 30, [WILDHAMMER_THROW])],
            },
            {
                id: 'sky-lord', name: 'Sky Lord', icon: 'Ability_Mount_SnowyGryphon',
                description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
                effects: [meleeCrit(3)],
            },
        ],
        [
            {
                id: 'highland-endurance', name: 'Highland Endurance', icon: 'Spell_Holy_WordFortitude',
                description: 'Increases your Stamina by $s1%.',
                effects: [statPercent('STAMINA', 6)],
            },
            {
                id: 'clan-ferocity', name: 'Clan Ferocity', icon: 'Ability_Warrior_BattleShout',
                description: 'Increases your attack power by $s1%.',
                effects: [attackPowerPercent(5)],
            },
        ],
    ],
    capstone: {
        id: 'call-of-the-aerie', name: 'Call of the Aerie', icon: 'Spell_Nature_ChainLightning',
        description: 'Your Storm Bolt and Wildhammer Throw have a $h% chance to unleash Chain Thunder, dealing '
            + CHAIN_THUNDER_DAMAGE + ' Nature damage to the target and up to 3 nearby enemies.'
            + `  This effect cannot occur more often than once every ${CHAIN_THUNDER_COOLDOWN_MS / 1000} sec.`,
        effects: [triggerSpell(CHAIN_THUNDER.ID)],
        configure: onAbilityHit(MK, 50, [STORM_BOLT, WILDHAMMER_THROW], 'ANY', CHAIN_THUNDER_COOLDOWN_MS),
    },
});
