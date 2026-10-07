--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.commandpanel.addon.MinimapButton",
    function()
        local ____exports = {}
        local ICON = "Interface\\Icons\\INV_Misc_Book_11"
        local SIZE = 31
        local ANGLE = 225
        local RADIUS = 80
        --- A round button on the minimap's edge, laid out like Blizzard's tracking button.
        function ____exports.createMinimapButton(tooltip, onClick)
            local button = CreateFrame("Button", nil, Minimap)
            button:SetSize(SIZE, SIZE)
            button:SetFrameStrata("MEDIUM")
            button:SetFrameLevel(8)
            local radians = ANGLE * math.pi / 180
            button:SetPoint(
                "CENTER",
                Minimap,
                "CENTER",
                RADIUS * math.cos(radians),
                RADIUS * math.sin(radians)
            )
            button:SetHighlightTexture("Interface\\Minimap\\UI-Minimap-ZoomButton-Highlight")
            local background = button:CreateTexture(nil, "BACKGROUND")
            background:SetTexture("Interface\\Minimap\\UI-Minimap-Background")
            background:SetSize(20, 20)
            background:SetPoint("TOPLEFT", 7, -5)
            local icon = button:CreateTexture(nil, "ARTWORK")
            icon:SetTexture(ICON)
            icon:SetSize(17, 17)
            icon:SetPoint("TOPLEFT", 7, -6)
            local border = button:CreateTexture(nil, "OVERLAY")
            border:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")
            border:SetSize(53, 53)
            border:SetPoint("TOPLEFT")
            button:SetScript("OnClick", onClick)
            button:SetScript(
                "OnEnter",
                function()
                    GameTooltip:SetOwner(button, "ANCHOR_LEFT")
                    GameTooltip:AddLine(tooltip, 1, 1, 1)
                    GameTooltip:Show()
                end
            )
            button:SetScript(
                "OnLeave",
                function() return GameTooltip:Hide() end
            )
            return button
        end
        return ____exports
    end
)
