local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New
local ____exports = {}
local ____RetailTalentFrame = require("TSAddons.talentui.addon.ui.RetailTalentFrame")
local RetailTalentFrame = ____RetailTalentFrame.RetailTalentFrame
local blizzardToggleTalentFrame = _G.ToggleTalentFrame
local talentFrame
--- The window is built on first use, once the player's talents are known.
local function getTalentFrame()
    if talentFrame == nil then
        talentFrame = __TS__New(RetailTalentFrame)
        talentFrame:addFooterButton("Classic View", blizzardToggleTalentFrame)
    end
    return talentFrame
end
_G.ToggleTalentFrame = function() return getTalentFrame():toggle() end
_G.TalentUI_AddFooterButton = function(text, onClick) return getTalentFrame():addFooterButton(text, onClick) end
return ____exports
