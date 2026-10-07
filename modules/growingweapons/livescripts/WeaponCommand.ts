import { sendState } from "./ClientMessages";
import { commandWords } from "./Commands";
import { GROWING_WEAPONS } from "./GrowingWeaponData";
import { progressOf } from "./ProgressStore";
import { addExperience, forEachOwnedWeapon } from "./WeaponGrowth";

const COMMAND = 'growingweapon';
// Free weapons and experience are testing tools, so only GM accounts (security level 1+) may use them.
const MIN_GM_RANK = 1;
const USAGE = `Usage: .${COMMAND} [sync | add | xp <amount>]`;

/**
 * `.growingweapon sync` sends the player's weapon progress to the addon, which
 * asks for it on login. Game masters can also `add` the growing weapons their
 * class can use and give their equipped or carried ones `xp`.
 */
export function registerWeaponCommand(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        const words = commandWords(command.get());
        if (words[0] !== COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);
        const action = words.length > 1 ? words[1] : 'sync';
        if (action === 'sync') {
            forEachOwnedWeapon(player, (item, weapon) => sendState(player, weapon, progressOf(item)));
        } else if (player.GetGMRank() < MIN_GM_RANK) {
            player.SendBroadcastMessage('Only game masters can use this command.');
        } else if (action === 'add') {
            addWeapons(player);
        } else if (action === 'xp' && words.length > 2) {
            grantExperience(player, words[2]);
        } else {
            player.SendBroadcastMessage(USAGE);
        }
    });
}

function addWeapons(player: TSPlayer) {
    let added = 0;
    GROWING_WEAPONS.forEach(weapon => {
        const template = GetItemTemplate(weapon.item);
        const usable = template !== undefined && (template.GetAllowableClass() & player.GetClassMask()) !== 0;
        if (usable && !player.HasItem(weapon.item, 1, true) && player.AddItem(weapon.item, 1) !== undefined) {
            added++;
        }
    });
    player.SendBroadcastMessage(added > 0
        ? `Added ${added} growing weapon${added === 1 ? '' : 's'} to your bags.`
        : 'You already have every growing weapon your class can use, or your bags are full.');
    forEachOwnedWeapon(player, (item, weapon) => sendState(player, weapon, progressOf(item)));
}

function grantExperience(player: TSPlayer, amountText: string) {
    const amount = parseInt(amountText, 10);
    if (isNaN(amount) || amount <= 0) {
        player.SendBroadcastMessage(USAGE);
        return;
    }
    let weapons = 0;
    forEachOwnedWeapon(player, (item, weapon) => {
        addExperience(player, item, weapon, amount);
        weapons++;
    });
    if (weapons === 0) {
        player.SendBroadcastMessage('You have no growing weapon.');
    }
}
