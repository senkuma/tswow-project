import { createFamilySpell, DURATION } from "classkit";
import { FAMILY_BIT } from "../abilities/FamilyBits";
import { grantSpoilsOfWarStacks } from "../abilities/SpoilsOfWar";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";

const HAMSTRING = 1715;
const RELENTLESS_STRIKES_EFFECT = 14181;
// Cold Blood: an instant, untargeted self-cast, used as a shell for trigger effects.
const COLD_BLOOD = 14177;

/** Triggered by the Crippling Throws talent. */
export const CRIPPLING_THROW = createFamilySpell(MR, {
    id: 'crippling-throw',
    parent: HAMSTRING,
    familyBit: FAMILY_BIT.CRIPPLING_THROW,
    name: 'Crippling Throw',
    icon: 'INV_Axe_95',
    school: 'PHYSICAL',
    configure: spell => {
        spell.Power.CostBase.set(0)
            .Duration.set(DURATION.SEC_6)
            .AuraDescription.enGB.set('Movement speed reduced by $s1%.');
        spell.Effects.get(0).PointsBase.set(-50);
    },
});

/** Triggered by the Double Dealing talent. */
export const DOUBLE_DEALING = createFamilySpell(MR, {
    id: 'double-dealing',
    parent: RELENTLESS_STRIKES_EFFECT,
    familyBit: FAMILY_BIT.DOUBLE_DEALING,
    name: 'Double Dealing',
    icon: 'INV_Misc_Coin_18',
    school: 'PHYSICAL',
    configure: spell => { spell.Effects.get(0).PointsBase.set(30); },
});

/** Triggered by the Spoils of Victory talent. */
export const SPOILS_OF_VICTORY = createFamilySpell(MR, {
    id: 'spoils-of-victory',
    parent: COLD_BLOOD,
    familyBit: FAMILY_BIT.SPOILS_OF_VICTORY,
    name: 'Spoils of Victory',
    icon: 'INV_Misc_Bone_HumanSkull_01',
    school: 'PHYSICAL',
    configure: spell => {
        // Cold Blood's 3 min cooldown.
        spell.Cooldown.Time.set(0);
        grantSpoilsOfWarStacks(spell, 2);
    },
});
