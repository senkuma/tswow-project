import { std } from "wow/wotlk";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext, FamilyTarget } from "./ClassContext";
import { AbilityVisual, SchoolName } from "./RankedAbility";

export interface FamilySpellDefinition {
    id: string;
    parent: number;
    familyBit: number;
    name: string;
    icon: string;
    school: SchoolName;
    visual?: AbilityVisual;
    configure?: (spell: Spell) => void;
}

/**
 * A single unranked spell in the class's spell family, typically the effect a
 * proc talent triggers. Being in the family lets other talents modify it.
 */
export class FamilySpell implements FamilyTarget {
    constructor(readonly spell: Spell, readonly familyBit: number) {}

    get ID() {
        return this.spell.ID;
    }
}

export function createFamilySpell(context: ClassContext, definition: FamilySpellDefinition) {
    const spell = std.Spells.create(context.module, definition.id, definition.parent)
        .Name.enGB.set(definition.name)
        .Icon.setPath(definition.icon)
        .SchoolMask.set(definition.school)
        .Family.set(context.spellFamily)
        .ClassMask.set(0, 0, 0)
        .ClassMask.setBit(definition.familyBit, true);
    if (definition.visual) {
        spell.Visual.set(definition.visual.id);
        if (definition.visual.missileSpeed !== undefined) {
            spell.Speed.set(definition.visual.missileSpeed);
        }
    }
    definition.configure?.(spell);
    return new FamilySpell(spell, definition.familyBit);
}
