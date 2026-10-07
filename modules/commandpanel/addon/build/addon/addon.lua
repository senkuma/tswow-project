local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New
local ____exports = {}
local ____CommandPanel = require("TSAddons.commandpanel.addon.CommandPanel")
local CommandPanel = ____CommandPanel.CommandPanel
local ____MinimapButton = require("TSAddons.commandpanel.addon.MinimapButton")
local createMinimapButton = ____MinimapButton.createMinimapButton
local panel = __TS__New(CommandPanel)
local function toggle()
    return panel:toggle()
end
SlashCmdList.COMMANDPANEL = toggle
_G.SLASH_COMMANDPANEL1 = "/tools"
_G.SLASH_COMMANDPANEL2 = "/commands"
createMinimapButton("Commands (/tools)", toggle)
return ____exports
