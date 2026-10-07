import { createFamilySpell, scalesWithAttackPower, withAttackPower } from "classkit";
import { FAMILY_BIT } from "../abilities/FamilyBits";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";

// Plain rage energizes: warrior Shield Specialization's 5 rage and the warrior tier bonus Ire's 2 rage.
const SHIELD_SPECIALIZATION_RAGE = 23602;
const IRE = 37521;
// Instant single-target Shadow damage at melee range, with a fixed base value.
const DARK_WEAPON_NPC = 49715;
// Death knight tier 10 tank bonus: a plain self aura, 12% less damage taken for 10 sec.
const BLOOD_ARMOR = 70654;

const VISUAL_VOID_DRAIN = 7825;      // Void Drain: a violet implosion on the target
const VISUAL_SHADOW_WARD = 343;      // Shadow Ward: a dark ward flaring around the caster

const SPATIAL_BACKLASH_BASE_DAMAGE = 40;
const AP_SPATIAL_BACKLASH = 0.1;

/** Triggered by the Kinetic Recoil talent. */
export const KINETIC_RECOIL = createFamilySpell(VK, {
    id: 'kinetic-recoil',
    parent: SHIELD_SPECIALIZATION_RAGE,
    familyBit: FAMILY_BIT.BULWARK_PROC_1,
    name: 'Kinetic Recoil',
    icon: 'Spell_Shadow_GatherShadows',
    school: 'PHYSICAL',
    // The parent's text is about shield blocks.
    configure: spell => { spell.Description.enGB.set('Generates $/10;s1 rage.'); },
});

/** Triggered by the Entropic Absorption talent. */
export const ENTROPIC_ABSORPTION = createFamilySpell(VK, {
    id: 'entropic-absorption',
    parent: IRE,
    familyBit: FAMILY_BIT.BULWARK_PROC_2,
    name: 'Entropic Absorption',
    icon: 'Spell_Shadow_ManaFeed',
    school: 'PHYSICAL',
    configure: spell => { spell.Description.enGB.set('Generates $/10;s1 rage.'); },
});

/** Triggered by the Spatial Backlash talent; strikes the attacker whose blow triggered it. */
export const SPATIAL_BACKLASH = createFamilySpell(VK, {
    id: 'spatial-backlash',
    parent: DARK_WEAPON_NPC,
    familyBit: FAMILY_BIT.BULWARK_PROC_3,
    name: 'Spatial Backlash',
    icon: 'Spell_Shadow_Shadesofdarkness',
    school: 'SHADOW',
    visual: { id: VISUAL_VOID_DRAIN },
    configure: spell => {
        spell.Effects.get(0).PointsBase.set(SPATIAL_BACKLASH_BASE_DAMAGE);
        scalesWithAttackPower(spell, AP_SPATIAL_BACKLASH);
    },
});

/** Spatial Backlash's damage as a tooltip expression, for the talent that describes it. */
export const SPATIAL_BACKLASH_DAMAGE = withAttackPower(`$${SPATIAL_BACKLASH.ID}s1`, AP_SPATIAL_BACKLASH);

/** Triggered by the Graviton Shell talent. */
export const GRAVITON_SHELL = createFamilySpell(VK, {
    id: 'graviton-shell',
    parent: BLOOD_ARMOR,
    familyBit: FAMILY_BIT.BULWARK_PROC_4,
    name: 'Graviton Shell',
    icon: 'Spell_Shadow_ShadowWard',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOW_WARD },
});
