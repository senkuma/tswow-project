import { Class } from "wow/wotlk/std/Class/Class";
import { RaceMask } from "wow/wotlk/std/Race/RaceType";

export type RaceName = keyof typeof RaceMask;

/** Everything the kit needs to know about the class it builds content for. */
export interface ClassContext {
    /** Namespace for generated IDs, normally the owning module's name. */
    readonly module: string;
    readonly cls: Class;
    readonly races: RaceName[];
    /**
     * Spell family shared by the class's abilities and talents. TrinityCore
     * defines families 0-17 and only applies a talent's spell modifiers to
     * spells of the same family, so each custom class needs its own unused value.
     */
    readonly spellFamily: number;
}

/** Anything a talent can target through the class's spell family flags. */
export interface FamilyTarget {
    readonly familyBit: number;
}

/** `|` yields a signed 32-bit result; DBC masks are unsigned (e.g. 0xFFFFFFFF for all classes). */
export function withClassBit(context: ClassContext, classMask: number) {
    return (classMask | context.cls.Mask) >>> 0;
}
