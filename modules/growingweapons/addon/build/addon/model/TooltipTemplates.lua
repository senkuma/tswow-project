local ____lualib = require("lualib_bundle")
local __TS__StringCharAt = ____lualib.__TS__StringCharAt
tstl_register_module(
    "TSAddons.growingweapons.addon.model.TooltipTemplates",
    function()
        local ____exports = {}
        local captureFor
        function captureFor(conversion)
            repeat
                local ____switch8 = conversion
                local ____cond8 = ____switch8 == "d"
                if ____cond8 then
                    return "(%d+)"
                end
                ____cond8 = ____cond8 or (____switch8 == "f" or ____switch8 == "g")
                if ____cond8 then
                    return "([%d%.]+)"
                end
                ____cond8 = ____cond8 or ____switch8 == "c"
                if ____cond8 then
                    return "(.)"
                end
                ____cond8 = ____cond8 or ____switch8 == "%"
                if ____cond8 then
                    return "%%"
                end
                do
                    return "(.-)"
                end
            until true
        end
        local LUA_PATTERN_MAGIC = "^$()%.[]*+-?"
        local FORMAT_FLAGS = "-+ #0123456789."
        --- A Lua pattern matching text written with a format string from GlobalStrings
        -- (such as DAMAGE_TEMPLATE, "%d - %d Damage"), capturing each formatted value.
        -- Matching through the client's own strings keeps it working in any locale.
        function ____exports.templatePattern(template)
            local pattern = "^"
            do
                local index = 0
                while index < #template do
                    local char = __TS__StringCharAt(template, index)
                    if char == "%" then
                        local ____end = index + 1
                        while ____end < #template and (string.find(
                            FORMAT_FLAGS,
                            __TS__StringCharAt(template, ____end),
                            nil,
                            true
                        ) or 0) - 1 >= 0 do
                            ____end = ____end + 1
                        end
                        pattern = pattern .. captureFor(__TS__StringCharAt(template, ____end))
                        index = ____end
                    else
                        local ____temp_0
                        if (string.find(LUA_PATTERN_MAGIC, char, nil, true) or 0) - 1 >= 0 then
                            ____temp_0 = "%" .. char
                        else
                            ____temp_0 = char
                        end
                        pattern = pattern .. ____temp_0
                    end
                    index = index + 1
                end
            end
            return pattern .. "$"
        end
        --- A weapon's damage range and damage per second with a flat bonus on every swing.
        function ____exports.grownDamage(baseMin, baseMax, bonus, speed)
            local min = baseMin + bonus
            local max = baseMax + bonus
            local ____min_2 = min
            local ____max_3 = max
            local ____temp_1
            if speed == nil or speed <= 0 then
                ____temp_1 = nil
            else
                ____temp_1 = (min + max) / 2 / speed
            end
            return {min = ____min_2, max = ____max_3, dps = ____temp_1}
        end
        return ____exports
    end
)
