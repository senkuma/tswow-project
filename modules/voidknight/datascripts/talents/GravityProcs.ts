import {
    ALL_SCHOOLS, createFamilySpell, damageDone, DURATION, RANGE, scalesWithAttackPower, setSelfAuraEffects,
    withAttackPower,
} from "classkit";
import { FAMILY_BIT } from "../abilities/FamilyBits";
import { grantVoidShard } from "../abilities/VoidShards";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";

const IMPROVED_HAMSTRING_ROOT = 23694;  // single-target root with no weapon or range requirement
const DARK_WEAPON_NPC = 49715;          // instant single-target Shadow damage of a fixed amount
const IMPACT_STUN = 12355;              // mage Impact's 2 sec stun
const HEART_STRIKE_SNARE = 58617;       // Glyph of Heart Strike's plain 50% snare
const DESOLATION = 66803;               // death knight Desolation: all damage done, on the caster
const UNBRIDLED_WRATH = 12964;          // instant rage energize on the caster

const VISUAL_STRANGULATE = 11154;       // dark coils closing around the target
const VISUAL_SHADOWFURY = 7732;         // burst of shadow at the target's feet
const VISUAL_CURSE_OF_EXHAUSTION = 8785;

const AP_GRAVITIC_CRUSH = 0.15;
const GRAVITIC_MOMENTUM_DAMAGE_PERCENT = 5;
const HAWKING_RADIATION_RAGE = 10;

/** Triggered by the Tidal Lock talent. */
export const TIDAL_LOCK = createFamilySpell(VK, {
    id: 'tidal-lock',
    parent: IMPROVED_HAMSTRING_ROOT,
    familyBit: FAMILY_BIT.GRAVITY_PROC_1,
    name: 'Tidal Lock',
    icon: 'Spell_DeathKnight_Strangulate',
    school: 'SHADOW',
    visual: { id: VISUAL_STRANGULATE },
    configure: spell => {
        spell.Duration.set(DURATION.SEC_3)
            .Description.enGB.set('Locks the target in place, immobilizing it for $d.')
            .AuraDescription.enGB.set('Immobilized.');
    },
});

/** Triggered by the Crushing Gravity talent. */
export const GRAVITIC_CRUSH = createFamilySpell(VK, {
    id: 'gravitic-crush',
    parent: DARK_WEAPON_NPC,
    familyBit: FAMILY_BIT.GRAVITY_PROC_2,
    name: 'Gravitic Crush',
    icon: 'Spell_Shadow_MindTwisting',
    school: 'SHADOW',
    configure: spell => {
        // The NPC strike only reaches melee range, which a hit that lands while the target moves can exceed.
        spell.Range.set(RANGE.YARDS_10)
            .Description.enGB.set('Crushes the target beneath its own weight, dealing '
                + withAttackPower('$s1', AP_GRAVITIC_CRUSH) + ' Shadow damage.');
        spell.Effects.get(0).PointsBase.set(50);
        scalesWithAttackPower(spell, AP_GRAVITIC_CRUSH);
    },
});

/** Gravitic Crush's damage as a tooltip expression, for talents that describe it. */
export const GRAVITIC_CRUSH_DAMAGE_TEXT = withAttackPower(`$${GRAVITIC_CRUSH.ID}s1`, AP_GRAVITIC_CRUSH);

/** Triggered by the Crushing Pressure talent. */
export const CRUSHING_PRESSURE = createFamilySpell(VK, {
    id: 'crushing-pressure',
    parent: IMPACT_STUN,
    familyBit: FAMILY_BIT.GRAVITY_PROC_3,
    name: 'Crushing Pressure',
    icon: 'Spell_Shadow_Shadowfury',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOWFURY },
    configure: spell => {
        // Impact is a talent rank: drop its rank text and its tooltip's reference to its own id.
        spell.Subtext.enGB.set('')
            .Description.enGB.set('Pins the target beneath crushing gravity, stunning it for $d.')
            .AuraDescription.enGB.set('Stunned.');
    },
});

/** Triggered by the Gravitic Drag talent. */
export const GRAVITIC_DRAG = createFamilySpell(VK, {
    id: 'gravitic-drag',
    parent: HEART_STRIKE_SNARE,
    familyBit: FAMILY_BIT.GRAVITY_PROC_4,
    name: 'Gravitic Drag',
    icon: 'Spell_Shadow_GatherShadows',
    school: 'SHADOW',
    visual: { id: VISUAL_CURSE_OF_EXHAUSTION },
    configure: spell => {
        spell.Duration.set(DURATION.SEC_6)
            .AuraDescription.enGB.set('Movement speed reduced by $s1%.');
    },
});

/** Triggered by the Gravitic Momentum talent. */
export const GRAVITIC_MOMENTUM = createFamilySpell(VK, {
    id: 'gravitic-momentum',
    parent: DESOLATION,
    familyBit: FAMILY_BIT.GRAVITY_PROC_5,
    name: 'Gravitic Momentum',
    icon: 'Spell_Shadow_ShadowWordDominate',
    school: 'SHADOW',
    configure: spell => {
        spell.Duration.set(DURATION.SEC_12)
            .Description.enGB.set('Increases all damage you deal by $s1% for $d.')
            .AuraDescription.enGB.set('Damage dealt increased by $s1%.');
        // Desolation is a death knight spell with a rune cost.
        spell.row.RuneCostID.set(0);
        setSelfAuraEffects(spell, [damageDone(ALL_SCHOOLS, GRAVITIC_MOMENTUM_DAMAGE_PERCENT)]);
    },
});

/** Triggered by the Hawking Radiation talent: rage and a Void Shard from a fallen enemy. */
export const HAWKING_RADIATION = createFamilySpell(VK, {
    id: 'hawking-radiation',
    parent: UNBRIDLED_WRATH,
    familyBit: FAMILY_BIT.GRAVITY_PROC_6,
    name: 'Hawking Radiation',
    icon: 'Spell_Shadow_DarkSummoning',
    school: 'SHADOW',
    configure: spell => {
        // Unbridled Wrath is a talent rank with a tooltip about its talent.
        spell.Subtext.enGB.set('')
            .Description.enGB.set('Restores $/10;s1 rage and grants a Void Shard.');
        // Rage is stored in tenths of a point.
        spell.Effects.get(0).Type.ENERGIZE.set()
            .PowerType.set('RAGE')
            .PowerBase.set(HAWKING_RADIATION_RAGE * 10)
            .ImplicitTargetA.set('UNIT_CASTER');
        grantVoidShard(spell.Effects.get(1));
    },
});
