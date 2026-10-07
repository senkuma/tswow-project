/** A 3.3.5 GUID's parts. */
export interface GuidParts {
    high: number;
    entry: number;
    counter: number;
}

export const PLAYER_HIGH_GUID = 0x0000;
const HEX_DIGITS = '0123456789abcdef';

/**
 * Parses a GUID as the client's UnitGUID writes it: "0x" and 16 hex digits.
 * Creatures, pets and vehicles split them into a 4-digit high part, a
 * 6-digit entry and a 6-digit counter; players use the low 8 digits as counter.
 */
export function parseClientGuid(text: string): GuidParts | undefined {
    const lower = text.toLowerCase();
    if (lower.length !== 18 || lower.substring(0, 2) !== '0x') {
        return undefined;
    }
    const digits = lower.substring(2);
    for (let index = 0; index < digits.length; index++) {
        if (HEX_DIGITS.indexOf(digits.charAt(index)) < 0) {
            return undefined;
        }
    }
    const high = parseInt(digits.substring(0, 4), 16);
    return high === PLAYER_HIGH_GUID
        ? { high, entry: 0, counter: parseInt(digits.substring(8), 16) }
        : { high, entry: parseInt(digits.substring(4, 10), 16), counter: parseInt(digits.substring(10), 16) };
}
