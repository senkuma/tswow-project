import {
    abilityFlat, abilityPercent, createClassItem, createClassItemSet, createFamilySpell, createPassiveSpell,
    ItemPowerScaling, onAbilityHit, onMeleeHitTaken, RADIUS, RANGE, scaleItemPower, scalesWithAttackPower,
    triggerSpell, withAttackPower,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { std } from "wow/wotlk";
import { CRUSHING_WEIGHT, EVENT_HORIZON, UNRAVEL, VOID_BARRIER } from "./abilities/BulwarkAbilities";
import { FAMILY_BIT } from "./abilities/FamilyBits";
import { ANNIHILATE, COLLAPSE, VOID_STRIKE } from "./abilities/GravityAbilities";
import { VOID_SHARDS } from "./abilities/VoidShards";
import { MODULE_NAME } from "./Constants";
import { VOID_KNIGHT_CONTEXT as VK } from "./VoidKnightClass";

/** Tags the `.voidknightgear battlegear|bulwark` livescript command reads to find every piece. */
export const BATTLEGEAR_TAG = 'void-knight-battlegear';
export const BULWARK_TAG = 'void-knight-bulwark';

/**
 * Custom endgame tiers: the best WotLK strength plate, jewelry and two-handers
 * (item level 277, Icecrown heroic) scaled by the server's endgame power
 * factor, one set for damage and one for tanking. Armor stays at its item
 * level 277 values: its mitigation formula cannot be rescaled like the rating
 * tables the endgame module adjusts.
 */
const VOIDFORGED_SCALING: ItemPowerScaling = {
    stats: ENDGAME_POWER_FACTOR,
    weaponDamage: ENDGAME_POWER_FACTOR,
    armor: 1,
    blockValue: 1,
};
const ITEM_LEVEL = 300;

type Slot =
    | 'helm' | 'shoulders' | 'chest' | 'hands' | 'legs' | 'waist' | 'wrists' | 'feet'
    | 'neck' | 'back' | 'ring1' | 'ring2' | 'trinket1' | 'trinket2' | 'twoHand';

interface VoidforgedSet {
    id: string;
    /** Parents supply slot, stats, armor, weapon damage, sockets and item spells. */
    parents: Record<Slot, number>;
    displays: Partial<Record<Slot, number>>;
}

/**
 * Damage: the Scourgelord Battlegear's stats, worn in the violet Scourgeborne
 * plate of Naxxramas, with Yogg-Saron's whispering hammer. The trinkets keep
 * their own looks and attack power procs. Both item level 277 melee trinkets
 * are dummy auras that only TrinityCore scripts give an effect (Deathbringer's
 * Will picks its buffs by the wearer's class), so the 25-player heroic Ruby
 * Sanctum scale and the 10-player heroic Icecrown skull stand in.
 */
const BATTLEGEAR: VoidforgedSet = {
    id: 'battlegear',
    parents: {
        helm: 51312,        // Sanctified Scourgelord Helmet
        shoulders: 51314,   // Sanctified Scourgelord Shoulderplates
        chest: 51310,       // Sanctified Scourgelord Battleplate
        hands: 51311,       // Sanctified Scourgelord Gauntlets
        legs: 51313,        // Sanctified Scourgelord Legplates
        waist: 50620,       // Coldwraith Links
        wrists: 50659,      // Polar Bear Claw Bracers
        feet: 50639,        // Blood-Soaked Saronite Stompers
        neck: 50647,        // Ahn'kahar Onyx Neckguard
        back: 50677,        // Winding Sheet
        ring1: 50693,       // Might of Blight
        ring2: 50657,       // Skeleton Lord's Circle
        trinket1: 54590,    // Sharpened Twilight Scale (item level 284): attack power on damage
        trinket2: 50343,    // Whispering Fanged Skull (item level 264): attack power on damage
        twoHand: 50603,     // Cryptmaker
    },
    displays: {
        helm: 55485,        // Heroes' Scourgeborne Helmet
        shoulders: 55491,   // Heroes' Scourgeborne Shoulderplates
        chest: 55484,       // Heroes' Scourgeborne Battleplate
        hands: 55486,       // Heroes' Scourgeborne Gauntlets
        legs: 55489,        // Heroes' Scourgeborne Legplates
        waist: 61297,       // Girdle of the Nether Champion
        wrists: 64724,      // Brace Guards of the Starless Night
        feet: 59703,        // Sabatons of Lifeless Night
        neck: 34034,        // Choker of the Abyss
        back: 35430,        // Shadow of the Ghoul (violet Naxxramas cape)
        ring1: 35438,       // Band of the Crystalline Void
        ring2: 44357,       // Seal of the Twilight Queen
        twoHand: 58911,     // Hammer of Crushing Whispers
    },
};

/**
 * Tanking: the Scourgelord Plate's stats in Ulduar's Darkruned plate, with
 * Shadowmourne's look on Bryntroll, whose shadow Drain Life proc keeps
 * working on the copy. Both trinkets are item level 277 with native effects.
 */
const BULWARK: VoidforgedSet = {
    id: 'bulwark',
    parents: {
        helm: 51306,        // Sanctified Scourgelord Faceguard
        shoulders: 51309,   // Sanctified Scourgelord Pauldrons
        chest: 51305,       // Sanctified Scourgelord Chestguard
        hands: 51307,       // Sanctified Scourgelord Handguards
        legs: 51308,        // Sanctified Scourgelord Legguards
        waist: 50691,       // Belt of Broken Bones
        wrists: 50611,      // Bracers of Dark Reckoning
        feet: 50625,        // Grinning Skull Greatboots
        neck: 50682,        // Bile-Encrusted Medallion
        back: 50718,        // Royal Crimson Cloak
        ring1: 50622,       // Devium's Eternally Cold Ring
        ring2: 50642,       // Juggernaut Band
        trinket1: 50364,    // Sindragosa's Flawless Fang: on use, magic resistance
        trinket2: 50349,    // Corpse Tongue Coin: armor when struck
        twoHand: 50709,     // Bryntroll, the Bone Arbiter
    },
    displays: {
        helm: 59332,        // Conqueror's Darkruned Faceguard
        shoulders: 59336,   // Conqueror's Darkruned Pauldrons
        chest: 58246,       // Conqueror's Darkruned Chestguard
        hands: 59335,       // Conqueror's Darkruned Handguards
        legs: 60033,        // Conqueror's Darkruned Legguards
        waist: 62138,       // Belt of the Nether Champion
        wrists: 61541,      // Armplates of the Nether Lord
        feet: 61551,        // Greaves of the Lingering Vortex
        neck: 54999,        // Pendant of Shadow Beams
        back: 26202,        // Cloak of the Black Void
        ring1: 44358,       // Fused Nethergon Band
        ring2: 64225,       // Signet of Twilight
        twoHand: 65153,     // Shadowmourne
    },
};

function voidforgedItem(set: VoidforgedSet, slot: Slot, name: string, description?: string) {
    const item = createClassItem(VK, {
        id: `${set.id}-${slot}`,
        parent: set.parents[slot],
        display: set.displays[slot],
        name,
        description,
    }).ItemLevel.set(ITEM_LEVEL);
    return scaleItemPower(item, VOIDFORGED_SCALING);
}

const BATTLEGEAR_TIER = [
    voidforgedItem(BATTLEGEAR, 'helm', 'Voidforged Helmet'),
    voidforgedItem(BATTLEGEAR, 'shoulders', 'Voidforged Shoulderplates'),
    voidforgedItem(BATTLEGEAR, 'chest', 'Voidforged Battleplate'),
    voidforgedItem(BATTLEGEAR, 'hands', 'Voidforged Gauntlets'),
    voidforgedItem(BATTLEGEAR, 'legs', 'Voidforged Legplates'),
];

const BATTLEGEAR_OTHER = [
    voidforgedItem(BATTLEGEAR, 'waist', 'Girdle of Collapsing Stars'),
    voidforgedItem(BATTLEGEAR, 'wrists', 'Vambraces of Bent Light'),
    voidforgedItem(BATTLEGEAR, 'feet', 'Sabatons of the Endless Fall'),
    voidforgedItem(BATTLEGEAR, 'neck', 'Choker of the Hungering Dark'),
    voidforgedItem(BATTLEGEAR, 'back', 'Shroud of the Starless Expanse'),
    voidforgedItem(BATTLEGEAR, 'ring1', 'Band of Broken Orbits'),
    voidforgedItem(BATTLEGEAR, 'ring2', 'Seal of the Hollow Sky'),
    voidforgedItem(BATTLEGEAR, 'trinket1', 'Shard of a Shattered Moon'),
    voidforgedItem(BATTLEGEAR, 'trinket2', 'Skull of the Whispering Deep'),
    voidforgedItem(BATTLEGEAR, 'twoHand', 'Starcrusher, Maul of the Void',
        'Whatever it strikes falls inward.'),
];

const BULWARK_TIER = [
    voidforgedItem(BULWARK, 'helm', 'Voidforged Faceguard'),
    voidforgedItem(BULWARK, 'shoulders', 'Voidforged Pauldrons'),
    voidforgedItem(BULWARK, 'chest', 'Voidforged Chestguard'),
    voidforgedItem(BULWARK, 'hands', 'Voidforged Handguards'),
    voidforgedItem(BULWARK, 'legs', 'Voidforged Legguards'),
];

const BULWARK_OTHER = [
    voidforgedItem(BULWARK, 'waist', 'Girdle of Unbending Gravity'),
    voidforgedItem(BULWARK, 'wrists', 'Bracers of the Sealed Rift'),
    voidforgedItem(BULWARK, 'feet', 'Greaves of the Immovable Star'),
    voidforgedItem(BULWARK, 'neck', 'Pendant of the Silent Deep'),
    voidforgedItem(BULWARK, 'back', 'Cloak of the Black Expanse'),
    voidforgedItem(BULWARK, 'ring1', 'Band of Folded Space'),
    voidforgedItem(BULWARK, 'ring2', 'Signet of the Leaden Star'),
    voidforgedItem(BULWARK, 'trinket1', 'Fang of the Frozen Void'),
    voidforgedItem(BULWARK, 'trinket2', 'Coin of the Hollow Tongue'),
    voidforgedItem(BULWARK, 'twoHand', 'Voidmaw, Reaver of the Last Light',
        'It drinks the light, and the life, of all it strikes.'),
];

// ---------------------------------------------------------------- set bonuses

const SHADOW_NOVA_NPC = 33846;        // instant shadow burst, no cooldown category
const HARDENED_SKIN = 71586;          // Corroded Skeleton Key's plain self absorb
const VISUAL_SHADOWFURY = 7732;       // Shadowfury's eruption at a target point
const VISUAL_SACRIFICE = 14025;       // the voidwalker's Sacrifice shield
const DARK_STAR_DAMAGE = 1800;
const AP_DARK_STAR = 0.6;
const DARK_STAR_RADIUS_YARDS = 8;
const GRAVITIC_WARD_INTERNAL_COOLDOWN_MS = 30000;

/** Battlegear 4-piece: a collapsing star dropped on the target, hitting everything around it. */
const DARK_STAR = createFamilySpell(VK, {
    id: 'voidforged-dark-star',
    parent: SHADOW_NOVA_NPC,
    familyBit: FAMILY_BIT.GEAR_PROC_1,
    name: 'Dark Star',
    icon: 'Spell_Shadow_Shadowfury',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOWFURY },
    configure: spell => {
        // Shadow Nova bursts around its caster and is self-ranged.
        spell.Range.set(RANGE.YARDS_40);
        spell.Effects.get(0)
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8)
            .PointsBase.set(DARK_STAR_DAMAGE);
        scalesWithAttackPower(spell, AP_DARK_STAR);
    },
});

/** Bulwark 4-piece: space folds around the knight and swallows the next blows. */
const GRAVITIC_WARD = createFamilySpell(VK, {
    id: 'voidforged-gravitic-ward',
    parent: HARDENED_SKIN,
    familyBit: FAMILY_BIT.GEAR_PROC_2,
    name: 'Gravitic Ward',
    icon: 'Spell_Shadow_SacrificialShield',
    school: 'SHADOW',
    visual: { id: VISUAL_SACRIFICE },
    configure: spell => {
        // The trinket's own 6400 absorb, raised like the gear's stats.
        const absorb = spell.Effects.get(0).PointsBase;
        absorb.set(Math.round(absorb.get() * ENDGAME_POWER_FACTOR));
        // Hardened Skin carries a category cooldown time for the trinket.
        spell.Cooldown.Category.set(0)
            .Cooldown.CategoryTime.set(0)
            .Cooldown.Time.set(0);
    },
});

export const VOIDFORGED_BATTLEGEAR_SET = createClassItemSet(VK, {
    id: 'voidforged-battlegear',
    name: 'Voidforged Battlegear',
    items: BATTLEGEAR_TIER,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(VK, 'voidforged-battlegear-2-piece', {
                name: 'Voidforged Battlegear 2-Piece Bonus',
                description: 'Your Void Strike has a $h% chance to grant an additional Void Shard, and its damage'
                    + ' is increased by $s2%.',
                icon: 'INV_Enchant_VoidCrystal',
                effects: [
                    triggerSpell(VOID_SHARDS.ID),
                    abilityPercent('DAMAGE', 10, [VOID_STRIKE]),
                ],
                configure: onAbilityHit(VK, 30, [VOID_STRIKE]),
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(VK, 'voidforged-battlegear-4-piece', {
                name: 'Voidforged Battlegear 4-Piece Bonus',
                description: 'Your Collapse and Annihilate have a $h% chance to drop a Dark Star on the target,'
                    + ' dealing ' + withAttackPower(`$${DARK_STAR.ID}s1`, AP_DARK_STAR)
                    + ` Shadow damage to it and every enemy within ${DARK_STAR_RADIUS_YARDS} yards.`,
                icon: 'Spell_Shadow_Shadowfury',
                effects: [triggerSpell(DARK_STAR.ID)],
                // Implosion is left out: one proc per enemy hit would chain Dark Stars across a pack.
                configure: onAbilityHit(VK, 50, [COLLAPSE, ANNIHILATE]),
            }),
        },
    ],
});

export const VOIDFORGED_BULWARK_SET = createClassItemSet(VK, {
    id: 'voidforged-bulwark',
    name: 'Voidforged Bulwark',
    items: BULWARK_TIER,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(VK, 'voidforged-bulwark-2-piece', {
                name: 'Voidforged Bulwark 2-Piece Bonus',
                description: 'Increases the damage absorbed by Void Barrier by $s1% and the threat generated by'
                    + ' Crushing Weight and Unravel by $s2%.',
                icon: 'Spell_Shadow_AntiShadow',
                effects: [
                    // Void Shards empower Void Barrier the same way.
                    abilityPercent('ALL_EFFECTS', 20, [VOID_BARRIER]),
                    abilityPercent('THREAT', 20, [CRUSHING_WEIGHT, UNRAVEL]),
                ],
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(VK, 'voidforged-bulwark-4-piece', {
                name: 'Voidforged Bulwark 4-Piece Bonus',
                description: 'Melee attacks against you have a $h% chance to fold space around you, absorbing'
                    + ` $${GRAVITIC_WARD.ID}s1 damage for $${GRAVITIC_WARD.ID}d.  This effect cannot occur more`
                    + ` often than once every ${GRAVITIC_WARD_INTERNAL_COOLDOWN_MS / 1000} sec.  Also reduces the`
                    + ' cooldown of Event Horizon by $/1000;S2 sec.',
                icon: 'Spell_Shadow_SacrificialShield',
                effects: [
                    triggerSpell(GRAVITIC_WARD.ID),
                    abilityFlat('COOLDOWN', -60000, [EVENT_HORIZON]),
                ],
                configure: onMeleeHitTaken(10, GRAVITIC_WARD_INTERNAL_COOLDOWN_MS),
            }),
        },
    ],
});

[...BATTLEGEAR_TIER, ...BATTLEGEAR_OTHER].forEach(item => std.Tags.add(MODULE_NAME, BATTLEGEAR_TAG, item.ID));
[...BULWARK_TIER, ...BULWARK_OTHER].forEach(item => std.Tags.add(MODULE_NAME, BULWARK_TAG, item.ID));
