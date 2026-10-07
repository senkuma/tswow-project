local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.LevelUpToast",
    function()
        local ____exports = {}
        local addBanner, HEIGHT, LINE_WIDTH, GLOW_WIDTH, BAND_ALPHA
        local ____AtlasTexture = require("TSAddons.growingweapons.addon.ui.AtlasTexture")
        local createAtlasTexture = ____AtlasTexture.createAtlasTexture
        local createShade = ____AtlasTexture.createShade
        local ____Format = require("TSAddons.growingweapons.addon.ui.Format")
        local COLORS = ____Format.COLORS
        local formatBonus = ____Format.formatBonus
        local setTextColor = ____Format.setTextColor
        local ____WeaponArt = require("TSAddons.growingweapons.addon.ui.WeaponArt")
        local ATLAS = ____WeaponArt.ATLAS
        function addBanner(frame)
            local left = createShade(
                frame,
                "BACKGROUND",
                "HORIZONTAL",
                0,
                BAND_ALPHA
            )
            left:SetPoint("TOPLEFT")
            left:SetPoint("BOTTOMRIGHT", frame, "BOTTOM")
            local right = createShade(
                frame,
                "BACKGROUND",
                "HORIZONTAL",
                BAND_ALPHA,
                0
            )
            right:SetPoint("TOPLEFT", frame, "TOP")
            right:SetPoint("BOTTOMRIGHT")
            local glow = createAtlasTexture(frame, ATLAS.glow, "BORDER")
            glow:SetSize(GLOW_WIDTH, HEIGHT)
            glow:SetBlendMode("ADD")
            glow:SetPoint("BOTTOM")
            local top = createAtlasTexture(frame, ATLAS.goldLine, "ARTWORK")
            top:SetWidth(LINE_WIDTH)
            top:SetPoint("TOP")
            local bottom = createAtlasTexture(frame, ATLAS.goldLine, "ARTWORK")
            bottom:SetWidth(LINE_WIDTH)
            bottom:SetPoint("BOTTOM")
        end
        local WIDTH = 440
        HEIGHT = 74
        local TOP_OFFSET = -170
        LINE_WIDTH = 400
        GLOW_WIDTH = 260
        local TITLE_FONT_SIZE = 26
        BAND_ALPHA = 0.75
        local LEVEL_UP_SOUND = "Sound\\Interface\\LevelUp.wav"
        local FADE_IN_SECONDS = 0.3
        local HOLD_SECONDS = 4
        local FADE_OUT_SECONDS = 1.2
        --- The retail level-up banner for a weapon: a dark band between two gold
        -- lines with a green glow rising from the bottom one, the weapon's name, its
        -- new level and what the level added. A newer level up replaces a shown one.
        ____exports.LevelUpToast = __TS__Class()
        local LevelUpToast = ____exports.LevelUpToast
        LevelUpToast.name = "LevelUpToast"
        function LevelUpToast.prototype.____constructor(self)
            self.elapsed = 0
            local frame = CreateFrame("Frame", nil, UIParent)
            frame:SetSize(WIDTH, HEIGHT)
            frame:SetPoint("TOP", 0, TOP_OFFSET)
            frame:SetFrameStrata("HIGH")
            frame:Hide()
            self.frame = frame
            addBanner(frame)
            self.weaponName = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
            self.weaponName:SetPoint("TOP", 0, -10)
            setTextColor(self.weaponName, COLORS.artifact)
            self.title = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightLarge")
            local font = self.title:GetFont()
            self.title:SetFont(font, TITLE_FONT_SIZE, "OUTLINE")
            self.title:SetPoint(
                "TOP",
                self.weaponName,
                "BOTTOM",
                0,
                -4
            )
            self.gains = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
            self.gains:SetPoint(
                "TOP",
                self.title,
                "BOTTOM",
                0,
                -4
            )
            setTextColor(self.gains, COLORS.green)
            frame:SetScript(
                "OnUpdate",
                function(_, elapsed) return self:animate(elapsed) end
            )
        end
        function LevelUpToast.prototype.show(self, levelUp)
            local name = GetItemInfo(levelUp.item)
            self.weaponName:SetText(name or "Your weapon")
            self.title:SetText("Level " .. tostring(levelUp.level))
            self.gains:SetText(table.concat(
                __TS__ArrayMap(
                    __TS__ArrayFilter(
                        levelUp.gains,
                        function(____, gain) return gain.amount > 0 end
                    ),
                    function(____, gain) return formatBonus(gain.amount, gain.label) end
                ),
                "   "
            ))
            self.elapsed = 0
            self.frame:SetAlpha(0)
            self.frame:Show()
            PlaySoundFile(LEVEL_UP_SOUND)
        end
        function LevelUpToast.prototype.animate(self, elapsed)
            self.elapsed = self.elapsed + elapsed
            local fadeOutStart = FADE_IN_SECONDS + HOLD_SECONDS
            if self.elapsed < FADE_IN_SECONDS then
                self.frame:SetAlpha(self.elapsed / FADE_IN_SECONDS)
            elseif self.elapsed < fadeOutStart then
                self.frame:SetAlpha(1)
            elseif self.elapsed < fadeOutStart + FADE_OUT_SECONDS then
                self.frame:SetAlpha(1 - (self.elapsed - fadeOutStart) / FADE_OUT_SECONDS)
            else
                self.frame:Hide()
            end
        end
        return ____exports
    end
)
