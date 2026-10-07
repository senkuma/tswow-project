export type PrimaryStat = 'AGILITY' | 'STRENGTH' | 'INTELLECT' | 'SPIRIT' | 'STAMINA';
export type CombatRatingStat = 'CRIT_RATING' | 'HASTE_RATING' | 'HIT_RATING';

/**
 * What a growing weapon gains as it levels: stats, named as the client's
 * ITEM_MOD_* strings name them (SPELL_POWER for casters' weapons), or flat
 * weapon damage per swing.
 */
export type GrowthBonus = PrimaryStat | CombatRatingStat | 'SPELL_POWER' | 'WEAPON_DAMAGE';

/** A weapon's total bonuses at one level. */
export interface GrowthAnchor {
    level: number;
    bonuses: Partial<Record<GrowthBonus, number>>;
}

/** Total bonus amounts at one level, in the order of `GrowthTable.bonuses`. */
export type LevelAmounts = number[];

export interface GrowthTable {
    bonuses: GrowthBonus[];
    /** Index 0 is level 1; the last entry is the maximum level. */
    levels: LevelAmounts[];
}

/**
 * Bonuses at every level from 1 to the last anchor's level. Item power grows
 * by a steady percentage per level, so levels between two anchors are
 * interpolated geometrically rather than linearly.
 */
export function growthTable(anchors: GrowthAnchor[]): GrowthTable {
    validateAnchors(anchors);
    const bonuses = Object.keys(anchors[0].bonuses) as GrowthBonus[];
    const levels: LevelAmounts[] = [];
    for (let index = 1; index < anchors.length; index++) {
        const from = anchors[index - 1];
        const to = anchors[index];
        // Each segment ends where the next begins; the final anchor is added once, below.
        for (let level = from.level; level < to.level; level++) {
            const progress = (level - from.level) / (to.level - from.level);
            levels.push(bonuses.map(bonus => Math.round(interpolate(from.bonuses[bonus]!, to.bonuses[bonus]!, progress))));
        }
    }
    const last = anchors[anchors.length - 1];
    levels.push(bonuses.map(bonus => last.bonuses[bonus]!));
    return { bonuses, levels };
}

function interpolate(from: number, to: number, progress: number) {
    return from * Math.pow(to / from, progress);
}

function validateAnchors(anchors: GrowthAnchor[]) {
    if (anchors.length < 2 || anchors[0].level !== 1) {
        throw new Error('A growing weapon needs at least two growth anchors, the first at level 1.');
    }
    const bonuses = Object.keys(anchors[0].bonuses).sort();
    if (bonuses.length === 0) {
        throw new Error('A growing weapon needs at least one bonus.');
    }
    anchors.forEach((anchor, index) => {
        if (index > 0 && anchor.level <= anchors[index - 1].level) {
            throw new Error(`Growth anchors must be in increasing level order (level ${anchor.level}).`);
        }
        if (Object.keys(anchor.bonuses).sort().join() !== bonuses.join()) {
            throw new Error(`The growth anchor at level ${anchor.level} must give exactly: ${bonuses.join(', ')}.`);
        }
        Object.values(anchor.bonuses).forEach(amount => {
            if (!(amount! > 0)) {
                throw new Error(`Growth bonuses must be positive (level ${anchor.level}).`);
            }
        });
    });
}
