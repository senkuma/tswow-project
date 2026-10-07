local ____lualib = require("lualib_bundle")
local __TS__New = ____lualib.__TS__New
local ____exports = {}
local ____WeaponProgress = require("TSAddons.growingweapons.addon.model.WeaponProgress")
local ADDON_PREFIX = ____WeaponProgress.ADDON_PREFIX
local WeaponProgressStore = ____WeaponProgress.WeaponProgressStore
local ____LevelUpToast = require("TSAddons.growingweapons.addon.ui.LevelUpToast")
local LevelUpToast = ____LevelUpToast.LevelUpToast
local ____TooltipProgress = require("TSAddons.growingweapons.addon.ui.TooltipProgress")
local TooltipProgress = ____TooltipProgress.TooltipProgress
local SYNC_COMMAND = ".growingweapon sync"
local store = __TS__New(WeaponProgressStore)
local tooltips = __TS__New(
    TooltipProgress,
    function(item) return store:stateOf(item) end
)
local toast = __TS__New(LevelUpToast)
local events = CreateFrame("Frame")
events:RegisterEvent("CHAT_MSG_ADDON")
events:RegisterEvent("PLAYER_ENTERING_WORLD")
events:SetScript(
    "OnEvent",
    function(_, event, prefix, message)
        if event == "PLAYER_ENTERING_WORLD" then
            events:UnregisterEvent("PLAYER_ENTERING_WORLD")
            SendChatMessage(SYNC_COMMAND, "SAY")
        elseif event == "CHAT_MSG_ADDON" and prefix == ADDON_PREFIX then
            local update = store:apply(message)
            local ____update_kind_0 = update
            if ____update_kind_0 ~= nil then
                ____update_kind_0 = ____update_kind_0.kind
            end
            if ____update_kind_0 == "state" then
                tooltips:refresh(update.state)
            else
                local ____update_kind_2 = update
                if ____update_kind_2 ~= nil then
                    ____update_kind_2 = ____update_kind_2.kind
                end
                if ____update_kind_2 == "levelUp" then
                    toast:show(update.levelUp)
                end
            end
        end
    end
)
return ____exports
