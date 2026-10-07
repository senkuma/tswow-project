--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
--- Helpers for the spell id lists TAG() returns.
function ____exports.forEachSpell(spells, action)
    do
        local index = 0
        while index < #spells do
            action(spells[index + 1])
            index = index + 1
        end
    end
end
function ____exports.containsSpell(spells, spellId)
    do
        local index = 0
        while index < #spells do
            if spells[index + 1] == spellId then
                return true
            end
            index = index + 1
        end
    end
    return false
end
return ____exports
