import { createClassItem, createPassiveSpell, damageDone, healingDone, MAGIC_SCHOOLS, manaCost, spellCrit, statPercent } from "classkit";
import { GrowthAnchor, makeGrowingWeapon } from "growingweapons";
import { MODULE_NAME } from "./Constants";
import { PLAGUE_DOCTOR_CONTEXT } from "./PlagueDoctorClass";

/**
 * Mortis, the Plague Doctor's growing weapon: a plain level 1 staff that gains
 * spell power, intellect, stamina, spirit and the spell ratings (critical
 * strike, haste) with every level, for healing and harming alike. Until level
 * 80 it keeps pace with caster staves of the wielder's level; its last twenty
 * levels climb to the server's endgame staves (item level 277 scaled by the
 * endgame power factor). Every 25 levels it awakens a passive.
 *
 * It grows no weapon damage: a caster's staff is for its stats, and dropping
 * the damage bonus leaves room on the level enchantment for spell power, which
 * only fits there (see growingweapons' LevelEnchantment.ts).
 */
const BENT_STAFF = 35;                // level 1 staff, 3-5 damage
const PLAGUE_BEAST_DISPLAY = 54799;   // Staff of the Plague Beast: bone and sickly green
const SWING_SECONDS = 3.0;
// Quality 6 is Artifact in 3.3.5 (TSWoW's enum calls it HEIRLOOM; heirlooms are 7).
const ARTIFACT_QUALITY = 6;

interface MortisLevel {
    level: number;
    spellPower: number;
    intellect: number;
    stamina: number;
    spirit: number;
    crit: number;
    haste: number;
}

function anchor({ level, spellPower, intellect, stamina, spirit, crit, haste }: MortisLevel): GrowthAnchor {
    return {
        level,
        // Listed in the order the weapon's progress panel shows them.
        bonuses: {
            SPELL_POWER: spellPower, INTELLECT: intellect, STAMINA: stamina, SPIRIT: spirit,
            CRIT_RATING: crit, HASTE_RATING: haste,
        },
    };
}

const MORTIS_GROWTH = [
    anchor({ level: 1, spellPower: 2, intellect: 1, stamina: 1, spirit: 1, crit: 1, haste: 1 }),
    anchor({ level: 20, spellPower: 10, intellect: 5, stamina: 5, spirit: 3, crit: 2, haste: 2 }),
    // Darkmoon Magestaff (item level 45) carries 30 spell power.
    anchor({ level: 40, spellPower: 28, intellect: 10, stamina: 10, spirit: 7, crit: 5, haste: 4 }),
    anchor({ level: 60, spellPower: 50, intellect: 18, stamina: 18, spirit: 14, crit: 10, haste: 8 }),
    anchor({ level: 70, spellPower: 160, intellect: 45, stamina: 40, spirit: 30, crit: 25, haste: 20 }),
    // A fine item level 200 caster staff, such as the Staff of Draconic Combat.
    anchor({ level: 80, spellPower: 400, intellect: 90, stamina: 70, spirit: 70, crit: 60, haste: 80 }),
    // Dying Light (item level 277) times the endgame power factor, plus critical strike;
    // ratings as on item level 277 staves, scaled like the server's rating tables.
    anchor({ level: 100, spellPower: 2720, intellect: 572, stamina: 572, spirit: 426, crit: 300, haste: 426 }),
];

// ---------------------------------------------------------------- milestone passives

const PLAGUE_SCHOLAR = createPassiveSpell(PLAGUE_DOCTOR_CONTEXT, 'mortis-plague-scholar', {
    name: 'Plague Scholar',
    description: 'Increases your Intellect by $s1%.',
    icon: 'INV_Misc_Book_06',
    effects: [statPercent('INTELLECT', 4)],
});

const MIASMIC_FOCUS = createPassiveSpell(PLAGUE_DOCTOR_CONTEXT, 'mortis-miasmic-focus', {
    name: 'Miasmic Focus',
    description: 'Increases your chance to critically hit with spells by $s1%.',
    icon: 'Spell_Nature_NullifyDisease',
    effects: [spellCrit(2)],
});

const ALCHEMISTS_THRIFT = createPassiveSpell(PLAGUE_DOCTOR_CONTEXT, 'mortis-alchemists-thrift', {
    name: 'Alchemist\'s Thrift',
    description: 'Reduces the mana cost of your spells by $S1%.',
    icon: 'INV_Potion_137',
    effects: [manaCost(-5)],
});

const PESTILENT_MASTERY = createPassiveSpell(PLAGUE_DOCTOR_CONTEXT, 'mortis-pestilent-mastery', {
    name: 'Pestilent Mastery',
    description: 'Increases all spell damage and healing you deal by $s1%.',
    icon: 'Spell_Shadow_PlagueCloud',
    effects: [damageDone(MAGIC_SCHOOLS, 5), healingDone(5)],
});

export const MORTIS = makeGrowingWeapon(MODULE_NAME, createClassItem(PLAGUE_DOCTOR_CONTEXT, {
    id: 'mortis',
    parent: BENT_STAFF,
    display: PLAGUE_BEAST_DISPLAY,
    name: 'Mortis, Cane of the Plague Doctor',
    description: 'Every cure begins with a sickness.',
})
    .Quality.set(ARTIFACT_QUALITY)
    .RequiredLevel.set(1)
    .Delay.set(SWING_SECONDS * 1000, 'MILLISECONDS'), {
    id: 'mortis',
    growth: MORTIS_GROWTH,
    milestones: [
        { level: 25, spell: PLAGUE_SCHOLAR.ID },
        { level: 50, spell: MIASMIC_FOCUS.ID },
        { level: 75, spell: ALCHEMISTS_THRIFT.ID },
        { level: 100, spell: PESTILENT_MASTERY.ID },
    ],
});
