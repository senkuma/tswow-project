import {
    createClassItem, createClassItemSet, createFamilySpell, createPassiveSpell, ItemPowerScaling, onAbilityHit,
    RADIUS, scaleItemPower, scalesWithAttackPower, triggerSpell, withAttackPower,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { std } from "wow/wotlk";
import { FAMILY_BIT } from "./abilities/FamilyBits";
import { RANSACK, SAVAGE_STRIKE } from "./abilities/MarauderAbilities";
import { SPOILS_OF_WAR } from "./abilities/SpoilsOfWar";
import { MODULE_NAME } from "./Constants";
import { MARAUDER_CONTEXT as MR } from "./MarauderClass";

/** Tag the `.maraudergear` livescript command reads to find every piece. */
export const GEAR_TAG = 'marauder-gear';

/**
 * Custom endgame tier: the best WotLK agility leather (item level 277, Icecrown
 * heroic) scaled by the server's endgame power factor. Armor stays at its
 * item level 277 values: its mitigation formula cannot be rescaled like the
 * rating tables the endgame module adjusts.
 */
const DREADCORSAIR_SCALING: ItemPowerScaling = {
    stats: ENDGAME_POWER_FACTOR,
    weaponDamage: ENDGAME_POWER_FACTOR,
    armor: 1,
    blockValue: 1,
};
const ITEM_LEVEL = 300;

/** Parents supply slot, stats, armor and weapon damage. */
const STAT_PARENTS = {
    helm: 51252,        // Sanctified Shadowblade Helmet
    shoulders: 51254,   // Sanctified Shadowblade Pauldrons
    chest: 51250,       // Sanctified Shadowblade Breastplate
    hands: 51251,       // Sanctified Shadowblade Gauntlets
    legs: 51253,        // Sanctified Shadowblade Legplates
    waist: 50707,       // Astrylian's Sutured Cinch
    wrists: 50670,      // Toskk's Maximized Wristguards
    feet: 50607,        // Frostbitten Fur Boots
    mainHand: 50737,    // Havoc's Call, Blade of Lordaeron Kings (item level 284, slow one-hand axe)
    offHand: 50654,     // Scourgeborne Waraxe (fast one-hand axe)
    thrown: 50474,      // Shrapnel Star (item level 264, the best thrown weapon)
};

type Slot = keyof typeof STAT_PARENTS;

/** Looks: VanCleef's Battlegear, the Defias pirate king's tier, and a Vrykul throwing axe. */
const DISPLAYS: Partial<Record<Slot, number>> = {
    helm: 62160,        // VanCleef's Helmet
    shoulders: 61933,   // VanCleef's Pauldrons
    chest: 61930,       // VanCleef's Breastplate
    hands: 61903,       // VanCleef's Gauntlets
    legs: 61927,        // VanCleef's Legplates
    thrown: 51924,      // Hardened Vrykul Throwing Axe
};


function dreadcorsairItem(slot: Slot, name: string, description?: string) {
    const item = createClassItem(MR, {
        id: `dreadcorsair-${slot}`,
        parent: STAT_PARENTS[slot],
        display: DISPLAYS[slot],
        name,
        description,
    }).ItemLevel.set(ITEM_LEVEL);
    return scaleItemPower(item, DREADCORSAIR_SCALING);
}

const TIER_PIECES = [
    dreadcorsairItem('helm', 'Dreadcorsair Skullmask'),
    dreadcorsairItem('shoulders', 'Dreadcorsair Spaulders'),
    dreadcorsairItem('chest', 'Dreadcorsair Jerkin'),
    dreadcorsairItem('hands', 'Dreadcorsair Grips'),
    dreadcorsairItem('legs', 'Dreadcorsair Breeches'),
];

const OTHER_PIECES = [
    dreadcorsairItem('waist', 'Plunderer\'s Sash'),
    dreadcorsairItem('wrists', 'Shackles of the Broken Chain'),
    dreadcorsairItem('feet', 'Boots of the Endless Raid'),
    dreadcorsairItem('mainHand', 'Gorefang, Cleaver of the Wastes', 'It has never been cleaned.  It never will be.'),
    dreadcorsairItem('offHand', 'Ransomtaker', 'Every notch is a debt repaid.'),
    dreadcorsairItem('thrown', 'Widowmaker Hatchets'),
];

// ---------------------------------------------------------------- set bonuses

const CANNON_ASSAULT_NPC = 44939;     // cannonball fired at the target
const AP_BROADSIDE = 0.6;

/** 4-piece: a cannonball from nowhere, exploding around the target. */
const BROADSIDE = createFamilySpell(MR, {
    id: 'broadside',
    parent: CANNON_ASSAULT_NPC,
    familyBit: FAMILY_BIT.BROADSIDE,
    name: 'Broadside',
    icon: 'INV_Misc_MissileLarge_Red',
    school: 'FIRE',
    configure: spell => {
        scalesWithAttackPower(spell, AP_BROADSIDE);
        spell.Effects.get(0)
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8)
            .PointsBase.set(1500);
    },
});

export const DREADCORSAIR_SET = createClassItemSet(MR, {
    id: 'dreadcorsair',
    name: 'Dreadcorsair Battlegear',
    items: TIER_PIECES,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(MR, 'dreadcorsair-2-piece', {
                name: 'Dreadcorsair Battlegear 2-Piece Bonus',
                description: 'Your Savage Strike has a $h% chance to grant an additional stack of Spoils of War.',
                icon: 'INV_Misc_Coin_02',
                effects: [triggerSpell(SPOILS_OF_WAR.ID)],
                configure: onAbilityHit(MR, 30, [SAVAGE_STRIKE]),
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(MR, 'dreadcorsair-4-piece', {
                name: 'Dreadcorsair Battlegear 4-Piece Bonus',
                description: 'Your Ransack has a $h% chance to call down a broadside on the target, dealing '
                    + withAttackPower(`$${BROADSIDE.ID}s1`, AP_BROADSIDE)
                    + ' Fire damage to it and every enemy within 8 yards.',
                icon: 'INV_Misc_MissileLarge_Red',
                effects: [triggerSpell(BROADSIDE.ID)],
                configure: onAbilityHit(MR, 35, [RANSACK]),
            }),
        },
    ],
});

[...TIER_PIECES, ...OTHER_PIECES].forEach(item => std.Tags.add(MODULE_NAME, GEAR_TAG, item.ID));
