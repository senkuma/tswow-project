import { createFamilySpell, DURATION } from "classkit";
import { CHI_TAGS, tagSpell } from "../abilities/Chi";
import { FAMILY_BIT } from "../abilities/FamilyBits";
import { MONK_CONTEXT as MK } from "../MonkClass";

// Cold Blood: a self buff with a single charge, rebuilt into Combo Breaker.
const COLD_BLOOD = 14177;
const RUNE_TAP = 48982;
const VISUAL_BLOODSURGE = 10701;      // brief flash when the buff procs

/**
 * Triggered by the Combo Breaker talent: the next Blackout Kick costs no Chi.
 * The livescripts read the buff when Blackout Kick is cast and remove it.
 */
export const COMBO_BREAKER = createFamilySpell(MK, {
    id: 'combo-breaker',
    parent: COLD_BLOOD,
    familyBit: FAMILY_BIT.COMBO_BREAKER,
    name: 'Combo Breaker',
    icon: 'ABILITY_MONK_CHISWIRL',
    school: 'PHYSICAL',
    visual: { id: VISUAL_BLOODSURGE },
    configure: spell => {
        spell.Duration.set(DURATION.SEC_15)
            .Cooldown.Time.set(0)
            .AuraDescription.enGB.set('Your next Blackout Kick costs no Chi.');
        // Cold Blood's critical strike modifier, spent by the next ability through its proc charge.
        spell.Proc.TriggerMask.set(0);
        spell.Proc.Charges.set(0);
        spell.Effects.get(0).clear();
        spell.Effects.get(0).Type.APPLY_AURA.set().ImplicitTargetA.set('UNIT_CASTER').Aura.DUMMY.set();
    },
});
tagSpell(COMBO_BREAKER.ID, CHI_TAGS.comboBreaker);

/** Triggered by the Gift of the Ox talent. */
export const GIFT_OF_THE_OX = createFamilySpell(MK, {
    id: 'gift-of-the-ox',
    parent: RUNE_TAP,
    familyBit: FAMILY_BIT.GIFT_OF_THE_OX,
    name: 'Gift of the Ox',
    icon: 'Ability_Monk_HealthSphere',
    school: 'NATURE',
    configure: spell => {
        // Rune Tap's rune cost and cooldown.
        spell.row.RuneCostID.set(0);
        spell.Cooldown.Time.set(0);
        spell.Effects.get(0).PointsBase.set(4);
    },
});
