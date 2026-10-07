import { chiHolder, chiHolderFor, monkOf, moveChi, sameUnit } from "./ChiResource";
import { parseClientGuid, PLAYER_HIGH_GUID } from "./ClientGuid";
import { commandWords } from "./Commands";

/**
 * Keeps the monk's Chi with them, as in retail, though WotLK combo points
 * belong to a single unit: switching targets would leave them behind, and
 * the holder's death would clear them.
 *
 * - The monk addon sends `.monkchi <target GUID>` when the monk targets an
 *   enemy, and `.monkchi self` otherwise; the Chi then moves onto that enemy,
 *   where the client lets abilities spend it, or onto the monk. The GUID
 *   comes along because the client reports the new selection in a separate
 *   packet, which may arrive later.
 * - Chi on a creature that dies is put back on the monk's next enemy, or on
 *   the monk.
 */
const MOVE_COMMAND = 'monkchi';
const MOVE_TO_SELF = 'self';

// Chi taken off a dying target, by player GUID, until the death has cleared the original.
const chiThroughDeath: { [player: number]: number } = {};

export function registerPersonalChi(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        const words = commandWords(command.get());
        if (words[0] !== MOVE_COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);
        const monk = monkOf(player);
        if (monk === undefined) {
            return;
        }
        if (words[1] === MOVE_TO_SELF) {
            moveChi(monk, monk);
            return;
        }
        const target = words.length > 1 ? unitFromClientGuid(monk, words[1]) : monk.GetSelection();
        if (target !== undefined) {
            moveChi(monk, chiHolderFor(monk, target));
        }
    });

    // Death clears the combo points on the victim after this event and before OnDeath.
    events.Unit.OnDeathEarly((victim, killer) => {
        const monk = monkOf(killer);
        const holder = monk === undefined ? undefined : chiHolder(monk);
        if (monk !== undefined && holder !== undefined && sameUnit(holder, victim)) {
            chiThroughDeath[monk.GetGUIDLow()] = monk.GetComboPoints();
        }
    });
    events.Unit.OnDeath((_, killer) => {
        const monk = monkOf(killer);
        const chi = monk === undefined ? undefined : chiThroughDeath[monk.GetGUIDLow()];
        if (monk === undefined || chi === undefined) {
            return;
        }
        delete chiThroughDeath[monk.GetGUIDLow()];
        monk.AddComboPoints(chiHolderFor(monk, monk.GetSelection()), chi);
    });
}

/** The unit with a GUID as the client writes it, if it is in the monk's map. */
function unitFromClientGuid(monk: TSPlayer, text: string): TSUnit | undefined {
    const parts = parseClientGuid(text);
    if (parts === undefined) {
        return undefined;
    }
    const guid = parts.high === PLAYER_HIGH_GUID
        ? CreateGUID(PLAYER_HIGH_GUID as HighGuid, parts.counter)
        : CreateGUID(parts.high as HighGuid, parts.entry, parts.counter);
    return monk.GetUnit(guid);
}
