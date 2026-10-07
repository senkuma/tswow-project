local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
local __TS__New = ____lualib.__TS__New
tstl_register_module(
    "TSAddons.talentui.addon.ui.RetailTalentFrame",
    function()
        local ____exports = {}
        local ____TalentModel = require("addon.model.TalentModel")
        local readTalentModel = ____TalentModel.readTalentModel
        local ____TalentRules = require("addon.model.TalentRules")
        local primaryTree = ____TalentRules.primaryTree
        local ____SpecArt = require("addon.ui.SpecArt")
        local specBackground = ____SpecArt.specBackground
        local ____TalentArt = require("addon.ui.TalentArt")
        local ATLAS = ____TalentArt.ATLAS
        local TITLE_BAR_HEIGHT = ____TalentArt.TITLE_BAR_HEIGHT
        local ____TalentTreeView = require("addon.ui.TalentTreeView")
        local TalentTreeView = ____TalentTreeView.TalentTreeView
        local TREE_WIDTH = ____TalentTreeView.TREE_WIDTH
        local ____WindowFrame = require("addon.ui.WindowFrame")
        local addWindowFrame = ____WindowFrame.addWindowFrame
        local createAtlasTexture = ____WindowFrame.createAtlasTexture
        ____exports.FRAME_NAME = "TSWoWTalentFrame"
        local WIDTH = 900
        local HEIGHT = 690
        local TREE_GAP = 60
        local TREES_TOP = TITLE_BAR_HEIGHT + 30
        local CONTENT_INSET = {left = 2, right = 3, bottom = 3}
        local BACKGROUND_ASPECT = 2
        local BACKGROUND_SHADE = 0.4
        local UPDATE_EVENTS = {"PLAYER_TALENT_UPDATE", "PREVIEW_TALENT_POINTS_CHANGED", "CHARACTER_POINTS_CHANGED", "ACTIVE_TALENT_GROUP_CHANGED"}
        local function setShown(region, shown)
            if shown then
                region:Show()
            else
                region:Hide()
            end
        end
        local function setEnabled(button, enabled)
            if enabled then
                button:Enable()
            else
                button:Disable()
            end
        end
        --- UnitClass is declared as returning an array; it returns several values.
        local unitClass = UnitClass
        --- The retail talent window: the class's specialization art behind all trees
        -- side by side, retail nodes and metal border, and retail's flow of placing
        -- points freely and then applying or undoing them all at once.
        ____exports.RetailTalentFrame = __TS__Class()
        local RetailTalentFrame = ____exports.RetailTalentFrame
        RetailTalentFrame.name = "RetailTalentFrame"
        function RetailTalentFrame.prototype.____constructor(self)
            self.groupButtons = {}
            self.footerButtons = {}
            self.trees = {}
            self.viewedGroup = GetActiveTalentGroup(false, false)
            local className, classFile = unitClass("player")
            self.classFile = classFile
            local frame = CreateFrame("Frame", ____exports.FRAME_NAME, UIParent)
            frame:SetSize(WIDTH, HEIGHT)
            frame:SetPoint("CENTER")
            frame:SetMovable(true)
            frame:EnableMouse(true)
            frame:RegisterForDrag("LeftButton")
            frame:SetScript(
                "OnDragStart",
                function() return frame:StartMoving() end
            )
            frame:SetScript(
                "OnDragStop",
                function() return frame:StopMovingOrSizing() end
            )
            frame:Hide()
            UISpecialFrames[#UISpecialFrames + 1] = ____exports.FRAME_NAME
            self.background = frame:CreateTexture(nil, "BACKGROUND")
            self.background:SetPoint("TOPLEFT", CONTENT_INSET.left, -TITLE_BAR_HEIGHT)
            self.background:SetPoint("BOTTOMRIGHT", -CONTENT_INSET.right, CONTENT_INSET.bottom)
            local visible = WIDTH / (HEIGHT - TITLE_BAR_HEIGHT) / BACKGROUND_ASPECT
            self.background:SetTexCoord(1 - visible, 1, 0, 1)
            local shade = frame:CreateTexture(nil, "BORDER")
            shade:SetAllPoints(self.background)
            shade:SetTexture(0, 0, 0, BACKGROUND_SHADE)
            addWindowFrame(frame, WIDTH)
            local titleLayer = CreateFrame("Frame", nil, frame)
            titleLayer:SetAllPoints()
            titleLayer:SetFrameLevel(frame:GetFrameLevel() + 5)
            local title = titleLayer:CreateFontString(nil, "OVERLAY", "GameFontNormal")
            title:SetPoint("TOP", 0, -5)
            local color = RAID_CLASS_COLORS[classFile]
            local ____title_SetText_1 = title.SetText
            local ____temp_0
            if color ~= nil then
                ____temp_0 = className .. " Talents"
            else
                ____temp_0 = "Talents"
            end
            ____title_SetText_1(title, ____temp_0)
            if color ~= nil then
                title:SetTextColor(color.r, color.g, color.b)
            end
            local close = CreateFrame("Button", nil, titleLayer, "UIPanelCloseButton")
            close:SetScale(0.75)
            close:SetPoint("TOPRIGHT", 6, 7)
            self.pointsText = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightLarge")
            self.pointsText:SetPoint("BOTTOM", 0, 18)
            self.applyButton = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
            self.applyButton:SetSize(140, 24)
            self.applyButton:SetPoint("BOTTOMRIGHT", -16, 12)
            self.applyButton:SetText("Apply Changes")
            self.applyButton:SetScript(
                "OnClick",
                function() return LearnPreviewTalents(false) end
            )
            self.undoButton = CreateFrame("Button", nil, frame)
            self.undoButton:SetSize(ATLAS.undo.width * 0.7, ATLAS.undo.height * 0.7)
            self.undoButton:SetPoint(
                "RIGHT",
                self.applyButton,
                "LEFT",
                -8,
                0
            )
            local undoIcon = createAtlasTexture(self.undoButton, ATLAS.undo, "ARTWORK")
            undoIcon:SetAllPoints()
            self.undoButton:SetScript(
                "OnClick",
                function() return ResetGroupPreviewTalentPoints(false, self.viewedGroup) end
            )
            self.undoButton:SetScript(
                "OnEnter",
                function()
                    GameTooltip:SetOwner(self.undoButton, "ANCHOR_TOP")
                    GameTooltip:SetText("Undo pending changes")
                    GameTooltip:Show()
                end
            )
            self.undoButton:SetScript(
                "OnLeave",
                function() return GameTooltip:Hide() end
            )
            self.activateButton = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
            self.activateButton:SetSize(140, 24)
            self.activateButton:SetPoint("BOTTOMRIGHT", -16, 12)
            self.activateButton:SetText("Activate")
            self.activateButton:SetScript(
                "OnClick",
                function() return SetActiveTalentGroup(self.viewedGroup) end
            )
            __TS__ArrayForEach(
                {"Primary", "Secondary"},
                function(____, label, index)
                    local button = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
                    button:SetSize(86, 20)
                    button:SetPoint("TOPLEFT", 14 + index * 90, -TITLE_BAR_HEIGHT - 5)
                    button:SetText(label)
                    button:SetScript(
                        "OnClick",
                        function()
                            self.viewedGroup = index + 1
                            self:refresh()
                        end
                    )
                    local ____self_groupButtons_2 = self.groupButtons
                    ____self_groupButtons_2[#____self_groupButtons_2 + 1] = button
                end
            )
            self.frame = frame
            self:addFooterButton(
                "Glyphs",
                function() return self:openGlyphs() end
            )
            __TS__ArrayForEach(
                UPDATE_EVENTS,
                function(____, event) return frame:RegisterEvent(event) end
            )
            frame:SetScript(
                "OnEvent",
                function()
                    if frame:IsShown() then
                        self:refresh()
                    end
                end
            )
            self.model = readTalentModel(self.viewedGroup)
        end
        function RetailTalentFrame.prototype.toggle(self)
            if self.frame:IsShown() then
                self.frame:Hide()
                PlaySound("igCharacterInfoClose")
                return
            end
            self.viewedGroup = GetActiveTalentGroup(false, false)
            self:refresh()
            self.frame:Show()
            PlaySound("igCharacterInfoOpen")
        end
        function RetailTalentFrame.prototype.addFooterButton(self, text, onClick)
            local button = CreateFrame("Button", nil, self.frame, "UIPanelButtonTemplate")
            button:SetSize(110, 24)
            button:SetPoint("BOTTOMLEFT", 16 + #self.footerButtons * 116, 12)
            button:SetText(text)
            button:SetScript("OnClick", onClick)
            local ____self_footerButtons_3 = self.footerButtons
            ____self_footerButtons_3[#____self_footerButtons_3 + 1] = button
        end
        function RetailTalentFrame.prototype.refresh(self)
            self.model = readTalentModel(self.viewedGroup)
            if #self.trees == 0 then
                self:createTrees()
            end
            __TS__ArrayForEach(
                self.model.trees,
                function(____, tree, index) return self.trees[index + 1]:update(tree) end
            )
            self.background:SetTexture(specBackground(
                self.classFile,
                primaryTree(__TS__ArrayMap(
                    self.model.trees,
                    function(____, tree) return tree.points end
                ))
            ))
            self.pointsText:SetText(("Talent Points: |cffffd100" .. tostring(self.model.unspentPoints)) .. "|r")
            local active = self.model.isActiveGroup
            setShown(self.applyButton, active)
            setShown(self.undoButton, active)
            setShown(self.activateButton, not active)
            setEnabled(self.applyButton, self.model.previewPoints > 0)
            setEnabled(self.undoButton, self.model.previewPoints > 0)
            local dualSpec = GetNumTalentGroups(false, false) > 1
            __TS__ArrayForEach(
                self.groupButtons,
                function(____, button, index)
                    setShown(button, dualSpec)
                    if index + 1 == self.viewedGroup then
                        button:LockHighlight()
                    else
                        button:UnlockHighlight()
                    end
                end
            )
        end
        function RetailTalentFrame.prototype.createTrees(self)
            local treesWidth = #self.model.trees * TREE_WIDTH + (#self.model.trees - 1) * TREE_GAP
            local left = (WIDTH - treesWidth) / 2
            self.trees = __TS__ArrayMap(
                self.model.trees,
                function(____, tree, index)
                    local view = __TS__New(
                        TalentTreeView,
                        self.frame,
                        tree,
                        {
                            changePoints = function(____, node, points) return self:changePoints(node, points) end,
                            talentGroup = function() return self.viewedGroup end
                        }
                    )
                    view.frame:SetPoint("TOPLEFT", left + index * (TREE_WIDTH + TREE_GAP), -TREES_TOP)
                    return view
                end
            )
        end
        function RetailTalentFrame.prototype.changePoints(self, node, points)
            if not self.model.isActiveGroup then
                return
            end
            AddPreviewTalentPoints(
                node.tab,
                node.index,
                points,
                false,
                self.viewedGroup
            )
        end
        function RetailTalentFrame.prototype.openGlyphs(self)
            local toggleGlyphs = _G.ToggleGlyphFrame
            if toggleGlyphs ~= nil then
                toggleGlyphs()
            end
        end
        return ____exports
    end
)
