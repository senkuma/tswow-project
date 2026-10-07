local ____lualib = require("lualib_bundle")
local __TS__StringTrim = ____lualib.__TS__StringTrim
local __TS__StringSubstring = ____lualib.__TS__StringSubstring
local ____exports = {}
local commandName
function commandName(text)
    local name = string.lower(__TS__StringTrim(text))
    while __TS__StringSubstring(name, 0, 1) == "." or __TS__StringSubstring(name, 0, 1) == "!" do
        name = __TS__StringSubstring(name, 1)
    end
    return name
end
local GEAR_COMMAND = "maraudergear"
local SET_LABEL = "Dreadcorsair Battlegear"
local MIN_GM_RANK = 1
--- `.maraudergear`: adds the Dreadcorsair Battlegear and its weapons to the player's bags.
function ____exports.registerGearCommand(events)
    events.Player:OnCommand(function(player, command, found)
        if commandName(command:get()) ~= GEAR_COMMAND then
            return
        end
        found:set(true)
        if player:GetGMRank() < MIN_GM_RANK then
            player:SendBroadcastMessage("Only game masters can use this command.")
            return
        end
        local items = {60022,60023,60024,60025,60026,60027,60028,60029,60030,60031,60032}
        local missing = 0
        do
            local i = 0
            while i < #items do
                if player:AddItem(items[i + 1], 1) == nil then
                    missing = missing + 1
                end
                i = i + 1
            end
        end
        player:SendBroadcastMessage(missing > 0 and ((((SET_LABEL .. ": ") .. tostring(missing)) .. " of ") .. tostring(#items)) .. " items did not fit. Free up bag space and try again." or ((SET_LABEL .. ": added ") .. tostring(#items)) .. " items to your bags.")
    end)
end
return ____exports
