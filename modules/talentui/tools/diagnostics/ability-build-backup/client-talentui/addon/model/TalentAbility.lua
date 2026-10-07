local ____lualib = require("lualib_bundle")
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
tstl_register_module(
    "TSAddons.talentui.addon.model.TalentAbility",
    function()
        local ____exports = {}
        local SCANNER_NAME = "TSWoWTalentScanTooltip"
        local scanner
        local abilities = __TS__New(Map)
        local function tooltipLine(side, line)
            local fontString = _G[((SCANNER_NAME .. "Text") .. side) .. tostring(line)]
            local ____temp_0
            if fontString ~= nil and fontString:IsShown() then
                ____temp_0 = fontString:GetText()
            else
                ____temp_0 = nil
            end
            return ____temp_0
        end
        --- Whether a talent teaches an ability, which retail draws as a square node.
        -- The 3.3.5 talent API does not say, but an ability's tooltip has cost,
        -- range or cast time lines (often with right-hand text) that passives lack.
        -- Talents never change during a session, so answers are cached.
        function ____exports.teachesAbility(tab, index, talentGroup)
            local key = (tostring(tab) .. ":") .. tostring(index)
            local known = abilities:get(key)
            if known ~= nil then
                return known
            end
            if scanner == nil then
                scanner = CreateFrame("GameTooltip", SCANNER_NAME, UIParent, "GameTooltipTemplate")
            end
            scanner:SetOwner(WorldFrame, "ANCHOR_NONE")
            scanner:SetTalent(
                tab,
                index,
                false,
                false,
                talentGroup,
                false
            )
            local ability = false
            do
                local line = 2
                while line <= scanner:NumLines() and not ability do
                    local left = tooltipLine("Left", line) or ""
                    ability = tooltipLine("Right", line) ~= nil or (string.find(left, "Instant", nil, true) or 0) - 1 == 0 or (string.find(left, " cast", nil, true) or 0) - 1 ~= -1 or (string.find(left, "Channeled", nil, true) or 0) - 1 == 0
                    line = line + 1
                end
            end
            scanner:Hide()
            abilities:set(key, ability)
            return ability
        end
        return ____exports
    end
)
