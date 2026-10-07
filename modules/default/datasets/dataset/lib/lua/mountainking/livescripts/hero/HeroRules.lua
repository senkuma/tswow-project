local ____lualib = require("lualib_bundle")
local __TS__ArrayIndexOf = ____lualib.__TS__ArrayIndexOf
local ____exports = {}
____exports.ROW_KINDS = {
    "pair",
    "choice",
    "pair",
    "choice",
    "pair",
    "choice"
}
____exports.NODES_PER_TREE = 2 + #____exports.ROW_KINDS * 2
____exports.KEYSTONE_INDEX = 0
____exports.CAPSTONE_INDEX = ____exports.NODES_PER_TREE - 1
____exports.FIRST_HERO_LEVEL = 71
____exports.MAX_HERO_POINTS = 10
--- One hero point per level from 71, ten at 80.
function ____exports.heroPoints(level)
    return math.max(
        0,
        math.min(____exports.MAX_HERO_POINTS, level - ____exports.FIRST_HERO_LEVEL + 1)
    )
end
function ____exports.rowOfNode(index)
    return math.floor((index - 1) / 2)
end
--- The tree whose keystone the player knows; at most one can be chosen.
function ____exports.chosenTree(trees, player)
    for ____, tree in ipairs(trees) do
        if player:knows(tree.spells[____exports.KEYSTONE_INDEX + 1]) then
            return tree
        end
    end
    return nil
end
--- Points spent in a tree; the keystone is free.
function ____exports.spentPoints(tree, player)
    local spent = 0
    do
        local index = 1
        while index < ____exports.NODES_PER_TREE do
            if player:knows(tree.spells[index + 1]) then
                spent = spent + 1
            end
            index = index + 1
        end
    end
    return spent
end
local function rowComplete(tree, row, player)
    local left = player:knows(tree.spells[1 + row * 2 + 1])
    local right = player:knows(tree.spells[2 + row * 2 + 1])
    local ____temp_0
    if ____exports.ROW_KINDS[row + 1] == "pair" then
        ____temp_0 = left and right
    else
        ____temp_0 = left or right
    end
    return ____temp_0
end
--- Why a node cannot be learned, or undefined when it can.
function ____exports.learnBlocker(tree, index, player)
    if index <= ____exports.KEYSTONE_INDEX or index > ____exports.CAPSTONE_INDEX then
        return "That is not a node you can spend points on."
    end
    if not player:knows(tree.spells[____exports.KEYSTONE_INDEX + 1]) then
        return ("Choose " .. tree.name) .. " as your hero tree first."
    end
    if player:knows(tree.spells[index + 1]) then
        return "You already know that talent."
    end
    if ____exports.spentPoints(tree, player) >= ____exports.heroPoints(player.level) then
        return "You have no hero points left. You earn one per level from 71 to 80."
    end
    local row = index == ____exports.CAPSTONE_INDEX and #____exports.ROW_KINDS or ____exports.rowOfNode(index)
    do
        local previous = 0
        while previous < row do
            if not rowComplete(tree, previous, player) then
                return "Complete the rows above first."
            end
            previous = previous + 1
        end
    end
    if index ~= ____exports.CAPSTONE_INDEX and ____exports.ROW_KINDS[row + 1] == "choice" then
        local other = index % 2 == 1 and index + 1 or index - 1
        if player:knows(tree.spells[other + 1]) then
            return "You already chose the other talent in that row."
        end
    end
    return nil
end
function ____exports.nodeState(tree, index, player)
    if player:knows(tree.spells[index + 1]) then
        return "learned"
    end
    return ____exports.learnBlocker(tree, index, player) == nil and "available" or "locked"
end
--- Why a tree cannot be chosen, or undefined when it can.
function ____exports.chooseBlocker(tree, trees, availableKeys, player)
    if player.level < ____exports.FIRST_HERO_LEVEL then
        return ("Hero talents unlock at level " .. tostring(____exports.FIRST_HERO_LEVEL)) .. "."
    end
    local current = ____exports.chosenTree(trees, player)
    if current ~= nil then
        return ("You already follow " .. current.name) .. ". Reset your hero talents to choose again."
    end
    if __TS__ArrayIndexOf(availableKeys, tree.key) == -1 then
        return tree.name .. " is not available to your specialization."
    end
    return nil
end
--- The player's specialization: the talent tree with the most points, or
-- undefined without a clear leader (no points, or a tie for first).
function ____exports.mainTalentTree(pointsByTree)
    local best
    local bestPoints = 0
    local tied = false
    for ____, tree in ipairs(pointsByTree) do
        if tree.points > bestPoints then
            best = tree.key
            bestPoints = tree.points
            tied = false
        elseif tree.points == bestPoints and tree.points > 0 then
            tied = true
        end
    end
    local ____tied_1
    if tied then
        ____tied_1 = nil
    else
        ____tied_1 = best
    end
    return ____tied_1
end
return ____exports
