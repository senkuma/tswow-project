import { abilityFlat, abilityPercent, createClassItem, createClassItemSet, createPassiveSpell } from "classkit";
import { std } from "wow/wotlk";
import {
    HAMMER_BLOW, MOUNTAIN_BREAKER, STORM_BOLT, THUNDER_CLAP_MK,
} from "./abilities/MountainKingAbilities";
import { MODULE_NAME } from "./Constants";
import { MOUNTAIN_KING_CONTEXT as MK } from "./MountainKingClass";

/** Tag the `.mountainkinggear` livescript command reads to find every piece. */
export const GEAR_TAG = 'mountain-king-gear';

// Level 80 parents, mostly from Ulduar. Each keeps its model, armor and
// stats; strength plate for damage, plus tank pieces for a shield setup.
const PARENTS = {
    helm: 46151,        // Conqueror's Siegebreaker Helmet
    shoulders: 46149,   // Conqueror's Siegebreaker Shoulderplates
    chest: 46146,       // Conqueror's Siegebreaker Battleplate
    hands: 46148,       // Conqueror's Siegebreaker Gauntlets
    legs: 46150,        // Conqueror's Siegebreaker Legplates
    waist: 45550,       // Belt of the Titans
    wrists: 45111,      // Mimiron's Inferno Couplings
    feet: 45542,        // Greaves of the Stonewarder
    twoHand: 45521,     // Earthshaper
    oneHand: 45892,     // Legacy of Thunder
    shield: 45450,      // Northern Barrier
};

const TIER_PIECES = [
    createClassItem(MK, { id: 'gear-helm', parent: PARENTS.helm, name: 'Greathelm of the Mountain King' }),
    createClassItem(MK, { id: 'gear-shoulders', parent: PARENTS.shoulders, name: 'Pauldrons of the Mountain King' }),
    createClassItem(MK, { id: 'gear-chest', parent: PARENTS.chest, name: 'Breastplate of the Mountain King' }),
    createClassItem(MK, { id: 'gear-hands', parent: PARENTS.hands, name: 'Gauntlets of the Mountain King' }),
    createClassItem(MK, { id: 'gear-legs', parent: PARENTS.legs, name: 'Legplates of the Mountain King' }),
];

const OTHER_PIECES = [
    createClassItem(MK, {
        id: 'gear-waist', parent: PARENTS.waist, name: 'Titanforged Girdle',
        description: 'Forged in Ulduar for a guardian who never returned.',
    }),
    createClassItem(MK, { id: 'gear-wrists', parent: PARENTS.wrists, name: 'Ironforge Vambraces' }),
    createClassItem(MK, { id: 'gear-feet', parent: PARENTS.feet, name: 'Sabatons of the Deep Mountain' }),
    createClassItem(MK, {
        id: 'gear-two-hand', parent: PARENTS.twoHand, name: 'Stormhammer, Fury of the Mountain King',
        description: 'Thunder follows wherever it falls.',
    }),
    createClassItem(MK, { id: 'gear-one-hand', parent: PARENTS.oneHand, name: 'Hammer of the Thunder Clan' }),
    createClassItem(MK, {
        id: 'gear-shield', parent: PARENTS.shield, name: 'Bulwark of Ironforge',
        description: 'The gates of Ironforge have never fallen.',
    }),
];

export const MOUNTAIN_KING_SET = createClassItemSet(MK, {
    id: 'battlegear',
    name: 'Battlegear of the Mountain King',
    items: TIER_PIECES,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(MK, 'battlegear-2-piece', {
                name: 'Battlegear of the Mountain King 2-Piece Bonus',
                description: 'Reduces the cooldown of Storm Bolt by $/1000;S1 sec.',
                icon: 'INV_Hammer_01',
                effects: [abilityFlat('COOLDOWN', -5000, [STORM_BOLT])],
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(MK, 'battlegear-4-piece', {
                name: 'Battlegear of the Mountain King 4-Piece Bonus',
                description: 'Increases the damage done by Hammer Blow, Thunder Clap and Mountain Breaker by $s1%.',
                icon: 'Spell_Nature_ThunderClap',
                effects: [abilityPercent('DAMAGE', 10, [HAMMER_BLOW, THUNDER_CLAP_MK, MOUNTAIN_BREAKER])],
            }),
        },
    ],
});

[...TIER_PIECES, ...OTHER_PIECES].forEach(item => std.Tags.add(MODULE_NAME, GEAR_TAG, item.ID));
