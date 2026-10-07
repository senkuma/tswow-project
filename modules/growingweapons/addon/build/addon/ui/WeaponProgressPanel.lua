local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.WeaponProgressPanel",
    function()
        local ____exports = {}
        local addBackground, BACKDROP_SHADE
        local ____WeaponProgress = require("TSAddons.growingweapons.addon.model.WeaponProgress")
        local isHeldAtCap = ____WeaponProgress.isHeldAtCap
        local isMaxLevel = ____WeaponProgress.isMaxLevel
        local progressFraction = ____WeaponProgress.progressFraction
        local ____AtlasTexture = require("TSAddons.growingweapons.addon.ui.AtlasTexture")
        local createAtlasTexture = ____AtlasTexture.createAtlasTexture
        local createShade = ____AtlasTexture.createShade
        local cropAtlasWidth = ____AtlasTexture.cropAtlasWidth
        local ____Format = require("TSAddons.growingweapons.addon.ui.Format")
        local COLORS = ____Format.COLORS
        local formatBonus = ____Format.formatBonus
        local formatNumber = ____Format.formatNumber
        local setTextColor = ____Format.setTextColor
        local ____WeaponArt = require("TSAddons.growingweapons.addon.ui.WeaponArt")
        local ATLAS = ____WeaponArt.ATLAS
        local BACKDROP_TEXTURE = ____WeaponArt.BACKDROP_TEXTURE
        function addBackground(frame)
            local bambooHalf = ATLAS.bamboo.height / 2
            local backdrop = frame:CreateTexture(nil, "BACKGROUND")
            backdrop:SetTexture(BACKDROP_TEXTURE)
            local r, g, b = unpack(BACKDROP_SHADE)
            backdrop:SetVertexColor(r, g, b)
            backdrop:SetPoint("TOPLEFT", 0, -bambooHalf)
            backdrop:SetPoint("BOTTOMRIGHT")
            local shade = createShade(
                frame,
                "BORDER",
                "VERTICAL",
                0.8,
                0.25
            )
            shade:SetAllPoints(backdrop)
            local bamboo = createAtlasTexture(frame, ATLAS.bamboo, "ARTWORK")
            bamboo:SetPoint("TOPLEFT")
            bamboo:SetPoint("TOPRIGHT")
        end
        --- The narrowest the panel can be; it stretches to the width it is anchored to.
        ____exports.PANEL_MIN_WIDTH = ATLAS.bamboo.width
        local BADGE_LEFT = 6
        local BADGE_TOP = 14
        local LEVEL_FONT_SIZE = 17
        local CONTENT_LEFT = 58
        local BAR_LEFT = 60
        local BAR_TOP = 37
        local BAR_FONT_SIZE = 9
        local STATUS_TOP = 51
        local DIVIDER_TOP = 67
        local DIVIDER_WIDTH = 228
        local BONUS_HEADER_TOP = 73
        local BONUS_FIRST_TOP = 87
        local BONUS_ROW_HEIGHT = 13
        local BOTTOM_PADDING = 2
        local SIDE_MARGIN = 10
        BACKDROP_SHADE = {0.6, 0.7, 0.65}
        --- The panel's height with a row for each of `bonusCount` bonuses.
        function ____exports.panelHeight(bonusCount)
            return BONUS_FIRST_TOP + bonusCount * BONUS_ROW_HEIGHT + BOTTOM_PADDING
        end
        --- A weapon's level and experience in retail artifact style: a gold glass
        -- badge with the level, the experience bar in artifact power gold, and the
        -- bonuses with what the next level adds, over the Monk artifact backdrop.
        ____exports.WeaponProgressPanel = __TS__Class()
        local WeaponProgressPanel = ____exports.WeaponProgressPanel
        WeaponProgressPanel.name = "WeaponProgressPanel"
        function WeaponProgressPanel.prototype.____constructor(self, parent)
            self.bonusRows = {}
            local frame = CreateFrame("Frame", nil, parent)
            frame:SetSize(
                ____exports.PANEL_MIN_WIDTH,
                ____exports.panelHeight(0)
            )
            frame:Hide()
            self.frame = frame
            addBackground(frame)
            local badge = createAtlasTexture(frame, ATLAS.badge, "ARTWORK")
            badge:SetPoint("TOPLEFT", BADGE_LEFT, -BADGE_TOP)
            self.level = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightLarge")
            local font = self.level:GetFont()
            self.level:SetFont(font, LEVEL_FONT_SIZE, "OUTLINE")
            self.level:SetPoint(
                "CENTER",
                badge,
                "CENTER",
                0,
                1
            )
            local title = self:text("GameFontNormal", "TOPLEFT", CONTENT_LEFT, -17)
            title:SetText("Weapon Level")
            self.levelRange = self:text("GameFontHighlightSmall", "TOPRIGHT", -8, -18)
            local track = createAtlasTexture(frame, ATLAS.barTrack, "ARTWORK")
            track:SetPoint("TOPLEFT", BAR_LEFT, -BAR_TOP)
            self.barFill = createAtlasTexture(frame, ATLAS.barFill, "OVERLAY")
            self.barFill:SetPoint("TOPLEFT", track, "TOPLEFT")
            local barOverlay = CreateFrame("Frame", nil, frame)
            barOverlay:SetAllPoints()
            local barFrame = createAtlasTexture(barOverlay, ATLAS.barFrame, "ARTWORK")
            barFrame:SetPoint("CENTER", track, "CENTER")
            self.barText = barOverlay:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
            local barFont = self.barText:GetFont()
            self.barText:SetFont(barFont, BAR_FONT_SIZE, "OUTLINE")
            self.barText:SetPoint(
                "CENTER",
                track,
                "CENTER",
                0,
                0
            )
            self.status = self:text("GameFontNormalSmall", "TOPLEFT", CONTENT_LEFT, -STATUS_TOP)
            local divider = createAtlasTexture(frame, ATLAS.goldLine, "ARTWORK")
            divider:SetWidth(DIVIDER_WIDTH)
            divider:SetPoint("TOP", 0, -DIVIDER_TOP)
            local bonusHeader = self:text("GameFontNormalSmall", "TOPLEFT", SIDE_MARGIN, -BONUS_HEADER_TOP)
            bonusHeader:SetText("Bonuses")
            self.nextHeader = self:text("GameFontNormalSmall", "TOPRIGHT", -SIDE_MARGIN, -BONUS_HEADER_TOP)
            self.nextHeader:SetText("Next level")
            setTextColor(self.nextHeader, COLORS.gray)
        end
        function WeaponProgressPanel.prototype.show(self, state)
            self:update(state)
            self.frame:Show()
        end
        function WeaponProgressPanel.prototype.hide(self)
            self.frame:Hide()
        end
        function WeaponProgressPanel.prototype.update(self, state)
            local maxed = isMaxLevel(state)
            self.level:SetText(tostring(state.level))
            self.levelRange:SetText((tostring(state.level) .. " / ") .. tostring(state.maxLevel))
            self:updateBar(state)
            self:updateStatus(state)
            if maxed then
                self.nextHeader:Hide()
            else
                self.nextHeader:Show()
            end
            self.frame:SetHeight(____exports.panelHeight(#state.bonuses))
            while #self.bonusRows < #state.bonuses do
                local ____self_bonusRows_0 = self.bonusRows
                ____self_bonusRows_0[#____self_bonusRows_0 + 1] = self:createBonusRow(#self.bonusRows)
            end
            __TS__ArrayForEach(
                self.bonusRows,
                function(____, row, index)
                    local bonus = state.bonuses[index + 1]
                    row.total:SetText(bonus == nil and "" or formatBonus(bonus.amount, bonus.label))
                    row.next:SetText((bonus == nil or bonus.next == nil) and "" or "+" .. formatNumber(bonus.next - bonus.amount))
                end
            )
        end
        function WeaponProgressPanel.prototype.createBonusRow(self, index)
            local top = -(BONUS_FIRST_TOP + index * BONUS_ROW_HEIGHT)
            local next = self:text("GameFontHighlightSmall", "TOPRIGHT", -SIDE_MARGIN, top)
            setTextColor(next, COLORS.green)
            return {
                total = self:text("GameFontHighlightSmall", "TOPLEFT", SIDE_MARGIN, top),
                next = next
            }
        end
        function WeaponProgressPanel.prototype.updateBar(self, state)
            local fraction = progressFraction(state)
            if fraction > 0 then
                cropAtlasWidth(self.barFill, ATLAS.barFill, fraction)
                self.barFill:Show()
            else
                self.barFill:Hide()
            end
            self.barText:SetText(isMaxLevel(state) and "Max Level" or (formatNumber(state.experience) .. " / ") .. formatNumber(state.experienceToNext))
        end
        function WeaponProgressPanel.prototype.updateStatus(self, state)
            if isMaxLevel(state) then
                self.status:SetText("Fully awakened")
                setTextColor(self.status, COLORS.artifact)
            elseif isHeldAtCap(state) then
                self.status:SetText("Grows again at character level " .. tostring(state.cap + 1))
                setTextColor(self.status, COLORS.orange)
            else
                self.status:SetText((tostring(math.floor(progressFraction(state) * 100)) .. "% toward level ") .. tostring(state.level + 1))
                setTextColor(self.status, COLORS.gray)
            end
        end
        function WeaponProgressPanel.prototype.text(self, template, point, x, y)
            local text = self.frame:CreateFontString(nil, "OVERLAY", template)
            text:SetPoint(point, x, y)
            return text
        end
        return ____exports
    end
)
