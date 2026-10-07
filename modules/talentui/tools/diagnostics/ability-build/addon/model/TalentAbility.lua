local ____lualib = require("lualib_bundle")
local Set = ____lualib.Set
local __TS__New = ____lualib.__TS__New
tstl_register_module(
    "TSAddons.talentui.addon.model.TalentAbility",
    function()
        local ____exports = {}
        local ____AbilityTalents = require("addon.model.AbilityTalents")
        local ABILITY_TALENTS = ____AbilityTalents.ABILITY_TALENTS
        local abilityTalents = __TS__New(Set, ABILITY_TALENTS)
        --- The Talent.dbc id in a talent's link ("|Htalent:<id>:<rank>|h").
        local function talentId(tab, index)
            local link = GetTalentLink(tab, index, false, false)
            if link == nil then
                return nil
            end
            local id = strmatch(link, "talent:(%d+)")
            local ____temp_0
            if id == nil then
                ____temp_0 = nil
            else
                ____temp_0 = tonumber(id)
            end
            return ____temp_0
        end
        --- Whether a talent teaches an ability, which retail draws as a square node.
        -- The talent API does not say, so the datascripts list those talents.
        function ____exports.teachesAbility(tab, index)
            local id = talentId(tab, index)
            return id ~= nil and abilityTalents:has(id)
        end
        return ____exports
    end
)
