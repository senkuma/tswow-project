local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
tstl_register_module(
    "TSAddons.talentui.addon.ui.TalentNodeButton",
    function()
        local ____exports = {}
        local ____TalentArt = require("TSAddons.talentui.addon.ui.TalentArt")
        local ATLAS = ____TalentArt.ATLAS
        local ____WindowFrame = require("TSAddons.talentui.addon.ui.WindowFrame")
        local createAtlasTexture = ____WindowFrame.createAtlasTexture
        local setAtlasPiece = ____WindowFrame.setAtlasPiece
        ____exports.NODE_SIZE = 36
        local FRAME_SIZE = ____exports.NODE_SIZE * 1.32
        local ICON_SIZE = ____exports.NODE_SIZE - 4
        local ICON_CROP = 0.08
        local BADGE_HEIGHT = 12
        local BADGE_PADDING = 4
        local SQUARE_FRAMES = {learned = ATLAS.squareLearned, available = ATLAS.squareAvailable, locked = ATLAS.squareLocked}
        local CIRCLE_FRAMES = {learned = ATLAS.circleLearned, available = ATLAS.circleAvailable, locked = ATLAS.circleLocked}
        local RANK_COLORS = {canAdd = {0.25, 1, 0.25}, maxed = {1, 0.82, 0}, locked = {0.65, 0.65, 0.65}}
        --- One talent in retail style: abilities are squares and passives circles,
        -- framed gold once learned, green while a point can go in and gray when
        -- locked, with the rank in a badge on the corner. Left click previews a
        -- point, right click removes one; nothing is learned until changes are applied.
        ____exports.TalentNodeButton = __TS__Class()
        local TalentNodeButton = ____exports.TalentNodeButton
        TalentNodeButton.name = "TalentNodeButton"
        function TalentNodeButton.prototype.____constructor(self, parent, node, actions)
            self.node = node
            local button = CreateFrame("Button", nil, parent)
            button:SetSize(____exports.NODE_SIZE, ____exports.NODE_SIZE)
            button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
            self.icon = button:CreateTexture(nil, "ARTWORK")
            self.icon:SetSize(ICON_SIZE, ICON_SIZE)
            self.icon:SetPoint("CENTER")
            if node.isAbility then
                self.icon:SetTexture(node.icon)
                self.icon:SetTexCoord(ICON_CROP, 1 - ICON_CROP, ICON_CROP, 1 - ICON_CROP)
            else
                SetPortraitToTexture(self.icon, node.icon)
            end
            local ____node_isAbility_0
            if node.isAbility then
                ____node_isAbility_0 = SQUARE_FRAMES
            else
                ____node_isAbility_0 = CIRCLE_FRAMES
            end
            local frames = ____node_isAbility_0
            self.border = createAtlasTexture(button, frames.locked, "OVERLAY")
            self.border:SetSize(FRAME_SIZE, FRAME_SIZE)
            self.border:SetPoint("CENTER")
            local highlight = button:CreateTexture(nil, "HIGHLIGHT")
            highlight:SetTexture("Interface\\Buttons\\ButtonHilight-Square")
            highlight:SetBlendMode("ADD")
            highlight:SetSize(ICON_SIZE, ICON_SIZE)
            highlight:SetPoint("CENTER")
            local badgeLayer = CreateFrame("Frame", nil, button)
            badgeLayer:SetAllPoints()
            badgeLayer:SetFrameLevel(button:GetFrameLevel() + 2)
            self.badge = badgeLayer:CreateTexture(nil, "BACKGROUND")
            self.badge:SetTexture(0, 0, 0, 0.8)
            self.badge:SetHeight(BADGE_HEIGHT)
            self.badge:SetPoint(
                "BOTTOMRIGHT",
                button,
                "BOTTOMRIGHT",
                6,
                -4
            )
            self.rank = badgeLayer:CreateFontString(nil, "OVERLAY", "NumberFontNormalSmall")
            self.rank:SetPoint(
                "CENTER",
                self.badge,
                "CENTER",
                0,
                0
            )
            button:SetScript(
                "OnClick",
                function(_, mouseButton) return actions:changePoints(self.node, mouseButton == "RightButton" and -1 or 1) end
            )
            button:SetScript(
                "OnEnter",
                function()
                    GameTooltip:SetOwner(button, "ANCHOR_RIGHT")
                    GameTooltip:SetTalent(
                        self.node.tab,
                        self.node.index,
                        false,
                        false,
                        actions:talentGroup(),
                        true
                    )
                    GameTooltip:Show()
                end
            )
            button:SetScript(
                "OnLeave",
                function() return GameTooltip:Hide() end
            )
            self.button = button
            self:update(node)
        end
        function TalentNodeButton.prototype.update(self, node)
            self.node = node
            local ____setAtlasPiece_3 = setAtlasPiece
            local ____self_border_2 = self.border
            local ____node_isAbility_1
            if node.isAbility then
                ____node_isAbility_1 = SQUARE_FRAMES
            else
                ____node_isAbility_1 = CIRCLE_FRAMES
            end
            ____setAtlasPiece_3(____self_border_2, ____node_isAbility_1[node.state])
            local locked = node.state == "locked"
            self.icon:SetDesaturated(locked and 1 or 0)
            local shade = locked and 0.55 or 1
            self.icon:SetVertexColor(shade, shade, shade)
            self.rank:SetText((tostring(node.rank) .. "/") .. tostring(node.maxRank))
            self.badge:SetWidth(self.rank:GetStringWidth() + BADGE_PADDING * 2)
            local r, g, b = unpack(RANK_COLORS[node.canAddPoint and "canAdd" or (node.rank == node.maxRank and "maxed" or "locked")])
            self.rank:SetTextColor(r, g, b)
        end
        return ____exports
    end
)
