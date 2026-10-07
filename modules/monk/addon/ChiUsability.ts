import { CHI_COSTS, COMBO_BREAKER, FREE_WITH_COMBO_BREAKER } from "./ChiSpells";
import { registerEvents } from "./Events";

/**
 * Greys out Chi spenders on the action bars while the monk lacks the Chi for
 * them, as the bars do for spells that cannot be cast. They cost no power,
 * so the client always counts them as usable; the server refuses them.
 */
const ACTION_BAR_BUTTONS = [
    'ActionButton', 'BonusActionButton', 'MultiBarBottomLeftButton', 'MultiBarBottomRightButton',
    'MultiBarRightButton', 'MultiBarLeftButton',
];
const BUTTONS_PER_BAR = 12;
// ActionButton_UpdateUsable's shade for actions that cannot be used.
const UNUSABLE_SHADE = 0.4;

interface ActionButton extends WoWAPI.Frame {
    action?: number;
}

// 3.3.5 returns an action's spell id fourth, after its spellbook slot; the declarations stop at three values.
const getActionInfo = GetActionInfo as unknown as
    (slot: number) => LuaMultiReturn<[string | undefined, unknown, unknown, number | undefined]>;
// 3.3.5's UnitBuff also finds a buff by name; the declarations only take an index.
const unitBuffByName = UnitBuff as unknown as (unit: string, name: string) => LuaMultiReturn<[string | undefined]>;
const isUsableAction = IsUsableAction as unknown as (slot: number) => LuaMultiReturn<[boolean, boolean]>;
// hooksecurefunc(name, hook) hooks a global function; the declarations only describe hooking a table's.
const hookGlobalFunction = hooksecurefunc as unknown as (name: string, hook: (button: ActionButton) => void) => void;

export function dimSpendersWithoutChi(currentChi: () => number, onChiChange: (listener: () => void) => void) {
    hookGlobalFunction('ActionButton_UpdateUsable', button => dimIfShortOfChi(button, currentChi()));
    onChiChange(refreshActionButtons);

    // Combo Breaker makes Blackout Kick free while it lasts.
    let comboBreakerActive = hasComboBreaker();
    const auraWatcher = CreateFrame('Frame');
    registerEvents(auraWatcher, ['UNIT_AURA']);
    auraWatcher.SetScript('OnEvent', (_, __, unit) => {
        if (unit === 'player' && hasComboBreaker() !== comboBreakerActive) {
            comboBreakerActive = !comboBreakerActive;
            refreshActionButtons();
        }
    });
}

function dimIfShortOfChi(button: ActionButton, chi: number) {
    if (button.action === undefined) {
        return;
    }
    const [kind, , , spellId] = getActionInfo(button.action);
    const cost = kind === 'spell' && spellId !== undefined ? CHI_COSTS[spellId] : undefined;
    // Actions the client already counts as unusable keep its shading.
    const [usable] = isUsableAction(button.action);
    if (cost === undefined || !usable || chi >= cost || isFree(spellId!)) {
        return;
    }
    const name = button.GetName();
    const icon: WoWAPI.Texture = _G[`${name}Icon`];
    const normalTexture: WoWAPI.Texture = _G[`${name}NormalTexture`];
    icon.SetVertexColor(UNUSABLE_SHADE, UNUSABLE_SHADE, UNUSABLE_SHADE);
    normalTexture.SetVertexColor(1, 1, 1);
}

function isFree(spellId: number) {
    return FREE_WITH_COMBO_BREAKER.indexOf(spellId) >= 0 && hasComboBreaker();
}

function hasComboBreaker() {
    const [buffName] = GetSpellInfo(COMBO_BREAKER);
    if (buffName === undefined) {
        return false;
    }
    const [found] = unitBuffByName('player', buffName);
    return found !== undefined;
}

/** Re-runs the bars' own usability update, which the hook above follows. */
function refreshActionButtons() {
    const updateUsable: (button: ActionButton) => void = _G['ActionButton_UpdateUsable'];
    ACTION_BAR_BUTTONS.forEach(prefix => {
        for (let index = 1; index <= BUTTONS_PER_BAR; index++) {
            const button: ActionButton | undefined = _G[`${prefix}${index}`];
            if (button !== undefined && button.action !== undefined) {
                updateUsable(button);
            }
        }
    });
}
