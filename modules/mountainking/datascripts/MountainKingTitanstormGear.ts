import {
    createClassItem, createClassItemSet, createFamilySpell, createPassiveSpell, ItemPowerScaling, onAbilityHit,
    onMeleeHit, scaleItemPower, scalesWithAttackPower, triggerSpell, withAttackPower,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { std } from "wow/wotlk";
import { HAMMER_BLOW } from "./abilities/MountainKingAbilities";
import { MODULE_NAME } from "./Constants";
import { MOUNTAIN_KING_CONTEXT as MK } from "./MountainKingClass";
import { CHARGED_STRIKE } from "./talents/ProcEffects";

/** Tag the `.mountainkinggear titanstorm` livescript command reads to find every piece. */
export const TITANSTORM_GEAR_TAG = 'mountain-king-titanstorm-gear';

/**
 * Custom endgame tier: the best WotLK strength plate (item level 277, Icecrown
 * heroic) scaled by the server's endgame power factor. Armor stays at its
 * item level 277 values: its mitigation formula cannot be rescaled like the
 * rating tables the endgame module adjusts.
 */
const TITANSTORM_SCALING: ItemPowerScaling = {
    stats: ENDGAME_POWER_FACTOR,
    weaponDamage: ENDGAME_POWER_FACTOR,
    armor: 1,
    blockValue: ENDGAME_POWER_FACTOR,
};
const ITEM_LEVEL = 300;

/** Parents supply slot, stats, armor and weapon damage (all item level 277). */
const STAT_PARENTS = {
    helm: 51227,        // Sanctified Ymirjar Lord's Helmet
    shoulders: 51229,   // Sanctified Ymirjar Lord's Shoulderplates
    chest: 51225,       // Sanctified Ymirjar Lord's Battleplate
    hands: 51226,       // Sanctified Ymirjar Lord's Gauntlets
    legs: 51228,        // Sanctified Ymirjar Lord's Legplates
    waist: 50620,       // Coldwraith Links
    wrists: 50611,      // Bracers of Dark Reckoning
    feet: 50639,        // Blood-Soaked Saronite Stompers
    twoHand: 50603,     // Cryptmaker
    oneHand: 50708,     // Last Word
    shield: 50729,      // Icecrown Glacial Wall
};

/** Looks: Ulduar's storm-blue Aegis plate, with lightning-themed weapons. */
const DISPLAYS = {
    helm: 59603,        // Conqueror's Aegis Helm
    shoulders: 59608,   // Conqueror's Aegis Shoulderplates
    chest: 59602,       // Conqueror's Aegis Battleplate
    hands: 59427,       // Conqueror's Aegis Gauntlets
    legs: 59606,        // Conqueror's Aegis Legplates
    waist: 64661,       // Surrogate Belt (blue energy band)
    wrists: 62003,      // Titanium Spikeguards
    feet: 61372,        // Dawnbreaker Greaves
    twoHand: 39584,     // Stormherald
    oneHand: 64313,     // Mithrios, Bronzebeard's Legacy
    shield: 53532,      // Titansteel Shield Wall
};

type Slot = keyof typeof STAT_PARENTS;

function titanstormItem(slot: Slot, name: string, description?: string) {
    const item = createClassItem(MK, {
        id: `titanstorm-${slot}`,
        parent: STAT_PARENTS[slot],
        display: DISPLAYS[slot],
        name,
        description,
    }).ItemLevel.set(ITEM_LEVEL);
    return scaleItemPower(item, TITANSTORM_SCALING);
}

const TIER_PIECES = [
    titanstormItem('helm', 'Titanstorm Greathelm'),
    titanstormItem('shoulders', 'Titanstorm Pauldrons'),
    titanstormItem('chest', 'Titanstorm Breastplate'),
    titanstormItem('hands', 'Titanstorm Gauntlets'),
    titanstormItem('legs', 'Titanstorm Legplates'),
];

const OTHER_PIECES = [
    titanstormItem('waist', 'Girdle of the Gathering Storm'),
    titanstormItem('wrists', 'Thunderforged Vambraces'),
    titanstormItem('feet', 'Stormstride Sabatons'),
    titanstormItem('twoHand', 'Thunderfall, Maul of the Mountain King', 'The sky answers when it is raised.'),
    titanstormItem('oneHand', 'Mithrios Reforged', 'Bronzebeard\'s legacy, made whole again.'),
    titanstormItem('shield', 'Aegis of Khaz Modan', 'No storm has ever broken it.'),
];

// ---------------------------------------------------------------- set bonuses

const STORMBOLT_NPC = 19136;
const AVATAR_NPC = 19135;
const VISUAL_THROWN_HAMMER = 5779;
const VISUAL_LIGHTNING_ORBS = 37;      // Lightning Shield's orbiting lightning
const DURATION_15_SEC = 8;
const AVATAR_INTERNAL_COOLDOWN_MS = 45000;
const AP_SPECTRAL_STORMHAMMER = 0.5;

/** 2-piece: a free, stun-less Storm Bolt thrown by Hammer Blow. */
const SPECTRAL_STORMHAMMER = createFamilySpell(MK, {
    id: 'spectral-stormhammer',
    parent: STORMBOLT_NPC,
    familyBit: 23,
    name: 'Spectral Stormhammer',
    icon: 'INV_Hammer_01',
    school: 'NATURE',
    visual: { id: VISUAL_THROWN_HAMMER, missileSpeed: 20 },
    configure: spell => {
        spell.Effects.get(1).clear();
        spell.Effects.get(0).PointsBase.set(500);
        scalesWithAttackPower(spell, AP_SPECTRAL_STORMHAMMER);
    },
});

/** 4-piece: a short storm form, built on the Warcraft III Avatar spell. */
const AVATAR_OF_THE_STORM = createFamilySpell(MK, {
    id: 'avatar-of-the-storm',
    parent: AVATAR_NPC,
    familyBit: 24,
    name: 'Avatar of the Storm',
    icon: 'Spell_Nature_LightningShield',
    school: 'NATURE',
    visual: { id: VISUAL_LIGHTNING_ORBS },
    configure: spell => {
        spell.Duration.set(DURATION_15_SEC)
            .AuraDescription.enGB.set('Size and attack speed increased.  Melee attacks call down lightning.');
        spell.Effects.get(0).Aura.MOD_MELEE_HASTE.set().PercentBase.set(25);
        spell.Effects.get(1).Aura.PROC_TRIGGER_SPELL.set().TriggeredSpell.set(CHARGED_STRIKE.ID);
        spell.Effects.get(2).Aura.MOD_SCALE.set().PercentBase.set(20);
        // Half of the avatar's melee hits call down a Charged Strike.
        onMeleeHit(50)(spell, 1);
    },
});

export const TITANSTORM_SET = createClassItemSet(MK, {
    id: 'titanstorm',
    name: 'Titanstorm Battlegear',
    items: TIER_PIECES,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(MK, 'titanstorm-2-piece', {
                name: 'Titanstorm Battlegear 2-Piece Bonus',
                description: 'Your Hammer Blow has a $h% chance to hurl a spectral stormhammer at your target,'
                    + ' dealing ' + withAttackPower(`$${SPECTRAL_STORMHAMMER.ID}s1`, AP_SPECTRAL_STORMHAMMER)
                    + ' Nature damage.',
                icon: 'INV_Hammer_01',
                effects: [triggerSpell(SPECTRAL_STORMHAMMER.ID)],
                configure: onAbilityHit(MK, 25, [HAMMER_BLOW]),
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(MK, 'titanstorm-4-piece', {
                name: 'Titanstorm Battlegear 4-Piece Bonus',
                description: `Your melee critical strikes have a $h% chance to make you an Avatar of the Storm`
                    + ` for $${AVATAR_OF_THE_STORM.ID}d, growing in size, increasing your attack speed by`
                    + ` $${AVATAR_OF_THE_STORM.ID}s1% and calling lightning down on your foes.`
                    + `  This effect cannot occur more often than once every ${AVATAR_INTERNAL_COOLDOWN_MS / 1000} sec.`,
                icon: 'Spell_Nature_LightningShield',
                effects: [triggerSpell(AVATAR_OF_THE_STORM.ID)],
                configure: onMeleeHit(15, AVATAR_INTERNAL_COOLDOWN_MS, 'CRITICAL'),
            }),
        },
    ],
});

[...TIER_PIECES, ...OTHER_PIECES].forEach(item => std.Tags.add(MODULE_NAME, TITANSTORM_GEAR_TAG, item.ID));
