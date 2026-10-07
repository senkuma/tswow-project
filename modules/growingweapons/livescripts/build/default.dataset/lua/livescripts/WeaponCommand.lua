local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ParseInt = ____lualib.__TS__ParseInt
local __TS__Number = ____lualib.__TS__Number
local __TS__NumberIsNaN = ____lualib.__TS__NumberIsNaN
local ____exports = {}
local addWeapons, grantExperience, USAGE
local ____ClientMessages = require("livescripts.ClientMessages")
local sendState = ____ClientMessages.sendState
local ____Commands = require("livescripts.Commands")
local commandWords = ____Commands.commandWords
local ____GrowingWeaponData = require("livescripts.GrowingWeaponData")
local GROWING_WEAPONS = ____GrowingWeaponData.GROWING_WEAPONS
local ____ProgressStore = require("livescripts.ProgressStore")
local progressOf = ____ProgressStore.progressOf
local ____WeaponGrowth = require("livescripts.WeaponGrowth")
local addExperience = ____WeaponGrowth.addExperience
local forEachOwnedWeapon = ____WeaponGrowth.forEachOwnedWeapon
function addWeapons(player)
    local added = 0
    __TS__ArrayForEach(
        GROWING_WEAPONS,
        function(____, weapon)
            local template = GetItemTemplate(weapon.item)
            local usable = template ~= nil and template:GetAllowableClass() & player:GetClassMask() ~= 0
            if usable and not player:HasItem(weapon.item, 1, true) and player:AddItem(weapon.item, 1) ~= nil then
                added = added + 1
            end
        end
    )
    player:SendBroadcastMessage(added > 0 and ((("Added " .. tostring(added)) .. " growing weapon") .. (added == 1 and "" or "s")) .. " to your bags." or "You already have every growing weapon your class can use, or your bags are full.")
    forEachOwnedWeapon(
        player,
        function(item, weapon) return sendState(
            player,
            weapon,
            progressOf(item)
        ) end
    )
end
function grantExperience(player, amountText)
    local amount = __TS__ParseInt(amountText, 10)
    if __TS__NumberIsNaN(__TS__Number(amount)) or amount <= 0 then
        player:SendBroadcastMessage(USAGE)
        return
    end
    local weapons = 0
    forEachOwnedWeapon(
        player,
        function(item, weapon)
            addExperience(player, item, weapon, amount)
            weapons = weapons + 1
        end
    )
    if weapons == 0 then
        player:SendBroadcastMessage("You have no growing weapon.")
    end
end
local COMMAND = "growingweapon"
local MIN_GM_RANK = 1
USAGE = ("Usage: ." .. COMMAND) .. " [sync | add | xp <amount>]"
--- `.growingweapon sync` sends the player's weapon progress to the addon, which
-- asks for it on login. Game masters can also `add` the growing weapons their
-- class can use and give their equipped or carried ones `xp`.
function ____exports.registerWeaponCommand(events)
    events.Player:OnCommand(function(player, command, found)
        local words = commandWords(command:get())
        if words[1] ~= COMMAND then
            return
        end
        found:set(true)
        local action = #words > 1 and words[2] or "sync"
        if action == "sync" then
            forEachOwnedWeapon(
                player,
                function(item, weapon) return sendState(
                    player,
                    weapon,
                    progressOf(item)
                ) end
            )
        elseif player:GetGMRank() < MIN_GM_RANK then
            player:SendBroadcastMessage("Only game masters can use this command.")
        elseif action == "add" then
            addWeapons(player)
        elseif action == "xp" and #words > 2 then
            grantExperience(player, words[3])
        else
            player:SendBroadcastMessage(USAGE)
        end
    end)
end
return ____exports
