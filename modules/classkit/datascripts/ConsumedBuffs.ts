import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext, FamilyTarget } from "./ClassContext";
import { ProcFlagName, procMask } from "./ProcFlags";
import { restrictProcToFamily } from "./TalentBuilder";

export interface BuffConsumption {
    /** Proc flags of the consuming spells, e.g. melee abilities or self heals. */
    consumerProcFlags: ProcFlagName[];
    types: ('DAMAGE' | 'HEAL' | 'OTHER')[];
    /**
     * When the buff is spent: 'CAST' for modifiers applied as the spell is
     * cast (cost, cast time), 'HIT' for ones applied when it lands (damage,
     * healing), so a miss keeps the buff.
     */
    phase: 'CAST' | 'HIT';
}

/**
 * Makes a buff whose spell modifiers target `consumers` expire as soon as one
 * of those modifiers changes a spell, as Clearcasting and Maelstrom Weapon
 * do: the buff procs only from spells it modified and has a single charge,
 * which removes it (every stack) when used.
 */
export function consumedByModifiedSpells(
    context: ClassContext, spell: Spell, consumers: FamilyTarget[], consumption: BuffConsumption,
) {
    // DBC fields first: creating the spell_proc row copies them.
    spell.Proc.TriggerMask.set(procMask(consumption.consumerProcFlags));
    spell.Proc.Chance.set(100);
    spell.Proc.Charges.set(1);
    spell.Proc.TypeMask.set(consumption.types);
    spell.Proc.PhaseMask.set(consumption.phase);
    spell.Proc.AttributesMask.set('REQUIRE_SPELL_MOD');
    restrictProcToFamily(context, spell, consumers);
}
