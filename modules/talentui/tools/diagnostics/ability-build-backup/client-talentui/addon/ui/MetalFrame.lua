local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
tstl_register_module(
    "TSAddons.talentui.addon.ui.MetalFrame",
    function()
        local ____exports = {}
        local ____TalentArt = require("TSAddons.talentui.addon.ui.TalentArt")
        local ATLAS = ____TalentArt.ATLAS
        local FRAME_RAILS = ____TalentArt.FRAME_RAILS
        local PARTS_TEXTURE = ____TalentArt.PARTS_TEXTURE
        --- Height of the title bar: the space between the frame's outer and title rails.
        ____exports.TITLE_BAR_HEIGHT = FRAME_RAILS.title - FRAME_RAILS.outer
        --- A texture showing one atlas piece at its own size, optionally mirrored left to right.
        function ____exports.createAtlasTexture(frame, piece, layer, mirrored)
            if mirrored == nil then
                mirrored = false
            end
            local texture = frame:CreateTexture(nil, layer)
            texture:SetTexture(PARTS_TEXTURE)
            if mirrored then
                texture:SetTexCoord(piece.right, piece.left, piece.top, piece.bottom)
            else
                texture:SetTexCoord(piece.left, piece.right, piece.top, piece.bottom)
            end
            texture:SetSize(piece.width, piece.height)
            return texture
        end
        --- Retail's metal window border: title-bar corners at the top, rails along
        -- the sides and bottom, placed so every rail runs exactly along the frame's
        -- edge. The rails are uniform along their length, so they stretch cleanly.
        function ____exports.addMetalFrame(frame)
            local corner = ATLAS.cornerTopLeft
            local center = FRAME_RAILS.stripCenter
            local topLeft = ____exports.createAtlasTexture(frame, corner, "OVERLAY")
            topLeft:SetPoint("TOPLEFT", -FRAME_RAILS.side, FRAME_RAILS.outer)
            local topRight = ____exports.createAtlasTexture(frame, corner, "OVERLAY", true)
            topRight:SetPoint("TOPRIGHT", FRAME_RAILS.side, FRAME_RAILS.outer)
            local cornerReach = corner.width - FRAME_RAILS.side
            __TS__ArrayForEach(
                {0, -____exports.TITLE_BAR_HEIGHT},
                function(____, railY)
                    local rail = ____exports.createAtlasTexture(frame, ATLAS.railHorizontal, "OVERLAY")
                    rail:SetPoint("TOPLEFT", cornerReach, railY + center)
                    rail:SetPoint("TOPRIGHT", -cornerReach, railY + center)
                end
            )
            local cornerDepth = corner.height - FRAME_RAILS.outer
            __TS__ArrayForEach(
                {"LEFT", "RIGHT"},
                function(____, side)
                    local rail = ____exports.createAtlasTexture(frame, ATLAS.railVertical, "OVERLAY")
                    local ____temp_0
                    if side == "LEFT" then
                        ____temp_0 = -center
                    else
                        ____temp_0 = center
                    end
                    local x = ____temp_0
                    rail:SetPoint("TOP" .. side, x, -cornerDepth)
                    rail:SetPoint("BOTTOM" .. side, x, 0)
                end
            )
            local bottom = ____exports.createAtlasTexture(frame, ATLAS.railHorizontal, "OVERLAY")
            bottom:SetPoint("BOTTOMLEFT", 0, -center)
            bottom:SetPoint("BOTTOMRIGHT", 0, -center)
        end
        --- Points an existing texture at another atlas piece, keeping its size.
        function ____exports.setAtlasPiece(texture, piece)
            texture:SetTexCoord(piece.left, piece.right, piece.top, piece.bottom)
        end
        return ____exports
    end
)
