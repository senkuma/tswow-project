/**
 * The monk's Chi, kept in WotLK combo points. TrinityCore keeps combo points
 * on one unit; the Chi is held by the monk's enemy target, or by the monk
 * when they are not targeting an enemy, so it is theirs wherever they look.
 * The client shows the combo points held by the target or the monk.
 */
export const MONK_CLASS = GetID('ChrClasses', 'monk', 'monk');

export function monkOf(object: TSObject | undefined): TSPlayer | undefined {
    const player = object === undefined ? undefined : object.ToPlayer();
    return player !== undefined && player.GetClass() === MONK_CLASS ? player : undefined;
}

/** Neutral creatures count: they can be attacked, though they are not hostile until then. */
export function isEnemy(monk: TSPlayer, unit: TSUnit) {
    return unit.IsAlive() && !monk.IsFriendlyTo(unit);
}

export function sameUnit(a: TSUnit, b: TSUnit) {
    return a.GetGUIDLow() === b.GetGUIDLow() && a.IsPlayer() === b.IsPlayer();
}

/** Who should hold the monk's Chi while `target` is selected. */
export function chiHolderFor(monk: TSPlayer, target: TSUnit | undefined): TSUnit {
    return target !== undefined && isEnemy(monk, target) ? target : monk;
}

/**
 * The unit holding the monk's Chi, if they have any. Never call
 * GetComboTarget directly: TSWoW's dereferences the combo target unchecked
 * and crashes the server when there is none. A unit with combo points always
 * has one; with none, the last holder may also be an enemy long left behind.
 */
export function chiHolder(monk: TSPlayer): TSUnit | undefined {
    return monk.GetComboPoints() > 0 ? monk.GetComboTarget() : undefined;
}

/** Moves all of the monk's Chi onto `destination`. */
export function moveChi(monk: TSPlayer, destination: TSUnit) {
    const holder = chiHolder(monk);
    if (holder === undefined || sameUnit(holder, destination)) {
        return;
    }
    // Combo points added to a new unit replace those on the old one.
    monk.AddComboPoints(destination, monk.GetComboPoints());
}

export function gainChi(monk: TSPlayer, amount: number) {
    const holder = chiHolder(monk);
    monk.AddComboPoints(holder !== undefined ? holder : chiHolderFor(monk, monk.GetSelection()), amount);
}

export function spendChi(monk: TSPlayer, amount: number) {
    const holder = chiHolder(monk);
    if (holder !== undefined) {
        monk.AddComboPoints(holder, -amount);
    }
}
