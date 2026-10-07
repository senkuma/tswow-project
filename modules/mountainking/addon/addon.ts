import { HeroFrame } from "./hero/HeroFrame";

// UnitClass returns several values, but its declaration types them as an array,
// which would compile to unpack() on a string; this signature makes it a multi-return.
const unitClass = UnitClass as unknown as (unit: string) => LuaMultiReturn<[string, string, number]>;
const TALENT_UI_ADDON = 'Blizzard_TalentUI';

// The addon loads with the game UI for every character; only Mountain Kings use it.
const [, classFile] = unitClass('player');
if (classFile === 'MOUNTAINKING') {
    const heroFrame = new HeroFrame();
    SlashCmdList['MKHERO'] = () => heroFrame.toggle();
    _G['SLASH_MKHERO1'] = '/hero';
    addTalentFrameButton(() => heroFrame.toggle());
}

/**
 * A "Hero Talents" button in the talent window, as in retail: in the TSWoW
 * talent window when that addon is installed, otherwise in Blizzard's, which
 * loads on demand. Addons have all loaded by PLAYER_LOGIN.
 */
function addTalentFrameButton(onClick: () => void) {
    const watcher = CreateFrame('Frame');
    watcher.RegisterEvent('PLAYER_LOGIN');
    watcher.RegisterEvent('ADDON_LOADED');
    watcher.SetScript('OnEvent', (_, event, addonName) => {
        if (event === 'PLAYER_LOGIN') {
            const addToTalentUI: ((text: string, onClick: () => void) => void) | undefined = _G['TalentUI_AddFooterButton'];
            if (addToTalentUI !== undefined) {
                watcher.UnregisterAllEvents();
                addToTalentUI('Hero Talents', onClick);
            } else if (IsAddOnLoaded(TALENT_UI_ADDON)) {
                watcher.UnregisterAllEvents();
                addBlizzardTalentFrameButton(onClick);
            }
        } else if (event === 'ADDON_LOADED' && addonName === TALENT_UI_ADDON) {
            watcher.UnregisterAllEvents();
            addBlizzardTalentFrameButton(onClick);
        }
    });
}

function addBlizzardTalentFrameButton(onClick: () => void) {
    const button = CreateFrame('Button', undefined, _G['PlayerTalentFrame'], 'UIPanelButtonTemplate');
    button.SetSize(110, 22);
    button.SetPoint('TOPRIGHT', -40, -40);
    button.SetText('Hero Talents');
    button.SetScript('OnClick', onClick);
}
