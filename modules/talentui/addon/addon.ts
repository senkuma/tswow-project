import { RetailTalentFrame } from "./ui/RetailTalentFrame";

// Kept for the classic window; the talent micro button and key binding open talents through this global.
const blizzardToggleTalentFrame: () => void = _G['ToggleTalentFrame'];
let talentFrame: RetailTalentFrame | undefined;

/** The window is built on first use, once the player's talents are known. */
function getTalentFrame() {
    if (talentFrame === undefined) {
        talentFrame = new RetailTalentFrame();
        // Blizzard's window stays reachable for what this one leaves out, such as pet talents.
        talentFrame.addFooterButton('Classic View', blizzardToggleTalentFrame);
    }
    return talentFrame;
}

_G['ToggleTalentFrame'] = () => getTalentFrame().toggle();

/** Lets other addons add a button to the window, e.g. the Mountain King's hero talents. */
_G['TalentUI_AddFooterButton'] = (text: string, onClick: () => void) =>
    getTalentFrame().addFooterButton(text, onClick);
