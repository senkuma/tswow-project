const GEAR_COMMAND = 'plaguedoctorgear';
const SET_LABEL = 'Regalia of the Plague Physician';
// Free epic gear is a testing tool, so only GM accounts (security level 1+) may use it.
const MIN_GM_RANK = 1;

/** `.plaguedoctorgear`: adds the Regalia of the Plague Physician and its weapons to the player's bags. */
export function registerGearCommand(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        if (commandName(command.get()) !== GEAR_COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);

        if (player.GetGMRank() < MIN_GM_RANK) {
            player.SendBroadcastMessage('Only game masters can use this command.');
            return;
        }
        // Item ids tagged by PlagueDoctorGear.ts.
        const items = TAG('plaguedoctor', 'plague-doctor-gear');
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

/** The command typed, lowercased and without its "." or "!" prefix. */
function commandName(text: string) {
    let name = text.trim().toLowerCase();
    // startsWith is ES2015 and has no Lua translation under the ES5 target livescripts use.
    while (name.substring(0, 1) === '.' || name.substring(0, 1) === '!') {
        name = name.substring(1);
    }
    return name;
}
