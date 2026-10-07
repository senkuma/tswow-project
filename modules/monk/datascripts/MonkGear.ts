import {
    createClassItem, createClassItemSet, createFamilySpell, createPassiveSpell, ItemPowerScaling, onAbilityHit,
    scaleItemPower, scalesWithAttackPower, triggerSpell, withAttackPower,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { std } from "wow/wotlk";
import { FAMILY_BIT } from "./abilities/FamilyBits";
import { BLACKOUT_KICK, JAB, RISING_SUN_KICK, TIGER_PALM } from "./abilities/MonkAbilities";
import { MODULE_NAME } from "./Constants";
import { MONK_CONTEXT as MK } from "./MonkClass";

/** Tag the `.monkgear` livescript command reads to find every piece. */
export const GEAR_TAG = 'monk-gear';

/**
 * Custom endgame tier: the best WotLK agility leather (item level 277, Icecrown
 * heroic) scaled by the server's endgame power factor. Agility serves every
 * monk specialization, heals included, through attack power. Armor stays at
 * its item level 277 values: its mitigation formula cannot be rescaled like
 * the rating tables the endgame module adjusts.
 */
const JADE_SERPENT_SCALING: ItemPowerScaling = {
    stats: ENDGAME_POWER_FACTOR,
    weaponDamage: ENDGAME_POWER_FACTOR,
    armor: 1,
    blockValue: 1,
};
const ITEM_LEVEL = 300;

/** Parents supply slot, stats, armor and weapon damage (all item level 277). */
const STAT_PARENTS = {
    helm: 51252,        // Sanctified Shadowblade Helmet
    shoulders: 51254,   // Sanctified Shadowblade Pauldrons
    chest: 51250,       // Sanctified Shadowblade Breastplate
    hands: 51251,       // Sanctified Shadowblade Gauntlets
    legs: 51253,        // Sanctified Shadowblade Legplates
    waist: 50707,       // Astrylian's Sutured Cinch
    wrists: 50670,      // Toskk's Maximized Wristguards
    feet: 50607,        // Frostbitten Fur Boots
    mainHand: 50692,    // Black Bruise (main-hand fist weapon)
    offHand: 50710,     // Keleseth's Seducer (off-hand fist weapon)
};

type Slot = keyof typeof STAT_PARENTS;

/** Looks: Lasherweave, the leaf-and-wood druid tier of Icecrown, for a jade-green monk. */
const DISPLAYS: Partial<Record<Slot, number>> = {
    helm: 64503,        // Sanctified Lasherweave Headguard
    shoulders: 64444,   // Sanctified Lasherweave Shoulderpads
    chest: 64507,       // Sanctified Lasherweave Raiment
    hands: 64504,       // Sanctified Lasherweave Handgrips
    legs: 64502,        // Sanctified Lasherweave Legguards
};

function jadeSerpentItem(slot: Slot, name: string, description?: string) {
    const item = createClassItem(MK, {
        id: `jade-serpent-${slot}`,
        parent: STAT_PARENTS[slot],
        display: DISPLAYS[slot],
        name,
        description,
    }).ItemLevel.set(ITEM_LEVEL);
    return scaleItemPower(item, JADE_SERPENT_SCALING);
}

const TIER_PIECES = [
    jadeSerpentItem('helm', 'Cowl of the Jade Serpent'),
    jadeSerpentItem('shoulders', 'Mantle of the Jade Serpent'),
    jadeSerpentItem('chest', 'Vestment of the Jade Serpent'),
    jadeSerpentItem('hands', 'Handwraps of the Jade Serpent'),
    jadeSerpentItem('legs', 'Legwraps of the Jade Serpent'),
];

const OTHER_PIECES = [
    jadeSerpentItem('waist', 'Sash of Inner Calm'),
    jadeSerpentItem('wrists', 'Wraps of the Open Palm'),
    jadeSerpentItem('feet', 'Treads of the Wandering Isle'),
    jadeSerpentItem('mainHand', 'Fist of Xuen', 'The White Tiger strikes first.'),
    jadeSerpentItem('offHand', 'Palm of Chi-Ji', 'The Red Crane strikes true.'),
];

// ---------------------------------------------------------------- set bonuses

const SEAL_FATE_EFFECT = 14189;       // adds a combo point to the target
const CHAIN_LIGHTNING = 421;
const AP_JADE_LIGHTNING = 0.6;

/** 2-piece: one more Chi from Jab. */
const CHI_SURGE = createFamilySpell(MK, {
    id: 'chi-surge',
    parent: SEAL_FATE_EFFECT,
    familyBit: FAMILY_BIT.CHI_SURGE,
    name: 'Chi Surge',
    icon: 'ability_Monk_ChiBrew',
    school: 'PHYSICAL',
});

/** 4-piece: lightning that leaps between enemies. */
const JADE_LIGHTNING = createFamilySpell(MK, {
    id: 'jade-lightning',
    parent: CHAIN_LIGHTNING,
    familyBit: FAMILY_BIT.JADE_LIGHTNING,
    name: 'Jade Lightning',
    icon: 'Ability_Monk_CracklingJadeLightning',
    school: 'NATURE',
    configure: spell => {
        scalesWithAttackPower(spell, AP_JADE_LIGHTNING);
        spell.Effects.get(0).PointsBase.set(800);
        spell.Effects.get(0).ChainTarget.set(3);
    },
});

export const JADE_SERPENT_SET = createClassItemSet(MK, {
    id: 'jade-serpent',
    name: 'Battlegear of the Jade Serpent',
    items: TIER_PIECES,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(MK, 'jade-serpent-2-piece', {
                name: 'Battlegear of the Jade Serpent 2-Piece Bonus',
                description: 'Your Jab has a $h% chance to generate an additional Chi.',
                icon: 'ability_Monk_ChiBrew',
                effects: [triggerSpell(CHI_SURGE.ID)],
                configure: onAbilityHit(MK, 25, [JAB]),
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(MK, 'jade-serpent-4-piece', {
                name: 'Battlegear of the Jade Serpent 4-Piece Bonus',
                description: 'Your Tiger Palm, Blackout Kick and Rising Sun Kick have a $h% chance to unleash'
                    + ' Jade Lightning, dealing '
                    + withAttackPower(`$${JADE_LIGHTNING.ID}s1`, AP_JADE_LIGHTNING)
                    + ' Nature damage to the target and up to 2 nearby enemies.',
                icon: 'Ability_Monk_CracklingJadeLightning',
                effects: [triggerSpell(JADE_LIGHTNING.ID)],
                configure: onAbilityHit(MK, 30, [TIGER_PALM, BLACKOUT_KICK, RISING_SUN_KICK]),
            }),
        },
    ],
});

[...TIER_PIECES, ...OTHER_PIECES].forEach(item => std.Tags.add(MODULE_NAME, GEAR_TAG, item.ID));
