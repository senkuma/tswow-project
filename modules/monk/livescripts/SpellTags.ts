/** Helpers for the spell id lists TAG() returns. */
export function forEachSpell(spells: TSArray<uint32>, action: (spellId: number) => void) {
    for (let index = 0; index < spells.length; index++) {
        action(spells[index]);
    }
}

export function containsSpell(spells: TSArray<uint32>, spellId: number) {
    for (let index = 0; index < spells.length; index++) {
        if (spells[index] === spellId) {
            return true;
        }
    }
    return false;
}
