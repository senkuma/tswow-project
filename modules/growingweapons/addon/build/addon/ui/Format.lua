local ____lualib = require("lualib_bundle")
local __TS__StringCharAt = ____lualib.__TS__StringCharAt
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.Format",
    function()
        local ____exports = {}
        --- Whole numbers with thousands separators: 12345 -> "12,345".
        function ____exports.formatNumber(value)
            local digits = tostring(math.floor(value))
            local formatted = ""
            do
                local index = 0
                while index < #digits do
                    if index > 0 and (#digits - index) % 3 == 0 then
                        formatted = formatted .. ","
                    end
                    formatted = formatted .. __TS__StringCharAt(digits, index)
                    index = index + 1
                end
            end
            return formatted
        end
        --- "+12 Agility".
        function ____exports.formatBonus(amount, label)
            return (("+" .. ____exports.formatNumber(amount)) .. " ") .. label
        end
        ____exports.COLORS = {
            gold = {1, 0.82, 0},
            artifact = {0.9, 0.8, 0.5},
            white = {1, 1, 1},
            green = {0.25, 1, 0.25},
            gray = {0.6, 0.6, 0.6},
            orange = {1, 0.55, 0.25}
        }
        function ____exports.setTextColor(text, ____bindingPattern0)
            local b
            local g
            local r
            r = ____bindingPattern0[1]
            g = ____bindingPattern0[2]
            b = ____bindingPattern0[3]
            text:SetTextColor(r, g, b)
        end
        return ____exports
    end
)
