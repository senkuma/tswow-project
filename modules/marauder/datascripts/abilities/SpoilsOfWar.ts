import {
    abilityPercent, consumedByModifiedSpells, createFamilySpell, damageDone, DURATION, FamilyTarget,
    setSelfAuraEffects,
} from "classkit";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { SpellEffect } from "wow/wotlk/std/Spell/SpellEffect";
import { MARAUDER_CONTEXT as MR } from "../MarauderClass";
import { FAMILY_BIT } from "./FamilyBits";

// Maelstrom Weapon: a stacking buff that the spells it empowers consume.
const MAELSTROM_WEAPON = 53817;
const VISUAL_BLOODSURGE = 10701;      // brief red flash, as warrior Bloodsurge procs

export const MAX_SPOILS = 5;
// Values per stack; TrinityCore multiplies aura amounts by the stack count.
export const SPOILS_PHYSICAL_DAMAGE_PERCENT = 2;
export const RANSACK_DAMAGE_PER_SPOILS = 25;
export const GORGE_HEALING_PER_SPOILS = 100;

// Ransack and Gorge are defined with the other abilities, which in turn grant
// Spoils of War, so the finishers are referenced here by their family bits.
const RANSACK: FamilyTarget = { familyBit: FAMILY_BIT.RANSACK };
const GORGE: FamilyTarget = { familyBit: FAMILY_BIT.GORGE };

/**
 * The Marauder's signature mechanic: builders grant stacks, which raise
 * physical damage while held and are spent by Ransack or Gorge for a much
 * bigger hit or heal. Holding stacks and cashing them in is the core choice.
 */
export const SPOILS_OF_WAR = createFamilySpell(MR, {
    id: 'spoils-of-war',
    parent: MAELSTROM_WEAPON,
    familyBit: FAMILY_BIT.SPOILS_OF_WAR,
    name: 'Spoils of War',
    icon: 'INV_Misc_Coin_02',
    school: 'PHYSICAL',
    visual: { id: VISUAL_BLOODSURGE },
    configure: spell => {
        spell.Stacks.set(MAX_SPOILS)
            .Duration.set(DURATION.SEC_20)
            .AuraDescription.enGB.set('Each stack increases physical damage done by $s1%, the damage of your'
                + ' next Ransack by $s2% and the healing of your next Gorge by $s3%.');
        setSelfAuraEffects(spell, [
            damageDone(['PHYSICAL'], SPOILS_PHYSICAL_DAMAGE_PERCENT),
            abilityPercent('DAMAGE', RANSACK_DAMAGE_PER_SPOILS, [RANSACK]),
            abilityPercent('ALL_EFFECTS', GORGE_HEALING_PER_SPOILS, [GORGE]),
        ]);
        // Ransack is a melee attack; Gorge is a heal with no damage class.
        consumedByModifiedSpells(MR, spell, [RANSACK, GORGE], {
            consumerProcFlags: ['DONE_MELEE_SPELL', 'DONE_NO_CLASS_SPELL_POSITIVE', 'DONE_MAGIC_SPELL_POSITIVE'],
            types: ['DAMAGE', 'HEAL'],
            phase: 'HIT',
        });
    },
});

/** Turns `effect` into one that grants the caster a stack of Spoils of War. */
export function grantSpoilsOfWar(effect: SpellEffect) {
    effect.clear();
    effect.Type.TRIGGER_SPELL.set().TriggerSpell.set(SPOILS_OF_WAR.ID);
    effect.ImplicitTargetA.set('UNIT_CASTER');
}

/** Makes `spell` grant `stacks` stacks of Spoils of War at once (one per effect, up to three). */
export function grantSpoilsOfWarStacks(spell: Spell, stacks: number) {
    for (let effectIndex = 0; effectIndex < 3; ++effectIndex) {
        if (effectIndex < stacks) {
            grantSpoilsOfWar(spell.Effects.get(effectIndex));
        } else {
            spell.Effects.get(effectIndex).clear();
        }
    }
}
