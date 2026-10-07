import { createClassItem } from "classkit";
import { GrowthAnchor, makeGrowingWeapon } from "growingweapons";
import { MODULE_NAME } from "./Constants";
import { MONK_CONTEXT } from "./MonkClass";

/**
 * Fu Zan, the brewmaster artifact staff of Legion, as a growing weapon: a
 * plain level 1 staff that gains weapon damage, agility, stamina and the
 * melee ratings (critical strike, haste, hit) with every level. Until level
 * 80 it keeps pace with weapons of the wielder's level; its last twenty
 * levels climb to the server's endgame staves (item level 277 scaled by the
 * endgame power factor).
 */
const BENT_STAFF = 35;                // level 1 staff, 3-5 damage
const BASE_AVERAGE_DAMAGE = 4;
const TAINTED_TWIG_DISPLAY = 64352;   // the gnarled wood of Tainted Twig of Nordrassil
const SWING_SECONDS = 3.3;
// Quality 6 is Artifact in 3.3.5 (TSWoW's enum calls it HEIRLOOM; heirlooms are 7).
const ARTIFACT_QUALITY = 6;

/** Flat damage per swing that brings the staff to `dps` damage per second. */
function swingDamage(dps: number) {
    return Math.round(dps * SWING_SECONDS - BASE_AVERAGE_DAMAGE);
}

interface FuZanLevel {
    level: number;
    dps: number;
    agility: number;
    stamina: number;
    crit: number;
    haste: number;
    hit: number;
}

function anchor({ level, dps, agility, stamina, crit, haste, hit }: FuZanLevel): GrowthAnchor {
    return {
        level,
        // Listed in the order the weapon's progress panel shows them.
        bonuses: {
            WEAPON_DAMAGE: swingDamage(dps), AGILITY: agility, STAMINA: stamina,
            CRIT_RATING: crit, HASTE_RATING: haste, HIT_RATING: hit,
        },
    };
}

const FU_ZAN_GROWTH = [
    anchor({ level: 1, dps: 4, agility: 2, stamina: 2, crit: 1, haste: 1, hit: 1 }),
    anchor({ level: 20, dps: 20, agility: 12, stamina: 10, crit: 6, haste: 5, hit: 4 }),
    anchor({ level: 40, dps: 40, agility: 28, stamina: 24, crit: 14, haste: 11, hit: 9 }),
    anchor({ level: 60, dps: 70, agility: 50, stamina: 44, crit: 25, haste: 20, hit: 16 }),
    anchor({ level: 70, dps: 100, agility: 72, stamina: 64, crit: 36, haste: 29, hit: 23 }),
    // A fine item level 200 staff.
    anchor({ level: 80, dps: 160, agility: 105, stamina: 95, crit: 55, haste: 44, hit: 36 }),
    // Distant Land (item level 277) times the endgame power factor, its attack power folded into
    // agility; ratings as on item level 277 two-handers, scaled like the server's rating tables.
    anchor({ level: 100, dps: 1060, agility: 650, stamina: 480, crit: 390, haste: 310, hit: 260 }),
];

export const FU_ZAN = makeGrowingWeapon(MODULE_NAME, createClassItem(MONK_CONTEXT, {
    id: 'fu-zan',
    parent: BENT_STAFF,
    display: TAINTED_TWIG_DISPLAY,
    name: 'Fu Zan, the Wanderer\'s Companion',
    description: 'It grows stronger with every foe it fells.',
})
    .Quality.set(ARTIFACT_QUALITY)
    .RequiredLevel.set(1)
    .Delay.set(SWING_SECONDS * 1000, 'MILLISECONDS'), {
    id: 'fu-zan',
    growth: FU_ZAN_GROWTH,
});
