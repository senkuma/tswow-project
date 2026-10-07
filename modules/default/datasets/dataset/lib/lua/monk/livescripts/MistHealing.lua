local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local ____exports = {}
local upliftTargets, hasRenewingMistFrom, RENEWING_MIST, UPLIFT_RANGE
local ____ChiResource = require("livescripts.ChiResource")
local monkOf = ____ChiResource.monkOf
local sameUnit = ____ChiResource.sameUnit
local ____SpellTags = require("livescripts.SpellTags")
local forEachSpell = ____SpellTags.forEachSpell
function upliftTargets(monk)
    local candidates = {monk}
    local group = monk:GetGroup()
    if group ~= nil then
        local members = group:GetMembers()
        do
            local index = 0
            while index < #members do
                if not sameUnit(members[index + 1], monk) then
                    candidates[#candidates + 1] = members[index + 1]
                end
                index = index + 1
            end
        end
    end
    return __TS__ArrayFilter(
        candidates,
        function(____, member) return member:IsAlive() and monk:IsWithinDistInMap(member, UPLIFT_RANGE, true) and hasRenewingMistFrom(member, monk) end
    )
end
function hasRenewingMistFrom(unit, monk)
    do
        local index = 0
        while index < #RENEWING_MIST do
            if unit:HasAura(
                RENEWING_MIST[index + 1],
                monk:GetGUID()
            ) then
                return true
            end
            index = index + 1
        end
    end
    return false
end
--- Uplift (datascripts/abilities/MistAbilities.ts) heals the monk and every
-- group member within range who has the monk's Renewing Mist, and cannot be
-- cast while nobody has it.
local UPLIFT = {82244}
local UPLIFT_HEAL = {82243}
RENEWING_MIST = {81824,81825,81826,81827,81828,81829,81830,81831,81832,81833,81834,81835,81836,81837,81838}
UPLIFT_RANGE = 40
function ____exports.registerMistHealing(events)
    forEachSpell(
        UPLIFT,
        function(spellId)
            events.Spell:OnCheckCast(
                spellId,
                function(spell, result)
                    local monk = monkOf(spell:GetCaster())
                    if monk ~= nil and result:get() == 255 and #upliftTargets(monk) == 0 then
                        result:set(12)
                    end
                end
            )
            events.Spell:OnCast(
                spellId,
                function(spell)
                    local monk = monkOf(spell:GetCaster())
                    if monk ~= nil then
                        __TS__ArrayForEach(
                            upliftTargets(monk),
                            function(____, target) return monk:CastSpell(target, UPLIFT_HEAL[1], true) end
                        )
                    end
                end
            )
        end
    )
end
return ____exports
