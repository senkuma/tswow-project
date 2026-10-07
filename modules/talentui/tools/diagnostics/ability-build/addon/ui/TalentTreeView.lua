local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__New = ____lualib.__TS__New
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
tstl_register_module(
    "TSAddons.talentui.addon.ui.TalentTreeView",
    function()
        local ____exports = {}
        local ____TalentNodeButton = require("addon.ui.TalentNodeButton")
        local NODE_SIZE = ____TalentNodeButton.NODE_SIZE
        local TalentNodeButton = ____TalentNodeButton.TalentNodeButton
        local COLUMN_SPACING = 62
        local ROW_SPACING = 50
        local COLUMNS = 4
        local TIERS = 11
        ____exports.TREE_WIDTH = (COLUMNS - 1) * COLUMN_SPACING + NODE_SIZE
        ____exports.TREE_HEIGHT = (TIERS - 1) * ROW_SPACING + NODE_SIZE
        local HEADER_HEIGHT = 44
        local HEADER_ICON_SIZE = 24
        local LINE_WIDTH = 3
        local LINE_SHADOW_WIDTH = 7
        local LINE_LEARNED = {1, 0.82, 0}
        local LINE_LOCKED = {0.35, 0.35, 0.35}
        --- Center of a node, relative to the tree's top left corner.
        local function nodeCenter(tier, column)
            return {(column - 1) * COLUMN_SPACING + NODE_SIZE / 2, -((tier - 1) * ROW_SPACING + NODE_SIZE / 2)}
        end
        --- A straight connection segment: a dark shadow under a colored core.
        local LineSegment = __TS__Class()
        LineSegment.name = "LineSegment"
        function LineSegment.prototype.____constructor(self, parent, from, to)
            local shadow = self:segment(
                parent,
                from,
                to,
                LINE_SHADOW_WIDTH,
                "BACKGROUND"
            )
            shadow:SetTexture(0, 0, 0, 0.8)
            self.core = self:segment(
                parent,
                from,
                to,
                LINE_WIDTH,
                "BORDER"
            )
        end
        function LineSegment.prototype.setLearned(self, learned)
            local ____learned_0
            if learned then
                ____learned_0 = LINE_LEARNED
            else
                ____learned_0 = LINE_LOCKED
            end
            local r, g, b = unpack(____learned_0)
            self.core:SetTexture(r, g, b, 1)
        end
        function LineSegment.prototype.segment(self, parent, ____bindingPattern0, ____bindingPattern1, width, layer)
            local y1
            local x1
            x1 = ____bindingPattern0[1]
            y1 = ____bindingPattern0[2]
            local y2
            local x2
            x2 = ____bindingPattern1[1]
            y2 = ____bindingPattern1[2]
            local texture = parent:CreateTexture(nil, layer)
            local half = width / 2
            texture:SetPoint(
                "TOPLEFT",
                math.min(x1, x2) - half,
                math.max(y1, y2) + half
            )
            texture:SetPoint(
                "BOTTOMRIGHT",
                parent,
                "TOPLEFT",
                math.max(x1, x2) + half,
                math.min(y1, y2) - half
            )
            return texture
        end
        --- A requirement arrow: straight when the talents share a row or column, otherwise across then down.
        local Connection = __TS__Class()
        Connection.name = "Connection"
        function Connection.prototype.____constructor(self, parent, node, prereq)
            local from = nodeCenter(prereq.tier, prereq.column)
            local to = nodeCenter(node.tier, node.column)
            local corner = {to[1], from[2]}
            local ____temp_1
            if from[1] == to[1] or from[2] == to[2] then
                ____temp_1 = {__TS__New(LineSegment, parent, from, to)}
            else
                ____temp_1 = {
                    __TS__New(LineSegment, parent, from, corner),
                    __TS__New(LineSegment, parent, corner, to)
                }
            end
            self.segments = ____temp_1
        end
        function Connection.prototype.setLearned(self, learned)
            __TS__ArrayForEach(
                self.segments,
                function(____, segment) return segment:setLearned(learned) end
            )
        end
        --- One talent tree: a header with the tree's icon, name and points, and the
        -- nodes on their tier and column grid joined by requirement lines.
        ____exports.TalentTreeView = __TS__Class()
        local TalentTreeView = ____exports.TalentTreeView
        TalentTreeView.name = "TalentTreeView"
        function TalentTreeView.prototype.____constructor(self, parent, tree, actions)
            self.nodes = {}
            self.connections = {}
            local frame = CreateFrame("Frame", nil, parent)
            frame:SetSize(____exports.TREE_WIDTH, ____exports.TREE_HEIGHT + HEADER_HEIGHT)
            self.title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
            self.title:SetPoint("TOP", HEADER_ICON_SIZE / 2, -4)
            local icon = frame:CreateTexture(nil, "ARTWORK")
            icon:SetSize(HEADER_ICON_SIZE, HEADER_ICON_SIZE)
            icon:SetPoint(
                "RIGHT",
                self.title,
                "LEFT",
                -6,
                0
            )
            SetPortraitToTexture(icon, tree.icon)
            self.treeName = tree.name
            local grid = CreateFrame("Frame", nil, frame)
            grid:SetPoint("TOPLEFT", 0, -HEADER_HEIGHT)
            grid:SetSize(____exports.TREE_WIDTH, ____exports.TREE_HEIGHT)
            __TS__ArrayForEach(
                tree.nodes,
                function(____, node)
                    if node.prereq ~= nil then
                        local ____self_connections_2 = self.connections
                        ____self_connections_2[#____self_connections_2 + 1] = {
                            connection = __TS__New(Connection, grid, node, node.prereq),
                            prereq = node.prereq
                        }
                    end
                end
            )
            __TS__ArrayForEach(
                tree.nodes,
                function(____, node)
                    local view = __TS__New(TalentNodeButton, grid, node, actions)
                    local x, y = unpack(nodeCenter(node.tier, node.column))
                    view.button:SetPoint(
                        "CENTER",
                        grid,
                        "TOPLEFT",
                        x,
                        y
                    )
                    local ____self_nodes_3 = self.nodes
                    ____self_nodes_3[#____self_nodes_3 + 1] = view
                end
            )
            self.frame = frame
            self:update(tree)
        end
        function TalentTreeView.prototype.update(self, tree)
            self.title:SetText(((self.treeName .. "  |cffffffff") .. tostring(tree.points)) .. "|r")
            __TS__ArrayForEach(
                tree.nodes,
                function(____, node, index) return self.nodes[index + 1]:update(node) end
            )
            __TS__ArrayForEach(
                self.connections,
                function(____, ____bindingPattern0)
                    local prereq
                    local connection
                    connection = ____bindingPattern0.connection
                    prereq = ____bindingPattern0.prereq
                    local source = __TS__ArrayFind(
                        tree.nodes,
                        function(____, node) return node.tier == prereq.tier and node.column == prereq.column end
                    )
                    connection:setLearned(source ~= nil and source.rank == source.maxRank)
                end
            )
        end
        return ____exports
    end
)
