import {
    createFamilySpell, DURATION, periodicDamageScalesWithAttackPower, scalesWithAttackPower, withAttackPower,
} from "classkit";
import { FAMILY_BIT } from "../abilities/FamilyBits";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";

const SHADOW_SHOCK_NPC = 16583;          // instant single-target shadow lash
const SHADOW_WORD_PAIN_NPC = 59864;      // shadow damage every 2 sec, no class family
const EVASION = 5277;
const DAMAGE_CLASS_RANGED = 3;

const AP_RIFT_ECHO = 0.15;
const RIFT_ECHO_RAGE = 30;               // tenths of a rage point
const AP_SPLINTERED_REALITY_PER_TICK = 0.05;
const SPLINTERED_REALITY_TICKS = 3;
const DISPLACEMENT_DODGE = 10;

/** Triggered by the Reverberating Rifts talent. */
export const RIFT_ECHO = createFamilySpell(VK, {
    id: 'rift-echo',
    parent: SHADOW_SHOCK_NPC,
    familyBit: FAMILY_BIT.RIFT_PROC_1,
    name: 'Rift Echo',
    icon: 'Spell_Arcane_PortalDalaran',
    school: 'SHADOW',
    configure: spell => {
        spell.Power.CostBase.set(0);
        spell.Effects.get(0).PointsBase.set(50);
        scalesWithAttackPower(spell, AP_RIFT_ECHO);
        // Shadow Shock has a single effect; the rage goes in its unused second slot.
        spell.Effects.get(1).Type.ENERGIZE.set()
            .PowerType.set('RAGE')
            .PowerBase.set(RIFT_ECHO_RAGE)
            .ImplicitTargetA.set('UNIT_CASTER');
    },
});

/** Rift Echo's damage as a tooltip expression, for talents that describe it. */
export const RIFT_ECHO_DAMAGE_TEXT = withAttackPower(`$${RIFT_ECHO.ID}s1`, AP_RIFT_ECHO);

/** Triggered by the Splintered Reality talent on every enemy Rift Cleave or Dimensional Rupture strikes. */
export const SPLINTERED_REALITY = createFamilySpell(VK, {
    id: 'splintered-reality',
    parent: SHADOW_WORD_PAIN_NPC,
    familyBit: FAMILY_BIT.RIFT_PROC_2,
    name: 'Splintered Reality',
    icon: 'Spell_Shadow_Misery',
    school: 'SHADOW',
    configure: spell => {
        spell.Power.CostBase.set(0)
            .Duration.set(DURATION.SEC_6)
            .AuraDescription.enGB.set('Suffering $s1 Shadow damage every $t1 sec.');
        // The NPC version is a magic spell; on the ranged table it uses the knight's hit instead of spell hit.
        spell.DefenseType.set(DAMAGE_CLASS_RANGED);
        spell.Effects.get(0).PointsBase.set(20);
        periodicDamageScalesWithAttackPower(spell, AP_SPLINTERED_REALITY_PER_TICK);
    },
});

/** Splintered Reality's total damage as a tooltip expression, for talents that describe it. */
export const SPLINTERED_REALITY_DAMAGE_TEXT = withAttackPower(
    `$${SPLINTERED_REALITY.ID}o1`, AP_SPLINTERED_REALITY_PER_TICK * SPLINTERED_REALITY_TICKS);

/** Triggered by the Displacement talent: a brief, smaller Phase Shift. */
export const DISPLACEMENT = createFamilySpell(VK, {
    id: 'rift-displacement',
    parent: EVASION,
    familyBit: FAMILY_BIT.RIFT_PROC_3,
    name: 'Displacement',
    icon: 'Spell_Shadow_ImpPhaseShift',
    school: 'SHADOW',
    configure: spell => {
        spell.Duration.set(DURATION.SEC_6)
            .AuraDescription.enGB.set('Dodge chance increased by $s1%.');
        // Evasion's 3 min category cooldown, which Phase Shift may also carry.
        spell.Cooldown.Category.set(0)
            .Cooldown.CategoryTime.set(0)
            .Cooldown.Time.set(0);
        spell.Effects.get(0).PointsBase.set(DISPLACEMENT_DODGE);
    },
});
