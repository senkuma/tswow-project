import { ABILITY_TALENTS } from "./AbilityTalents";

/** WoW's Lua pattern matcher; this module only consumes its first capture. */
declare function strmatch(this: void, text: string, pattern: string): string | undefined;

const abilityTalents = new Set(ABILITY_TALENTS);

/** The Talent.dbc id in a talent's link ("|Htalent:<id>:<rank>|h"). */
function talentId(tab: number, index: number): number | undefined {
    const link = GetTalentLink(tab, index, false, false);
    if (link === undefined) {
        return undefined;
    }
    const id = strmatch(link, 'talent:(%d+)');
    return id === undefined ? undefined : tonumber(id);
}

/**
 * Whether a talent teaches an ability, which retail draws as a square node.
 * The talent API does not say, so the datascripts list those talents.
 */
export function teachesAbility(tab: number, index: number): boolean {
    const id = talentId(tab, index);
    return id !== undefined && abilityTalents.has(id);
}
