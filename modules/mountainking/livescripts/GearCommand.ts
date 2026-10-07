import { commandWords } from "./Commands";

const GEAR_COMMAND = 'mountainkinggear';
// Free epic gear is a testing tool, so only GM accounts (security level 1+) may use it.
const MIN_GM_RANK = 1;

/** `.mountainkinggear [battlegear|titanstorm]`: adds a Mountain King gear set to the player's bags. */
export function registerGearCommand(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        const words = commandWords(command.get());
        if (words[0] !== GEAR_COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);

        if (player.GetGMRank() < MIN_GM_RANK) {
            player.SendBroadcastMessage('Only game masters can use this command.');
            return;
        }
        const setName = words.length > 1 ? words[1] : 'battlegear';
        if (setName === 'battlegear') {
            // Item ids tagged by MountainKingGear.ts.
            giveItems(player, 'Battlegear of the Mountain King', TAG('mountainking', 'mountain-king-gear'));
        } else if (setName === 'titanstorm') {
            // Item ids tagged by MountainKingTitanstormGear.ts.
            giveItems(player, 'Titanstorm Battlegear', TAG('mountainking', 'mountain-king-titanstorm-gear'));
        } else {
            player.SendBroadcastMessage(`Unknown set "${setName}". Use .${GEAR_COMMAND} [battlegear|titanstorm].`);
        }
    });
}

function giveItems(player: TSPlayer, setLabel: string, items: TSArray<uint32>) {
    let missing = 0;
    for (let i = 0; i < items.length; i++) {
        if (player.AddItem(items[i], 1) === undefined) {
            missing++;
        }
    }
    if (missing > 0) {
        player.SendBroadcastMessage(`${setLabel}: ${missing} of ${items.length} items did not fit. Free up bag space and try again.`);
    } else {
        player.SendBroadcastMessage(`${setLabel}: added ${items.length} items to your bags.`);
    }
}
