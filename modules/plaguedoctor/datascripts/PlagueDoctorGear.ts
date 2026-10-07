import {
    abilityFlat, abilityPercent, createClassItem, createClassItemSet, createFamilySpell, createPassiveSpell,
    ItemPowerScaling, onAbilityHit, RADIUS, scaleItemPower, triggerSpell,
} from "classkit";
import { ENDGAME_POWER_FACTOR } from "endgame";
import { std } from "wow/wotlk";
import { FAMILY_BIT } from "./abilities/FamilyBits";
import {
    BLIGHT_INJECTION, CONTAGION, HERBAL_TONIC, RESTORATIVE_DRAUGHT, RESTORATIVE_INJECTION, TOXIC_VIAL,
} from "./abilities/PlagueDoctorAbilities";
import { MODULE_NAME } from "./Constants";
import { PLAGUE_DOCTOR_CONTEXT as PD } from "./PlagueDoctorClass";

/** Tag the `.plaguedoctorgear` livescript command reads to find every piece. */
export const GEAR_TAG = 'plague-doctor-gear';

/**
 * Custom endgame tier: the best WotLK caster leather and caster weapons (item
 * level 277, Icecrown heroic) scaled by the server's endgame power factor.
 * Spell power, intellect and spirit serve the Plague Doctor's heals and damage
 * alike. Armor stays at its item level 277 values: its mitigation formula
 * cannot be rescaled like the rating tables the endgame module adjusts.
 */
const PLAGUE_PHYSICIAN_SCALING: ItemPowerScaling = {
    stats: ENDGAME_POWER_FACTOR,
    weaponDamage: ENDGAME_POWER_FACTOR,
    armor: 1,
    blockValue: 1,
};
const ITEM_LEVEL = 300;

/** Parents supply slot, stats, armor and weapon damage (all item level 277). */
const STAT_PARENTS = {
    helm: 51290,        // Sanctified Lasherweave Cover
    shoulders: 51292,   // Sanctified Lasherweave Mantle
    chest: 51294,       // Sanctified Lasherweave Vestment
    hands: 51291,       // Sanctified Lasherweave Gloves
    legs: 51293,        // Sanctified Lasherweave Trousers
    waist: 50705,       // Professor's Bloodied Smock (a belt)
    wrists: 50630,      // Bracers of Eternal Dreaming
    feet: 50665,        // Boots of Unnatural Growth
    twoHand: 50725,     // Dying Light (staff)
    mainHand: 50608,    // Frozen Bonespike (main-hand caster dagger)
    offHand: 50635,     // Sundial of Eternal Dusk (held in off-hand)
};

type Slot = keyof typeof STAT_PARENTS;

/**
 * Looks: Plagueheart, the black and plague-green raiment of Naxxramas, with the
 * Royal Apothecary Society's scalpel and a plague-touched staff. The off-hand
 * keeps the Sundial's own look.
 */
const DISPLAYS: Partial<Record<Slot, number>> = {
    helm: 35182,        // Plagueheart Circlet
    shoulders: 35187,   // Plagueheart Shoulderpads
    chest: 35185,       // Plagueheart Robe
    hands: 35183,       // Plagueheart Gloves
    legs: 35184,        // Plagueheart Leggings
    waist: 35179,       // Plagueheart Belt
    wrists: 35180,      // Plagueheart Bindings
    feet: 35186,        // Plagueheart Sandals
    twoHand: 54032,     // Staff of the Plaguehound
    mainHand: 59585,    // Scalpel of the Royal Apothecary
};

function plaguePhysicianItem(slot: Slot, name: string, description?: string) {
    const item = createClassItem(PD, {
        id: `plague-physician-${slot}`,
        parent: STAT_PARENTS[slot],
        display: DISPLAYS[slot],
        name,
        description,
    }).ItemLevel.set(ITEM_LEVEL);
    return scaleItemPower(item, PLAGUE_PHYSICIAN_SCALING);
}

const TIER_PIECES = [
    plaguePhysicianItem('helm', 'Beaked Hood of the Plague Physician'),
    plaguePhysicianItem('shoulders', 'Mantle of the Plague Physician'),
    plaguePhysicianItem('chest', 'Greatcoat of the Plague Physician'),
    plaguePhysicianItem('hands', 'Gloves of the Plague Physician'),
    plaguePhysicianItem('legs', 'Breeches of the Plague Physician'),
];

const OTHER_PIECES = [
    plaguePhysicianItem('waist', 'Apothecary\'s Bandolier'),
    plaguePhysicianItem('wrists', 'Bloodletter\'s Cuffs'),
    plaguePhysicianItem('feet', 'Quarantine Treads'),
    plaguePhysicianItem('twoHand', 'Rod of the Last Quarantine', 'Ten paces back, if you please.'),
    plaguePhysicianItem('mainHand', 'Lancet of Black Bile', 'For letting out what should not stay in.'),
    plaguePhysicianItem('offHand', 'Censer of Bitter Herbs', 'The smoke keeps the miasma at bay.  Mostly.'),
];

// ---------------------------------------------------------------- set bonuses

const WRATH = 5176;                   // Toxic Vial's parent, for its green missile
const NOXIOUS_SPLASH_DAMAGE = 1500;
const SP_NOXIOUS_SPLASH = 0.5;
const SPLASH_RADIUS_YARDS = 8;

/** 4-piece: a Toxic Vial that bursts over the target and the enemies around it. */
const NOXIOUS_SPLASH = createFamilySpell(PD, {
    id: 'noxious-splash',
    parent: WRATH,
    familyBit: FAMILY_BIT.NOXIOUS_SPLASH,
    name: 'Noxious Splash',
    icon: 'Spell_Nature_Acid_01',
    school: 'NATURE',
    configure: spell => {
        spell.Power.CostBase.set(0).Power.CostPercent.set(0);
        spell.BonusData.DirectBonus.set(SP_NOXIOUS_SPLASH);
        spell.Effects.get(0)
            .ImplicitTargetA.set('DEST_TARGET_ENEMY')
            .ImplicitTargetB.set('UNIT_DEST_AREA_ENEMY')
            .Radius.set(RADIUS.YARDS_8)
            .PointsBase.set(NOXIOUS_SPLASH_DAMAGE);
    },
});

export const PLAGUE_PHYSICIAN_SET = createClassItemSet(PD, {
    id: 'plague-physician',
    name: 'Regalia of the Plague Physician',
    items: TIER_PIECES,
    bonuses: [
        {
            pieces: 2,
            spell: createPassiveSpell(PD, 'plague-physician-2-piece', {
                name: 'Regalia of the Plague Physician 2-Piece Bonus',
                description: 'Increases the duration of Blight Injection and Contagion by $/1000;s1 sec, and the'
                    + ' periodic healing of Herbal Tonic and Restorative Injection by $s2%.',
                icon: 'Spell_Shadow_CreepingPlague',
                effects: [
                    abilityFlat('DURATION', 3000, [BLIGHT_INJECTION, CONTAGION]),
                    abilityPercent('DOT', 10, [HERBAL_TONIC, RESTORATIVE_INJECTION]),
                ],
            }),
        },
        {
            pieces: 4,
            spell: createPassiveSpell(PD, 'plague-physician-4-piece', {
                name: 'Regalia of the Plague Physician 4-Piece Bonus',
                description: 'Your Toxic Vial has a $h% chance to splash noxious ooze over the target, dealing'
                    + ` $${NOXIOUS_SPLASH.ID}s1 Nature damage to it and every enemy within ${SPLASH_RADIUS_YARDS}`
                    + ' yards.  Also increases the direct healing of Restorative Draught and Restorative'
                    + ' Injection by $s2%.',
                icon: 'Spell_Nature_Acid_01',
                effects: [
                    triggerSpell(NOXIOUS_SPLASH.ID),
                    abilityPercent('DAMAGE', 10, [RESTORATIVE_DRAUGHT, RESTORATIVE_INJECTION]),
                ],
                configure: onAbilityHit(PD, 20, [TOXIC_VIAL]),
            }),
        },
    ],
});

[...TIER_PIECES, ...OTHER_PIECES].forEach(item => std.Tags.add(MODULE_NAME, GEAR_TAG, item.ID));
