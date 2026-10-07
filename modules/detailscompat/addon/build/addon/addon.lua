--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local ____ClassTables = require("TSAddons.detailscompat.addon.ClassTables")
local addClassesToDetails = ____ClassTables.addClassesToDetails
local addColorStrings = ____ClassTables.addColorStrings
local ____Specializations = require("TSAddons.detailscompat.addon.Specializations")
local forgetUnknownSpecs = ____Specializations.forgetUnknownSpecs
local wrapSpecializationInfo = ____Specializations.wrapSpecializationInfo
--- Makes the Details! damage meter work with this server's custom classes:
-- Details keeps its own tables of class colors, icons and specializations,
-- and a class missing from them is a Lua error.
local DETAILS_ADDON = "Details"
--- Details copies its class tables from the profile, after loading its combats, whenever it applies one.
local function fitToProfile(details)
    addClassesToDetails(details)
    forgetUnknownSpecs(details)
end
local function patchDetails(details)
    wrapSpecializationInfo(_G.DetailsFramework)
    fitToProfile(details)
    hooksecurefunc(
        details,
        "ApplyProfile",
        function() return fitToProfile(details) end
    )
end
addColorStrings()
local loadedDetails = _G._detalhes
if loadedDetails ~= nil then
    patchDetails(loadedDetails)
else
    local watcher = CreateFrame("Frame")
    watcher:RegisterEvent("ADDON_LOADED")
    watcher:SetScript(
        "OnEvent",
        function(_, __, addonName)
            local details = _G._detalhes
            if addonName == DETAILS_ADDON and details ~= nil then
                watcher:UnregisterAllEvents()
                patchDetails(details)
            end
        end
    )
end
return ____exports
