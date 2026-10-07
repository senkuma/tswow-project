import { commandWords } from "./Commands";

const GEAR_COMMAND = 'monkgear';
const SET_LABEL = 'Battlegear of the Jade Serpent';
// Free epic gear is a testing tool, so only GM accounts (security level 1+) may use it.
const MIN_GM_RANK = 1;

/** `.monkgear`: adds the Battlegear of the Jade Serpent and its weapons to the player's bags. */
export function registerGearCommand(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        if (commandWords(command.get())[0] !== GEAR_COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);

        if (player.GetGMRank() < MIN_GM_RANK) {
            player.SendBroadcastMessage('Only game masters can use this command.');
            return;
        }
        // Item ids tagged by MonkGear.ts.
        const items = TAG('monk', 'monk-gear');
        let missing = 0;
        for (let i = 0; i < items.length; i++) {
            if (player.AddItem(items[i], 1) === undefined) {
                missing++;
            }
        }
        player.SendBroadcastMessage(missing > 0
            ? `${SET_LABEL}: ${missing} of ${items.length} items did not fit. Free up bag space and try again.`
            : `${SET_LABEL}: added ${items.length} items to your bags.`);
    });
}
