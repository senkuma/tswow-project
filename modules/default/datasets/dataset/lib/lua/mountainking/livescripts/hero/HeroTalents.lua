local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArraySlice = ____lualib.__TS__ArraySlice
local __TS__ParseInt = ____lualib.__TS__ParseInt
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
local __TS__ArrayIndexOf = ____lualib.__TS__ArrayIndexOf
local ____exports = {}
local handleHeroCommand, parseNodeIndex, chooseTree, learnNode, forgetAllHeroTalents, reject, findTree, playerState, specializationOf, availableTreeKeys, sendStateIfMountainKing, sendState, send, HERO_COMMAND, ADDON_PREFIX, CHAT_MSG_WHISPER, MOUNTAIN_KING_CLASS, HERO_TREES, HERO_TREES_BY_SPEC, TALENT_TREES
local ____Commands = require("livescripts.Commands")
local commandWords = ____Commands.commandWords
local ____HeroRules = require("livescripts.hero.HeroRules")
local CAPSTONE_INDEX = ____HeroRules.CAPSTONE_INDEX
local chooseBlocker = ____HeroRules.chooseBlocker
local chosenTree = ____HeroRules.chosenTree
local heroPoints = ____HeroRules.heroPoints
local KEYSTONE_INDEX = ____HeroRules.KEYSTONE_INDEX
local learnBlocker = ____HeroRules.learnBlocker
local mainTalentTree = ____HeroRules.mainTalentTree
local NODES_PER_TREE = ____HeroRules.NODES_PER_TREE
local nodeState = ____HeroRules.nodeState
local spentPoints = ____HeroRules.spentPoints
function handleHeroCommand(player, args)
    local action = #args > 0 and args[1] or "sync"
    if action == "sync" then
        sendState(player)
    elseif action == "choose" and #args > 1 then
        chooseTree(player, args[2])
    elseif action == "learn" and #args > 2 then
        learnNode(
            player,
            args[2],
            parseNodeIndex(args[3])
        )
    elseif action == "reset" then
        forgetAllHeroTalents(player)
        player:SendBroadcastMessage("Your hero talents have been reset.")
        sendState(player)
    else
        player:SendBroadcastMessage(("Usage: ." .. HERO_COMMAND) .. " [sync | choose <tree> | learn <tree> <node> | reset]")
    end
end
function parseNodeIndex(text)
    local value = __TS__ParseInt(text)
    return value == value and value or nil
end
function chooseTree(player, treeKey)
    local tree = findTree(treeKey)
    if tree == nil then
        return reject(player, ("Unknown hero tree \"" .. treeKey) .. "\".")
    end
    local blocker = chooseBlocker(
        tree,
        HERO_TREES,
        availableTreeKeys(player),
        playerState(player)
    )
    if blocker ~= nil then
        return reject(player, blocker)
    end
    player:LearnSpell(tree.spells[KEYSTONE_INDEX + 1])
    player:SendBroadcastMessage(("You now follow the path of the " .. tree.name) .. ".")
    sendState(player)
end
function learnNode(player, treeKey, index)
    local tree = findTree(treeKey)
    if tree == nil or index == nil then
        return reject(player, "Unknown hero talent.")
    end
    local blocker = learnBlocker(
        tree,
        index,
        playerState(player)
    )
    if blocker ~= nil then
        return reject(player, blocker)
    end
    player:LearnSpell(tree.spells[index + 1])
    sendState(player)
end
function forgetAllHeroTalents(player)
    __TS__ArrayForEach(
        HERO_TREES,
        function(____, tree) return __TS__ArrayForEach(
            tree.spells,
            function(____, spell)
                if player:HasSpell(spell) then
                    player:RemoveSpell(spell, false, false)
                end
            end
        ) end
    )
end
function reject(player, reason)
    player:SendBroadcastMessage(reason)
    send(player, "ERR;" .. reason)
end
function findTree(key)
    for ____, tree in ipairs(HERO_TREES) do
        if tree.key == key then
            return tree
        end
    end
    return nil
end
function playerState(player)
    return {
        level = player:GetLevel(),
        knows = function(____, spell) return player:HasSpell(spell) end
    }
end
function specializationOf(player)
    local spec = player:GetActiveSpec()
    return mainTalentTree(__TS__ArrayMap(
        TALENT_TREES,
        function(____, tree)
            local points = 0
            __TS__ArrayForEach(
                tree.ranks,
                function(____, rankSpells, rankIndex) return __TS__ArrayForEach(
                    rankSpells,
                    function(____, spell)
                        if player:HasTalent(spell, spec) then
                            points = points + (rankIndex + 1)
                        end
                    end
                ) end
            )
            return {key = tree.key, points = points}
        end
    ))
end
function availableTreeKeys(player)
    local spec = specializationOf(player)
    return spec == nil and ({}) or HERO_TREES_BY_SPEC[spec]
end
function sendStateIfMountainKing(player)
    if player:GetClass() == MOUNTAIN_KING_CLASS then
        sendState(player)
    end
end
function sendState(player)
    local state = playerState(player)
    local chosen = chosenTree(HERO_TREES, state)
    local available = availableTreeKeys(player)
    local spec = specializationOf(player)
    send(player, "BEGIN")
    send(
        player,
        (((((("STATE;" .. tostring(state.level)) .. ";") .. tostring(heroPoints(state.level))) .. ";") .. tostring(chosen == nil and 0 or spentPoints(chosen, state))) .. ";") .. ((spec == nil and "-" or spec) .. ";") .. (chosen == nil and "-" or chosen.key)
    )
    __TS__ArrayForEach(
        HERO_TREES,
        function(____, tree)
            send(
                player,
                (((("TREE;" .. tree.key) .. ";") .. tree.name) .. ";") .. tostring(__TS__ArrayIndexOf(available, tree.key) == -1 and 0 or 1)
            )
            do
                local index = KEYSTONE_INDEX
                while index <= CAPSTONE_INDEX do
                    send(
                        player,
                        (((((("NODE;" .. tree.key) .. ";") .. tostring(index)) .. ";") .. tostring(tree.spells[index + 1])) .. ";") .. nodeState(tree, index, state)
                    )
                    index = index + 1
                end
            end
        end
    )
    send(player, "END")
end
function send(player, message)
    player:SendAddonMessage(ADDON_PREFIX, message, CHAT_MSG_WHISPER, player)
end
HERO_COMMAND = "mkhero"
ADDON_PREFIX = "MKHERO"
CHAT_MSG_WHISPER = 7
MOUNTAIN_KING_CLASS = 13
HERO_TREES = {
    {
        key = "stormcaller",
        name = "Stormcaller",
        spells = {81480,81481,81482,81483,81484,81485,81486,81487,81488,81489,81490,81491,81492,81493}
    },
    {
        key = "thane",
        name = "Thane of Ironforge",
        spells = {81494,81495,81496,81497,81498,81499,81500,81501,81502,81503,81504,81505,81506,81507}
    },
    {
        key = "wildhammer",
        name = "Wildhammer",
        spells = {81508,81509,81510,81511,81512,81513,81514,81515,81516,81517,81518,81519,81520,81521}
    }
}
HERO_TREES_BY_SPEC = {thunder = {"stormcaller", "wildhammer"}, hammer = {"stormcaller", "thane"}, mountain = {"thane", "wildhammer"}}
TALENT_TREES = {
    {
        key = "thunder",
        ranks = {
            {81293,81298,81303,81305,81308,81313,81316,81318,81321,81326,81329,81332,81334,81337,81274,81339,81342,81345,81348,81350,81275},
            {81294,81299,81304,81306,81309,81314,81317,81319,81322,81327,81330,81333,81335,81338,81340,81343,81346,81349,81351},
            {81295,81300,81307,81310,81315,81320,81323,81328,81331,81336,81341,81344,81347,81352},
            {81296,81301,81311,81324},
            {81297,81302,81312,81325}
        }
    },
    {
        key = "hammer",
        ranks = {
            {81353,81358,81363,81365,81370,81372,81375,81378,81380,81384,81393,81395,81279,81398,81400,81403,81406,81408,81288},
            {81354,81359,81364,81366,81371,81373,81376,81379,81381,81386,81394,81396,81399,81401,81404,81407,81409},
            {81355,81360,81367,81374,81377,81382,81388,81397,81402,81405,81410},
            {81356,81361,81368,81390},
            {81357,81362,81369,81392}
        }
    },
    {
        key = "mountain",
        ranks = {
            {81411,81416,81421,81426,81428,81431,81436,81439,81441,81444,81449,81451,81289,81454,81456,81459,81462,81465,81290},
            {81412,81417,81422,81427,81429,81432,81437,81440,81442,81445,81450,81452,81455,81457,81460,81463,81466},
            {81413,81418,81423,81430,81433,81438,81443,81446,81453,81458,81461,81464,81467},
            {81414,81419,81424,81434,81447},
            {81415,81420,81425,81435,81448}
        }
    }
}
function ____exports.registerHeroTalents(events)
    __TS__ArrayForEach(
        HERO_TREES,
        function(____, tree)
            if #tree.spells ~= NODES_PER_TREE then
                print(((((("[mountainking] Hero tree " .. tree.key) .. " has ") .. tostring(#tree.spells)) .. " spells, expected ") .. tostring(NODES_PER_TREE)) .. ".")
            end
        end
    )
    events.Player:OnCommand(function(player, command, found)
        local words = commandWords(command:get())
        if words[1] ~= HERO_COMMAND then
            return
        end
        found:set(true)
        if player:GetClass() ~= MOUNTAIN_KING_CLASS then
            player:SendBroadcastMessage("Only Mountain Kings have hero talents.")
            return
        end
        handleHeroCommand(
            player,
            __TS__ArraySlice(words, 1)
        )
    end)
    events.Player:OnLevelChanged(function(player) return sendStateIfMountainKing(player) end)
    events.Player:OnLogin(function(player) return sendStateIfMountainKing(player) end)
    events.Player:OnTalentsReset(function(player)
        if player:GetClass() == MOUNTAIN_KING_CLASS then
            forgetAllHeroTalents(player)
            sendState(player)
        end
    end)
end
return ____exports
