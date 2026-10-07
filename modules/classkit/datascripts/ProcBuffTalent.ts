import { std } from "wow/wotlk";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext } from "./ClassContext";

export interface ProcBuffTalentDefinition {
    id: string;
    name: string;
    icon: string;
    /** Talent rank spells of the parent; each triggers the buff rank at the same index. */
    talentRanks: number[];
    buffRanks: number[];
    /**
     * TDB spell_proc rows to copy. They often apply to a whole rank chain
     * (negative ids), which cloning a single spell does not copy.
     */
    talentProcRow: number;
    buffProcRow: number;
    /** Talent tooltip; receives the buff's spell id for `$<id>s1`-style references. */
    description: (buffId: number) => string;
    buffDescription: string;
}

/** Clones a talent whose ranks each trigger a matching buff rank, e.g. warrior Flurry. */
export function createProcBuffTalentRanks(context: ClassContext, definition: ProcBuffTalentDefinition): Spell[] {
    if (definition.talentRanks.length !== definition.buffRanks.length) {
        throw new Error(`${definition.id}: talent and buff rank counts differ`);
    }
    return definition.talentRanks.map((talentParent, index) => {
        const rank = index + 1;
        const buff = std.Spells.create(context.module, `${definition.id}-buff-rank-${rank}`, definition.buffRanks[index])
            .Name.enGB.set(definition.name)
            .Icon.setPath(definition.icon)
            .AuraDescription.enGB.set(definition.buffDescription);
        std.SQL.spell_proc.query({ SpellId: definition.buffProcRow }).clone(buff.ID);

        const talent = std.Spells.create(context.module, `${definition.id}-rank-${rank}`, talentParent)
            .Name.enGB.set(definition.name)
            .Icon.setPath(definition.icon)
            .Description.enGB.set(definition.description(buff.ID));
        talent.Effects.get(0).TriggerSpell.set(buff.ID);
        std.SQL.spell_proc.query({ SpellId: definition.talentProcRow }).clone(talent.ID);
        return talent;
    });
}
