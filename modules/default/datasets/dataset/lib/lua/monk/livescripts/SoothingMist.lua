--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local channeledSoothingMist, resumeChannel, SOOTHING_MIST, RESUME
local ____ChiResource = require("livescripts.ChiResource")
local gainChi = ____ChiResource.gainChi
local monkOf = ____ChiResource.monkOf
local ____SpellTags = require("livescripts.SpellTags")
local containsSpell = ____SpellTags.containsSpell
local forEachSpell = ____SpellTags.forEachSpell
function channeledSoothingMist(monk)
    local channel = monk:GetCurrentSpell(2)
    if channel == nil or not containsSpell(
        SOOTHING_MIST,
        channel:GetEntry()
    ) then
        return nil
    end
    local targetObject = channel:GetTarget()
    local ____targetObject_IsNull_result_2
    if targetObject:IsNull() then
        ____targetObject_IsNull_result_2 = nil
    else
        ____targetObject_IsNull_result_2 = targetObject:ToUnit()
    end
    local target = ____targetObject_IsNull_result_2
    local ____temp_3
    if target == nil then
        ____temp_3 = nil
    else
        ____temp_3 = target:GetAura(
            channel:GetEntry(),
            monk:GetGUID()
        )
    end
    local aura = ____temp_3
    if target == nil or aura == nil then
        return nil
    end
    return {
        spellId = channel:GetEntry(),
        target = target:GetGUID(),
        elapsedMs = aura:GetMaxDuration() - aura:GetDuration(),
        remainingMs = aura:GetDuration()
    }
end
function resumeChannel(monk, channel)
    local target = monk:GetUnit(channel.target)
    if target == nil or not target:IsAlive() or monk:IsCasting() then
        return
    end
    monk:CastCustomSpell(monk, RESUME[1], true, -channel.elapsedMs)
    monk:CastSpell(target, channel.spellId, true)
    monk:RemoveAura(RESUME[1])
end
SOOTHING_MIST = {82242}
local WEAVES = {81823,81848,81849,81850,81851}
RESUME = {82248}
local SOOTHING_MIST_CHI_CHANCE = 0.3
--- Less than one tick of healing left is not worth a new channel.
local MIN_RESUMED_MS = 1000
--- By monk: the channel their heal will interrupt, from the heal's cast check to its cast.
local channelsBeingWoven = {}
function ____exports.registerSoothingMist(events)
    forEachSpell(
        SOOTHING_MIST,
        function(spellId) return events.Spell:OnTick(
            spellId,
            function(effect)
                local monk = monkOf(effect:GetCaster())
                if monk ~= nil and math.random() < SOOTHING_MIST_CHI_CHANCE then
                    gainChi(monk, 1)
                end
            end
        ) end
    )
    forEachSpell(
        WEAVES,
        function(spellId)
            events.Spell:OnCheckCast(
                spellId,
                function(spell, result)
                    local monk = monkOf(spell:GetCaster())
                    if monk ~= nil then
                        local ____temp_1 = monk:GetGUIDLow()
                        local ____temp_0
                        if result:get() == 255 then
                            ____temp_0 = channeledSoothingMist(monk)
                        else
                            ____temp_0 = nil
                        end
                        channelsBeingWoven[____temp_1] = ____temp_0
                    end
                end
            )
            events.Spell:OnCast(
                spellId,
                function(spell)
                    local monk = monkOf(spell:GetCaster())
                    if monk == nil then
                        return
                    end
                    local channel = channelsBeingWoven[monk:GetGUIDLow()]
                    channelsBeingWoven[monk:GetGUIDLow()] = nil
                    if channel ~= nil and channel.remainingMs >= MIN_RESUMED_MS then
                        monk:AddTimer(
                            0,
                            function(owner)
                                local player = owner:ToPlayer()
                                if player ~= nil then
                                    resumeChannel(player, channel)
                                end
                            end
                        )
                    end
                end
            )
        end
    )
end
return ____exports
