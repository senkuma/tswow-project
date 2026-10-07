import { CommandPanel } from "./CommandPanel";
import { createMinimapButton } from "./MinimapButton";

const panel = new CommandPanel();
const toggle = () => panel.toggle();

SlashCmdList['COMMANDPANEL'] = toggle;
_G['SLASH_COMMANDPANEL1'] = '/tools';
_G['SLASH_COMMANDPANEL2'] = '/commands';
createMinimapButton('Commands (/tools)', toggle);
