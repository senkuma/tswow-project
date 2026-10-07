local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
tstl_register_module(
    "TSAddons.talentui.addon.model.TalentRules",
    function()
        local ____exports = {}
        --- Points a tree needs per tier before the next tier unlocks (WotLK talent rules).
        ____exports.POINTS_PER_TIER = 5
        --- Whether the tiers above give the tree enough points for this node's tier.
        function ____exports.tierUnlocked(tier, treePoints)
            return treePoints >= (tier - 1) * ____exports.POINTS_PER_TIER
        end
        --- Whether one more point can go into the node.
        function ____exports.canAddPoint(node)
            return node.unspentPoints > 0 and node.rank < node.maxRank and node.meetsPrereq and ____exports.tierUnlocked(node.tier, node.treePoints)
        end
        --- Retail's three node looks: gold once it has points, green while a point
        -- can go in, gray otherwise.
        function ____exports.nodeState(node)
            if node.rank > 0 then
                return "learned"
            end
            return ____exports.canAddPoint(node) and "available" or "locked"
        end
        --- The tree whose specialization art fills the window: the one with the most
        -- points, the first on ties and when nothing is spent yet.
        function ____exports.primaryTree(treePoints)
            local best = 0
            __TS__ArrayForEach(
                treePoints,
                function(____, points, index)
                    if points > treePoints[best + 1] then
                        best = index
                    end
                end
            )
            return best
        end
        return ____exports
    end
)
