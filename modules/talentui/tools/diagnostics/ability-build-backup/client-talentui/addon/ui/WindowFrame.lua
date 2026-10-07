local ____lualib = require("lualib_bundle")
local __TS__StringEndsWith = ____lualib.__TS__StringEndsWith
local __TS__StringStartsWith = ____lualib.__TS__StringStartsWith
tstl_register_module(
    "TSAddons.talentui.addon.ui.WindowFrame",
    function()
        local ____exports = {}
        local ____TalentArt = require("TSAddons.talentui.addon.ui.TalentArt")
        local ATLAS = ____TalentArt.ATLAS
        local PARTS_TEXTURE = ____TalentArt.PARTS_TEXTURE
        --- Points an existing texture at another atlas piece, keeping its size.
        function ____exports.setAtlasPiece(texture, piece)
            texture:SetTexCoord(piece.left, piece.right, piece.top, piece.bottom)
        end
        --- A texture showing one atlas piece at its display size.
        function ____exports.createAtlasTexture(frame, piece, layer)
            local texture = frame:CreateTexture(nil, layer)
            texture:SetTexture(PARTS_TEXTURE)
            ____exports.setAtlasPiece(texture, piece)
            texture:SetSize(piece.width, piece.height)
            return texture
        end
        --- Places a piece in a corner, reaching past the frame's edges by its outsets.
        local function placeCorner(frame, piece, corner)
            local texture = ____exports.createAtlasTexture(frame, piece, "OVERLAY")
            local ____corner_endsWith_result_0
            if __TS__StringEndsWith(corner, "LEFT") then
                ____corner_endsWith_result_0 = -piece.outsetX
            else
                ____corner_endsWith_result_0 = piece.outsetX
            end
            local x = ____corner_endsWith_result_0
            local ____corner_startsWith_result_1
            if __TS__StringStartsWith(corner, "TOP") then
                ____corner_startsWith_result_1 = piece.outsetY
            else
                ____corner_startsWith_result_1 = -piece.outsetY
            end
            local y = ____corner_startsWith_result_1
            texture:SetPoint(corner, x, y)
        end
        --- The stone title bar between the top corners. It is repeated rather than
        -- stretched, which would smear its scratches; the last tile is cut to fit.
        local function addTitleBar(frame, width)
            local tile = ATLAS.frameTitle
            local start = ATLAS.frameTopLeft.width - ATLAS.frameTopLeft.outsetX
            local ____end = width - (ATLAS.frameTopRight.width - ATLAS.frameTopRight.outsetX)
            do
                local x = start
                while x < ____end do
                    local tileWidth = math.min(tile.width, ____end - x)
                    local texture = ____exports.createAtlasTexture(frame, tile, "OVERLAY")
                    texture:SetWidth(tileWidth)
                    texture:SetTexCoord(tile.left, tile.left + (tile.right - tile.left) * tileWidth / tile.width, tile.top, tile.bottom)
                    texture:SetPoint("TOPLEFT", x, 0)
                    x = x + tile.width
                end
            end
        end
        --- The retail window frame of Dragonflight and later: metal corners, a stone
        -- title bar and thin rails, every piece placed so its rail runs along the
        -- frame's edge. The rails are uniform along their length and stretch cleanly.
        function ____exports.addWindowFrame(frame, width)
            placeCorner(frame, ATLAS.frameTopLeft, "TOPLEFT")
            placeCorner(frame, ATLAS.frameTopRight, "TOPRIGHT")
            placeCorner(frame, ATLAS.frameBottomLeft, "BOTTOMLEFT")
            placeCorner(frame, ATLAS.frameBottomRight, "BOTTOMRIGHT")
            addTitleBar(frame, width)
            local left = ____exports.createAtlasTexture(frame, ATLAS.frameLeft, "OVERLAY")
            left:SetPoint("TOPLEFT", -ATLAS.frameLeft.outsetX, -ATLAS.frameTopLeft.height)
            left:SetPoint("BOTTOMLEFT", -ATLAS.frameLeft.outsetX, ATLAS.frameBottomLeft.height - ATLAS.frameBottomLeft.outsetY)
            local right = ____exports.createAtlasTexture(frame, ATLAS.frameRight, "OVERLAY")
            right:SetPoint("TOPRIGHT", ATLAS.frameRight.outsetX, -ATLAS.frameTopRight.height)
            right:SetPoint("BOTTOMRIGHT", ATLAS.frameRight.outsetX, ATLAS.frameBottomRight.height - ATLAS.frameBottomRight.outsetY)
            local bottom = ____exports.createAtlasTexture(frame, ATLAS.frameBottom, "OVERLAY")
            bottom:SetPoint("BOTTOMLEFT", ATLAS.frameBottomLeft.width - ATLAS.frameBottomLeft.outsetX, -ATLAS.frameBottom.outsetY)
            bottom:SetPoint("BOTTOMRIGHT", -(ATLAS.frameBottomRight.width - ATLAS.frameBottomRight.outsetX), -ATLAS.frameBottom.outsetY)
        end
        return ____exports
    end
)
