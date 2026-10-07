import { createFamilySpell, scalesWithAttackPower, withAttackPower } from "classkit";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";

const LIGHTNING_STRIKE_NPC = 23687;   // single-target lightning bolt from the sky
const BASH_NPC = 25515;               // single-target stun with a heavy impact visual
const DURATION_2_SEC = 39;
const AP_CHARGED_STRIKE = 0.15;

/** Triggered by the Charged Strikes talent. */
export const CHARGED_STRIKE = createFamilySpell(MK, {
    id: 'charged-strike',
    parent: LIGHTNING_STRIKE_NPC,
    familyBit: 21,
    name: 'Charged Strike',
    icon: 'Spell_Shaman_StaticShock',
    school: 'NATURE',
    configure: spell => {
        spell.Effects.get(0).PointsBase.set(40);
        scalesWithAttackPower(spell, AP_CHARGED_STRIKE);
    },
});

/** Charged Strike's damage as a tooltip expression, for talents that describe it. */
export const CHARGED_STRIKE_DAMAGE_TEXT = withAttackPower(`$${CHARGED_STRIKE.ID}s1`, AP_CHARGED_STRIKE);

/** Triggered by the Bash talent, after Bash from the Warcraft III Mountain King. */
export const BASH_STUN = createFamilySpell(MK, {
    id: 'bash',
    parent: BASH_NPC,
    familyBit: 22,
    name: 'Bash',
    icon: 'INV_Mace_01',
    school: 'PHYSICAL',
    configure: spell => {
        spell.Duration.set(DURATION_2_SEC)
            .Power.CostBase.set(0);
        spell.Effects.get(0).Mechanic.set('STUNNED');
    },
});
