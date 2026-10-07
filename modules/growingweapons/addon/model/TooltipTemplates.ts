const LUA_PATTERN_MAGIC = '^$()%.[]*+-?';
const FORMAT_FLAGS = '-+ #0123456789.';

/**
 * A Lua pattern matching text written with a format string from GlobalStrings
 * (such as DAMAGE_TEMPLATE, "%d - %d Damage"), capturing each formatted value.
 * Matching through the client's own strings keeps it working in any locale.
 */
export function templatePattern(template: string) {
    let pattern = '^';
    for (let index = 0; index < template.length; index++) {
        const char = template.charAt(index);
        if (char === '%') {
            let end = index + 1;
            while (end < template.length && FORMAT_FLAGS.indexOf(template.charAt(end)) >= 0) {
                end++;
            }
            pattern += captureFor(template.charAt(end));
            index = end;
        } else {
            pattern += LUA_PATTERN_MAGIC.indexOf(char) >= 0 ? `%${char}` : char;
        }
    }
    return `${pattern}$`;
}

function captureFor(conversion: string) {
    switch (conversion) {
        case 'd': return '(%d+)';
        case 'f': case 'g': return '([%d%.]+)';
        case 'c': return '(.)';
        case '%': return '%%';
        default: return '(.-)';
    }
}

export interface WeaponDamage {
    min: number;
    max: number;
    /** Undefined when the weapon's speed is unknown. */
    dps?: number;
}

/** A weapon's damage range and damage per second with a flat bonus on every swing. */
export function grownDamage(baseMin: number, baseMax: number, bonus: number, speed?: number): WeaponDamage {
    const min = baseMin + bonus;
    const max = baseMax + bonus;
    return { min, max, dps: speed === undefined || speed <= 0 ? undefined : (min + max) / 2 / speed };
}
