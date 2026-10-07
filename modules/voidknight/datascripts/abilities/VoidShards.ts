import {
    abilityPercent, ALL_SCHOOLS, consumedByModifiedSpells, createFamilySpell, damageTaken, DURATION, FamilyTarget,
    setSelfAuraEffects,
} from "classkit";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { SpellEffect } from "wow/wotlk/std/Spell/SpellEffect";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import { FAMILY_BIT } from "./FamilyBits";

// Maelstrom Weapon: a stacking buff that the spells it empowers consume.
const MAELSTROM_WEAPON = 53817;
const VISUAL_SHADOW_TRANCE = 5219;    // Shadow Trance (Nightfall): a brief violet flash

export const MAX_VOID_SHARDS = 5;
// Values per shard; TrinityCore multiplies aura amounts by the stack count.
export const FINISHER_DAMAGE_PER_SHARD = 20;
export const BARRIER_BONUS_PER_SHARD = 20;
export const DAMAGE_REDUCTION_PER_SHARD = 1;

// The finishers live with the other abilities, which in turn grant Void Shards,
// so they are referenced here by their family bits.
export const DAMAGE_FINISHERS: FamilyTarget[] = [
    { familyBit: FAMILY_BIT.COLLAPSE },
    { familyBit: FAMILY_BIT.IMPLOSION },
];
export const DEFENSIVE_FINISHERS: FamilyTarget[] = [
    { familyBit: FAMILY_BIT.VOID_BARRIER },
    { familyBit: FAMILY_BIT.SIPHON_THE_VOID },
];

/**
 * The Void Knight's signature resource: builders crystallize fragments of the
 * Void around the knight. Each shard held slightly reduces damage taken, and a
 * finisher spends them all: Collapse and Implosion hit harder per shard, Void
 * Barrier absorbs and Siphon the Void heals more per shard.
 */
export const VOID_SHARDS = createFamilySpell(VK, {
    id: 'void-shards',
    parent: MAELSTROM_WEAPON,
    familyBit: FAMILY_BIT.VOID_SHARD,
    name: 'Void Shards',
    icon: 'INV_Enchant_VoidCrystal',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOW_TRANCE },
    configure: spell => {
        spell.Stacks.set(MAX_VOID_SHARDS)
            .Duration.set(DURATION.SEC_30)
            .AuraDescription.enGB.set('Each shard reduces damage taken by $s3%, increases the damage of your next'
                + ' Collapse or Implosion by $s1% and the absorb or healing of your next Void Barrier or Siphon'
                + ' the Void by $s2%.');
        setSelfAuraEffects(spell, [
            abilityPercent('DAMAGE', FINISHER_DAMAGE_PER_SHARD, DAMAGE_FINISHERS),
            abilityPercent('ALL_EFFECTS', BARRIER_BONUS_PER_SHARD, DEFENSIVE_FINISHERS),
            damageTaken(ALL_SCHOOLS, -DAMAGE_REDUCTION_PER_SHARD),
        ]);
        // Collapse is a melee attack and Implosion an attack-power spell on the ranged
        // table; Void Barrier is a magic absorb and Siphon the Void a heal with no class.
        consumedByModifiedSpells(VK, spell, [...DAMAGE_FINISHERS, ...DEFENSIVE_FINISHERS], {
            consumerProcFlags: [
                'DONE_MELEE_SPELL', 'DONE_RANGED_SPELL', 'DONE_MAGIC_SPELL_POSITIVE', 'DONE_NO_CLASS_SPELL_POSITIVE',
            ],
            types: ['DAMAGE', 'HEAL', 'OTHER'],
            phase: 'HIT',
        });
    },
});

/** Turns `effect` into one that grants the caster a Void Shard. */
export function grantVoidShard(effect: SpellEffect) {
    effect.clear();
    effect.Type.TRIGGER_SPELL.set().TriggerSpell.set(VOID_SHARDS.ID);
    effect.ImplicitTargetA.set('UNIT_CASTER');
}

/** Makes `spell` grant `shards` Void Shards at once (one per effect, up to three). */
export function grantVoidShards(spell: Spell, shards: number) {
    for (let effectIndex = 0; effectIndex < 3; ++effectIndex) {
        if (effectIndex < shards) {
            grantVoidShard(spell.Effects.get(effectIndex));
        } else {
            spell.Effects.get(effectIndex).clear();
        }
    }
}
