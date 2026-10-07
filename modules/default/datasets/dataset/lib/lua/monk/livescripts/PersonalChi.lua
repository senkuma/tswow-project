local ____lualib = require("lualib_bundle")
local __TS__Delete = ____lualib.__TS__Delete
local ____exports = {}
local unitFromClientGuid
local ____ChiResource = require("livescripts.ChiResource")
local chiHolder = ____ChiResource.chiHolder
local chiHolderFor = ____ChiResource.chiHolderFor
local monkOf = ____ChiResource.monkOf
local moveChi = ____ChiResource.moveChi
local sameUnit = ____ChiResource.sameUnit
local ____ClientGuid = require("livescripts.ClientGuid")
local parseClientGuid = ____ClientGuid.parseClientGuid
local PLAYER_HIGH_GUID = ____ClientGuid.PLAYER_HIGH_GUID
local ____Commands = require("livescripts.Commands")
local commandWords = ____Commands.commandWords
function unitFromClientGuid(monk, text)
    local parts = parseClientGuid(text)
    if parts == nil then
        return nil
    end
    local guid = parts.high == PLAYER_HIGH_GUID and CreateGUID(PLAYER_HIGH_GUID, parts.counter) or CreateGUID(parts.high, parts.entry, parts.counter)
    return monk:GetUnit(guid)
end
--- Keeps the monk's Chi with them, as in retail, though WotLK combo points
-- belong to a single unit: switching targets would leave them behind, and
-- the holder's death would clear them.
-- 
-- - The monk addon sends `.monkchi <target GUID>` when the monk targets an
--   enemy, and `.monkchi self` otherwise; the Chi then moves onto that enemy,
--   where the client lets abilities spend it, or onto the monk. The GUID
--   comes along because the client reports the new selection in a separate
--   packet, which may arrive later.
-- - Chi on a creature that dies is put back on the monk's next enemy, or on
--   the monk.
local MOVE_COMMAND = "monkchi"
local MOVE_TO_SELF = "self"
local chiThroughDeath = {}
function ____exports.registerPersonalChi(events)
    events.Player:OnCommand(function(player, command, found)
        local words = commandWords(command:get())
        if words[1] ~= MOVE_COMMAND then
            return
        end
        found:set(true)
        local monk = monkOf(player)
        if monk == nil then
            return
        end
        if words[2] == MOVE_TO_SELF then
            moveChi(monk, monk)
            return
        end
        local ____temp_0
        if #words > 1 then
            ____temp_0 = unitFromClientGuid(monk, words[2])
        else
            ____temp_0 = monk:GetSelection()
        end
        local target = ____temp_0
        if target ~= nil then
            moveChi(
                monk,
                chiHolderFor(monk, target)
            )
        end
    end)
    events.Unit:OnDeathEarly(function(victim, killer)
        local monk = monkOf(killer)
        local ____temp_1
        if monk == nil then
            ____temp_1 = nil
        else
            ____temp_1 = chiHolder(monk)
        end
        local holder = ____temp_1
        if monk ~= nil and holder ~= nil and sameUnit(holder, victim) then
            chiThroughDeath[monk:GetGUIDLow()] = monk:GetComboPoints()
        end
    end)
    events.Unit:OnDeath(function(_, killer)
        local monk = monkOf(killer)
        local ____temp_2
        if monk == nil then
            ____temp_2 = nil
        else
            ____temp_2 = chiThroughDeath[monk:GetGUIDLow()]
        end
        local chi = ____temp_2
        if monk == nil or chi == nil then
            return
        end
        __TS__Delete(
            chiThroughDeath,
            monk:GetGUIDLow()
        )
        monk:AddComboPoints(
            chiHolderFor(
                monk,
                monk:GetSelection()
            ),
            chi
        )
    end)
end
return ____exports
