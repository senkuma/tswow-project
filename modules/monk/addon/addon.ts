import { ChiBar } from "./ChiBar";
import { showChiErrors } from "./ChiErrors";
import { moveChiWithTarget } from "./ChiFollowsTarget";
import { showChiCostsInTooltips } from "./ChiTooltip";
import { dimSpendersWithoutChi } from "./ChiUsability";

// UnitClass returns several values, but its declaration types them as an array.
const unitClass = UnitClass as unknown as (unit: string) => LuaMultiReturn<[string, string, number]>;

// The addon loads with the game UI for every character; only monks have Chi.
const [, classFile] = unitClass('player');
if (classFile === 'MONK') {
    const chiBar = new ChiBar();
    moveChiWithTarget(() => chiBar.chi);
    showChiErrors();
    dimSpendersWithoutChi(() => chiBar.chi, listener => chiBar.onChange(listener));
    showChiCostsInTooltips();
    // Chi shows under the player frame, as in retail, rather than as combo points beside the target.
    const comboFrame: WoWAPI.Frame = _G['ComboFrame'];
    comboFrame.UnregisterAllEvents();
    comboFrame.Hide();
}
