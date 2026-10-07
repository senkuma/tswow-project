--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.TooltipStats",
    function()
        local ____exports = {}
        local readLines, writeLines, textColor, setColor, line
        local ____TooltipLines = require("TSAddons.growingweapons.addon.model.TooltipLines")
        local growTooltipLines = ____TooltipLines.growTooltipLines
        function readLines(tooltip)
            local lines = {}
            do
                local index = 1
                while index <= tooltip:NumLines() do
                    local left = line(tooltip, "Left", index)
                    local right = line(tooltip, "Right", index)
                    local ____temp_1 = left:GetText() or ""
                    local ____textColor_result_2 = textColor(left)
                    local ____right_IsShown_result_0
                    if right:IsShown() then
                        ____right_IsShown_result_0 = right:GetText()
                    else
                        ____right_IsShown_result_0 = nil
                    end
                    lines[#lines + 1] = {
                        left = ____temp_1,
                        leftColor = ____textColor_result_2,
                        right = ____right_IsShown_result_0,
                        rightColor = textColor(right)
                    }
                    index = index + 1
                end
            end
            return lines
        end
        function writeLines(tooltip, lines, shownCount)
            do
                local count = shownCount
                while count < #lines do
                    tooltip:AddLine(" ")
                    count = count + 1
                end
            end
            do
                local index = 2
                while index <= math.max(#lines, shownCount) do
                    local content = lines[index]
                    local left = line(tooltip, "Left", index)
                    local right = line(tooltip, "Right", index)
                    left:SetText(content == nil and " " or content.left)
                    if content ~= nil then
                        setColor(left, content.leftColor)
                    end
                    if content ~= nil and content.right ~= nil then
                        right:SetText(content.right)
                        setColor(right, content.rightColor or content.leftColor)
                        right:Show()
                    else
                        right:Hide()
                    end
                    index = index + 1
                end
            end
        end
        function textColor(text)
            local r, g, b = text:GetTextColor()
            return {r, g, b}
        end
        function setColor(text, ____bindingPattern0)
            local b
            local g
            local r
            r = ____bindingPattern0[1]
            g = ____bindingPattern0[2]
            b = ____bindingPattern0[3]
            text:SetTextColor(r, g, b)
        end
        function line(tooltip, side, index)
            return _G[((tooltip:GetName() .. "Text") .. side) .. tostring(index)]
        end
        --- Writes the weapon's grown power into the item's own tooltip lines. The
        -- client builds those from the item's template, which cannot change per
        -- weapon; the server applies the same bonuses through the level enchantment.
        function ____exports.showGrownStats(tooltip, state)
            local lines = readLines(tooltip)
            writeLines(
                tooltip,
                growTooltipLines(
                    lines,
                    state,
                    function(name) return _G[name] end
                ),
                #lines
            )
            tooltip:Show()
        end
        return ____exports
    end
)
