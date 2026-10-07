--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local giveItems
local ____Commands = require("livescripts.Commands")
local commandWords = ____Commands.commandWords
function giveItems(player, setLabel, items)
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
    if missing > 0 then
        player:SendBroadcastMessage(((((setLabel .. ": ") .. tostring(missing)) .. " of ") .. tostring(#items)) .. " items did not fit. Free up bag space and try again.")
    else
        player:SendBroadcastMessage(((setLabel .. ": added ") .. tostring(#items)) .. " items to your bags.")
    end
end
local GEAR_COMMAND = "mountainkinggear"
local MIN_GM_RANK = 1
--- `.mountainkinggear [battlegear|titanstorm]`: adds a Mountain King gear set to the player's bags.
function ____exports.registerGearCommand(events)
    events.Player:OnCommand(function(player, command, found)
        local words = commandWords(command:get())
        if words[1] ~= GEAR_COMMAND then
            return
        end
        found:set(true)
        if player:GetGMRank() < MIN_GM_RANK then
            player:SendBroadcastMessage("Only game masters can use this command.")
            return
        end
        local setName = #words > 1 and words[2] or "battlegear"
        if setName == "battlegear" then
            giveItems(
                player,
                "Battlegear of the Mountain King",
                {60000,60001,60002,60003,60004,60005,60006,60007,60008,60009,60010}
            )
        elseif setName == "titanstorm" then
            giveItems(
                player,
                "Titanstorm Battlegear",
                {60011,60012,60013,60014,60015,60016,60017,60018,60019,60020,60021}
            )
        else
            player:SendBroadcastMessage(((("Unknown set \"" .. setName) .. "\". Use .") .. GEAR_COMMAND) .. " [battlegear|titanstorm].")
        end
    end)
end
return ____exports
