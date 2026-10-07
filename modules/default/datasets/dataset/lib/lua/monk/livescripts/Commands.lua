local ____lualib = require("lualib_bundle")
local __TS__StringTrim = ____lualib.__TS__StringTrim
local __TS__StringSubstring = ____lualib.__TS__StringSubstring
local ____exports = {}
--- Lowercased words of a chat command, without the "." or "!" prefix.
function ____exports.commandWords(text)
    local rest = string.lower(__TS__StringTrim(text))
    while __TS__StringSubstring(rest, 0, 1) == "." or __TS__StringSubstring(rest, 0, 1) == "!" do
        rest = __TS__StringSubstring(rest, 1)
    end
    local words = {}
    while #rest > 0 do
        local space = (string.find(rest, " ", nil, true) or 0) - 1
        local word = space == -1 and rest or __TS__StringSubstring(rest, 0, space)
        if #word > 0 then
            words[#words + 1] = word
        end
        rest = space == -1 and "" or __TS__StringSubstring(rest, space + 1)
    end
    return words
end
return ____exports
