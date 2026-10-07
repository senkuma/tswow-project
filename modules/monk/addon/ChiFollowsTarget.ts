import { registerEvents } from "./Events";

/** Handled by livescripts/PersonalChi.ts, which moves the Chi onto the monk's enemy target or the monk. */
const MOVE_COMMAND = '.monkchi';
const MOVE_TO_SELF = 'self';

declare function UnitCanAttack(this: void, unit: string, other: string): boolean;
declare function UnitIsDead(this: void, unit: string): boolean;

/**
 * Keeps the monk's Chi where the client lets them use it: WotLK keeps combo
 * points on one unit, and the client only counts those on the target or the
 * monk. On every target change the server is asked to move the Chi onto the
 * new enemy, or onto the monk when they target a friend or nothing. The
 * target's GUID goes along, as the server may not have received the new
 * selection yet.
 */
export function moveChiWithTarget(currentChi: () => number) {
    const watcher = CreateFrame('Frame');
    registerEvents(watcher, ['PLAYER_TARGET_CHANGED']);
    watcher.SetScript('OnEvent', () => {
        if (currentChi() === 0) {
            return;
        }
        const enemy = UnitExists('target') && UnitCanAttack('player', 'target') && !UnitIsDead('target');
        if (enemy && GetComboPoints('player', 'target') === 0) {
            SendChatMessage(`${MOVE_COMMAND} ${UnitGUID('target')}`, 'SAY');
        } else if (!enemy && GetComboPoints('player', 'player') === 0) {
            SendChatMessage(`${MOVE_COMMAND} ${MOVE_TO_SELF}`, 'SAY');
        }
    });
}
