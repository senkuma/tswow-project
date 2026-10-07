/**
 * Growing weapon progress as the server reports it in addon messages
 * (livescripts/ClientMessages.ts writes them):
 *   STATE;item;level;maxLevel;experience;experienceToNext;cap;bonuses;amounts;nextAmounts
 *   LEVELUP;item;level;gains
 */
export const ADDON_PREFIX = 'GROWWPN';

/** The bonus that adds flat damage per swing; the others are stats named as the ITEM_MOD_* strings name them. */
export const WEAPON_DAMAGE = 'WEAPON_DAMAGE';
const WEAPON_DAMAGE_LABEL = 'Weapon Damage';

/** The client's short name of a bonus ("Critical Strike Rating"). */
export function bonusLabel(key: string): string {
    if (key === WEAPON_DAMAGE) {
        return WEAPON_DAMAGE_LABEL;
    }
    const label: string | undefined = _G[`ITEM_MOD_${key}_SHORT`];
    return label ?? key;
}

export interface WeaponBonus {
    key: string;
    label: string;
    amount: number;
    /** The total at the next level; undefined at the maximum level. */
    next?: number;
}

export interface WeaponState {
    item: number;
    level: number;
    maxLevel: number;
    experience: number;
    experienceToNext: number;
    /** The highest level the weapon may reach before its wielder levels. */
    cap: number;
    bonuses: WeaponBonus[];
}

export interface WeaponLevelUp {
    item: number;
    level: number;
    gains: { label: string; amount: number }[];
}

export type WeaponEvent =
    | { kind: 'state'; state: WeaponState }
    | { kind: 'levelUp'; levelUp: WeaponLevelUp };

const STATE_FIELDS = 10;
const LEVEL_UP_FIELDS = 4;

export function isMaxLevel(state: WeaponState) {
    return state.level >= state.maxLevel;
}

/** Experience is held at a full bar while the weapon waits for its wielder to level. */
export function isHeldAtCap(state: WeaponState) {
    return !isMaxLevel(state) && state.level >= state.cap;
}

/** How far the bar is filled, from 0 to 1. */
export function progressFraction(state: WeaponState) {
    if (isMaxLevel(state) || state.experienceToNext <= 0) {
        return 1;
    }
    return Math.min(1, state.experience / state.experienceToNext);
}

/** The latest progress of every growing weapon the server has reported, by item id. */
export class WeaponProgressStore {
    private readonly states: { [item: number]: WeaponState } = {};

    stateOf(item: number): WeaponState | undefined {
        return this.states[item];
    }

    /** Applies a message; undefined when it is malformed or a level up arrives for an unknown weapon. */
    apply(message: string): WeaponEvent | undefined {
        const fields = message.split(';');
        if (fields[0] === 'STATE' && fields.length === STATE_FIELDS) {
            const state = parseState(fields);
            if (state !== undefined) {
                this.states[state.item] = state;
                return { kind: 'state', state };
            }
        } else if (fields[0] === 'LEVELUP' && fields.length === LEVEL_UP_FIELDS) {
            const levelUp = this.parseLevelUp(fields);
            if (levelUp !== undefined) {
                return { kind: 'levelUp', levelUp };
            }
        }
        return undefined;
    }

    private parseLevelUp(fields: string[]): WeaponLevelUp | undefined {
        const [item, level] = numbers(fields.slice(1, 3));
        const gains = numbers(list(fields[3]));
        // The STATE sent just before names the bonuses.
        const state = this.stateOf(item);
        if (!(level > 0) || gains.some(gain => isNaN(gain)) || state === undefined || gains.length !== state.bonuses.length) {
            return undefined;
        }
        return { item, level, gains: gains.map((amount, index) => ({ label: state.bonuses[index].label, amount })) };
    }
}

function parseState(fields: string[]): WeaponState | undefined {
    const [item, level, maxLevel, experience, experienceToNext, cap] = numbers(fields.slice(1, 7));
    const keys = list(fields[7]);
    const amounts = numbers(list(fields[8]));
    const nextAmounts = numbers(list(fields[9]));
    const atMax = level >= maxLevel;
    const valid = [item, level, maxLevel, experience, experienceToNext, cap, ...amounts, ...nextAmounts].every(n => !isNaN(n))
        && keys.length === amounts.length && nextAmounts.length === (atMax ? 0 : amounts.length);
    if (!valid) {
        return undefined;
    }
    return {
        item, level, maxLevel, experience, experienceToNext, cap,
        bonuses: keys.map((key, index) =>
            ({ key, label: bonusLabel(key), amount: amounts[index], next: atMax ? undefined : nextAmounts[index] })),
    };
}

function list(field: string) {
    return field === '' ? [] : field.split(',');
}

function numbers(fields: string[]) {
    return fields.map(field => Number(field));
}
