--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.talentui.addon.model.TalentModel",
    function()
        local ____exports = {}
        local readTree
        local ____TalentAbility = require("addon.model.TalentAbility")
        local teachesAbility = ____TalentAbility.teachesAbility
        local ____TalentRules = require("addon.model.TalentRules")
        local canAddPoint = ____TalentRules.canAddPoint
        local nodeState = ____TalentRules.nodeState
        function readTree(tab, talentGroup, unspentPoints)
            local name, icon, pointsSpent, ____, previewPointsSpent = GetTalentTabInfo(tab, false, false, talentGroup)
            local points = pointsSpent + previewPointsSpent
            local nodes = {}
            do
                local index = 1
                while index <= GetNumTalents(tab, false, false) do
                    local talentName, talentIcon, tier, column, ____, maxRank, isExceptional, ____, previewRank, meetsPreviewPrereq = GetTalentInfo(
                        tab,
                        index,
                        false,
                        false,
                        talentGroup
                    )
                    local facts = {
                        rank = previewRank,
                        maxRank = maxRank,
                        tier = tier,
                        meetsPrereq = meetsPreviewPrereq ~= nil,
                        treePoints = points,
                        unspentPoints = unspentPoints
                    }
                    local prereqTier, prereqColumn = GetTalentPrereqs(
                        tab,
                        index,
                        false,
                        false,
                        talentGroup
                    )
                    local ____tab_1 = tab
                    local ____index_2 = index
                    local ____talentName_3 = talentName
                    local ____talentIcon_4 = talentIcon
                    local ____tier_5 = tier
                    local ____column_6 = column
                    local ____previewRank_7 = previewRank
                    local ____maxRank_8 = maxRank
                    local ____temp_9 = isExceptional ~= nil or teachesAbility(tab, index)
                    local ____nodeState_result_10 = nodeState(facts)
                    local ____canAddPoint_result_11 = canAddPoint(facts)
                    local ____temp_0
                    if prereqTier ~= nil and prereqColumn ~= nil then
                        ____temp_0 = {tier = prereqTier, column = prereqColumn}
                    else
                        ____temp_0 = nil
                    end
                    nodes[#nodes + 1] = {
                        tab = ____tab_1,
                        index = ____index_2,
                        name = ____talentName_3,
                        icon = ____talentIcon_4,
                        tier = ____tier_5,
                        column = ____column_6,
                        rank = ____previewRank_7,
                        maxRank = ____maxRank_8,
                        isAbility = ____temp_9,
                        state = ____nodeState_result_10,
                        canAddPoint = ____canAddPoint_result_11,
                        prereq = ____temp_0
                    }
                    index = index + 1
                end
            end
            return {
                tab = tab,
                name = name,
                icon = icon,
                points = points,
                nodes = nodes
            }
        end
        --- Reads the player's talents for `talentGroup`, previewed points included, from the client.
        function ____exports.readTalentModel(talentGroup)
            local previewPoints = GetGroupPreviewTalentPointsSpent(false, talentGroup)
            local unspentPoints = GetUnspentTalentPoints(false, false, talentGroup) - previewPoints
            local trees = {}
            do
                local tab = 1
                while tab <= GetNumTalentTabs(false, false) do
                    trees[#trees + 1] = readTree(tab, talentGroup, unspentPoints)
                    tab = tab + 1
                end
            end
            return {
                talentGroup = talentGroup,
                isActiveGroup = talentGroup == GetActiveTalentGroup(false, false),
                unspentPoints = unspentPoints,
                previewPoints = previewPoints,
                trees = trees
            }
        end
        return ____exports
    end
)
