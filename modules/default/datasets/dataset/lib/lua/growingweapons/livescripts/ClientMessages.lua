local ____lualib = require("lualib_bundle")
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
local ____exports = {}
local send, ADDON_PREFIX, CHAT_MSG_WHISPER
local ____GrowthRules = require("livescripts.GrowthRules")
local experienceToNextLevel = ____GrowthRules.experienceToNextLevel
local levelCap = ____GrowthRules.levelCap
function send(player, message)
    player:SendAddonMessage(ADDON_PREFIX, message, CHAT_MSG_WHISPER, player)
end
ADDON_PREFIX = "GROWWPN"
CHAT_MSG_WHISPER = 7
function ____exports.sendState(player, weapon, progress)
    local maxLevel = #weapon.levels
    local atMax = progress.level >= maxLevel
    local fields = {
        "STATE",
        tostring(weapon.item),
        tostring(progress.level),
        tostring(maxLevel),
        tostring(progress.experience),
        tostring(atMax and 0 or experienceToNextLevel(progress.level)),
        tostring(levelCap(
            maxLevel,
            player:GetLevel()
        )),
        table.concat(weapon.bonuses, ","),
        table.concat(weapon.levels[progress.level].amounts, ","),
        atMax and "" or table.concat(weapon.levels[progress.level + 1].amounts, ",")
    }
    send(
        player,
        table.concat(fields, ";")
    )
end
function ____exports.sendLevelUp(player, weapon, fromLevel, toLevel)
    local before = weapon.levels[fromLevel].amounts
    local gains = __TS__ArrayMap(
        weapon.levels[toLevel].amounts,
        function(____, amount, index) return amount - before[index + 1] end
    )
    send(
        player,
        (((("LEVELUP;" .. tostring(weapon.item)) .. ";") .. tostring(toLevel)) .. ";") .. table.concat(gains, ",")
    )
end
return ____exports
