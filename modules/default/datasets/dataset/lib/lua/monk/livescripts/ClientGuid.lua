local ____lualib = require("lualib_bundle")
local __TS__StringSubstring = ____lualib.__TS__StringSubstring
local __TS__StringCharAt = ____lualib.__TS__StringCharAt
local __TS__ParseInt = ____lualib.__TS__ParseInt
local ____exports = {}
____exports.PLAYER_HIGH_GUID = 0
local HEX_DIGITS = "0123456789abcdef"
--- Parses a GUID as the client's UnitGUID writes it: "0x" and 16 hex digits.
-- Creatures, pets and vehicles split them into a 4-digit high part, a
-- 6-digit entry and a 6-digit counter; players use the low 8 digits as counter.
function ____exports.parseClientGuid(text)
    local lower = string.lower(text)
    if #lower ~= 18 or __TS__StringSubstring(lower, 0, 2) ~= "0x" then
        return nil
    end
    local digits = __TS__StringSubstring(lower, 2)
    do
        local index = 0
        while index < #digits do
            if (string.find(
                HEX_DIGITS,
                __TS__StringCharAt(digits, index),
                nil,
                true
            ) or 0) - 1 < 0 then
                return nil
            end
            index = index + 1
        end
    end
    local high = __TS__ParseInt(
        __TS__StringSubstring(digits, 0, 4),
        16
    )
    return high == ____exports.PLAYER_HIGH_GUID and ({
        high = high,
        entry = 0,
        counter = __TS__ParseInt(
            __TS__StringSubstring(digits, 8),
            16
        )
    }) or ({
        high = high,
        entry = __TS__ParseInt(
            __TS__StringSubstring(digits, 4, 10),
            16
        ),
        counter = __TS__ParseInt(
            __TS__StringSubstring(digits, 10),
            16
        )
    })
end
return ____exports
