--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local ____Commands = require("livescripts.Commands")
local commandWords = ____Commands.commandWords
local GEAR_COMMAND = "monkgear"
local SET_LABEL = "Battlegear of the Jade Serpent"
local MIN_GM_RANK = 1
--- `.monkgear`: adds the Battlegear of the Jade Serpent and its weapons to the player's bags.
function ____exports.registerGearCommand(events)
    events.Player:OnCommand(function(player, command, found)
        if commandWords(command:get())[1] ~= GEAR_COMMAND then
            return
        end
        found:set(true)
        if player:GetGMRank() < MIN_GM_RANK then
            player:SendBroadcastMessage("Only game masters can use this command.")
            return
        end
        local items = {60034,60035,60036,60037,60038,60039,60040,60041,60042,60043}
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
