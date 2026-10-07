import { ADDON_PREFIX, WeaponProgressStore } from "./model/WeaponProgress";
import { LevelUpToast } from "./ui/LevelUpToast";
import { TooltipProgress } from "./ui/TooltipProgress";

const SYNC_COMMAND = '.growingweapon sync';

const store = new WeaponProgressStore();
const tooltips = new TooltipProgress(item => store.stateOf(item));
const toast = new LevelUpToast();

const events = CreateFrame('Frame');
events.RegisterEvent('CHAT_MSG_ADDON');
// Messages sent while the game was loading are lost, so the addon asks once the world is shown.
events.RegisterEvent('PLAYER_ENTERING_WORLD');
events.SetScript('OnEvent', (_, event, prefix, message) => {
    if (event === 'PLAYER_ENTERING_WORLD') {
        events.UnregisterEvent('PLAYER_ENTERING_WORLD');
        SendChatMessage(SYNC_COMMAND, 'SAY');
    } else if (event === 'CHAT_MSG_ADDON' && prefix === ADDON_PREFIX) {
        const update = store.apply(message as string);
        if (update?.kind === 'state') {
            tooltips.refresh(update.state);
        } else if (update?.kind === 'levelUp') {
            toast.show(update.levelUp);
        }
    }
});
