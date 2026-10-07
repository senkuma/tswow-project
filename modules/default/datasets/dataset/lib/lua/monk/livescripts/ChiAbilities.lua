local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local ____exports = {}
local isFree, touchOfDeathCanKill, BLACKOUT_KICK, COMBO_BREAKER, TOUCH_OF_DEATH_PLAYER_HEALTH_PCT
local ____ChiResource = require("livescripts.ChiResource")
local gainChi = ____ChiResource.gainChi
local isEnemy = ____ChiResource.isEnemy
local monkOf = ____ChiResource.monkOf
local moveChi = ____ChiResource.moveChi
local spendChi = ____ChiResource.spendChi
local ____SpellTags = require("livescripts.SpellTags")
local containsSpell = ____SpellTags.containsSpell
local forEachSpell = ____SpellTags.forEachSpell
function isFree(monk, spellId)
    return containsSpell(BLACKOUT_KICK, spellId) and monk:HasAura(COMBO_BREAKER[1])
end
function touchOfDeathCanKill(monk, targetObject)
    local target = targetObject:ToUnit()
    if target == nil then
        return false
    end
    local ____target_IsPlayer_result_0
    if target:IsPlayer() then
        ____target_IsPlayer_result_0 = target:GetHealthPct() <= TOUCH_OF_DEATH_PLAYER_HEALTH_PCT
    else
        ____target_IsPlayer_result_0 = target:GetHealth() <= monk:GetMaxHealth()
    end
    return ____target_IsPlayer_result_0
end
--- Mists of Pandaria Chi costs and gains, which WotLK spells cannot express:
-- spenders cost a fixed amount of Chi (they no longer require or consume
-- combo points), heals generate Chi though they hit no enemy to put combo
-- points on, and builders bring the Chi onto their target first, as combo
-- points added to another unit would replace it. Spell ids come from the
-- tags datascripts/abilities/Chi.ts writes; keep the tag names in step with it.
local CHI_COSTS = {
    {
        spells = {81814,82245},
        chi = 1
    },
    {
        spells = {81815,81854,81846,82244},
        chi = 2
    },
    {
        spells = {81857,81841,81848,81849,81850,81851},
        chi = 3
    }
}
local BUILDERS = {81802,81803,81804,81805,81806,81807,81808,81809,81810,81811,81812,81813,81845}
local GENERATES_ONE_CHI = {81817,81823,81824,81825,81826,81827,81828,81829,81830,81831,81832,81833,81834,81835,81836,81837,81838}
local TIGER_STANCE_BONUS = {81817}
local STANCE_OF_THE_FIERCE_TIGER = {81820}
BLACKOUT_KICK = {81815}
COMBO_BREAKER = {81858}
local TOUCH_OF_DEATH = {81841}
TOUCH_OF_DEATH_PLAYER_HEALTH_PCT = 10
function ____exports.registerChiAbilities(events)
    __TS__ArrayForEach(
        CHI_COSTS,
        function(____, ____bindingPattern0)
            local chi
            local spells
            spells = ____bindingPattern0.spells
            chi = ____bindingPattern0.chi
            return forEachSpell(
                spells,
                function(spellId)
                    events.Spell:OnCheckCast(
                        spellId,
                        function(spell, result)
                            local monk = monkOf(spell:GetCaster())
                            if monk == nil or result:get() ~= 255 then
                                return
                            end
                            if not isFree(monk, spellId) and monk:GetComboPoints() < chi then
                                result:set(78)
                            elseif containsSpell(TOUCH_OF_DEATH, spellId) and not touchOfDeathCanKill(
                                monk,
                                spell:GetTarget()
                            ) then
                                result:set(12)
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
                            if isFree(monk, spellId) then
                                monk:RemoveAura(COMBO_BREAKER[1])
                            else
                                spendChi(monk, chi)
                            end
                        end
                    )
                end
            )
        end
    )
    forEachSpell(
        BUILDERS,
        function(spellId) return events.Spell:OnCast(
            spellId,
            function(spell)
                local monk = monkOf(spell:GetCaster())
                local target = spell:GetTarget():ToUnit()
                if monk ~= nil and target ~= nil and isEnemy(monk, target) then
                    moveChi(monk, target)
                end
            end
        ) end
    )
    forEachSpell(
        GENERATES_ONE_CHI,
        function(spellId) return events.Spell:OnCast(
            spellId,
            function(spell)
                local monk = monkOf(spell:GetCaster())
                if monk == nil then
                    return
                end
                local stanceBonus = containsSpell(TIGER_STANCE_BONUS, spellId) and monk:HasAura(STANCE_OF_THE_FIERCE_TIGER[1])
                gainChi(monk, stanceBonus and 2 or 1)
            end
        ) end
    )
end
return ____exports
