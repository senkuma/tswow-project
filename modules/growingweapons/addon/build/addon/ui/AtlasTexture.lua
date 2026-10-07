--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.AtlasTexture",
    function()
        local ____exports = {}
        local ____WeaponArt = require("TSAddons.growingweapons.addon.ui.WeaponArt")
        local PARTS_TEXTURE = ____WeaponArt.PARTS_TEXTURE
        --- A texture showing one atlas piece at its display size.
        function ____exports.createAtlasTexture(frame, piece, layer)
            local texture = frame:CreateTexture(nil, layer)
            texture:SetTexture(PARTS_TEXTURE)
            texture:SetTexCoord(piece.left, piece.right, piece.top, piece.bottom)
            texture:SetSize(piece.width, piece.height)
            return texture
        end
        --- Shows the left `fraction` of a horizontal piece, as a status bar fill does.
        function ____exports.cropAtlasWidth(texture, piece, fraction)
            texture:SetWidth(piece.width * fraction)
            texture:SetTexCoord(piece.left, piece.left + (piece.right - piece.left) * fraction, piece.top, piece.bottom)
        end
        --- A black shade fading from `startAlpha` (left or bottom) to `endAlpha` (right or top).
        function ____exports.createShade(frame, layer, orientation, startAlpha, endAlpha)
            local texture = frame:CreateTexture(nil, layer)
            texture:SetTexture(1, 1, 1, 1)
            texture:SetGradientAlpha(
                orientation,
                0,
                0,
                0,
                startAlpha,
                0,
                0,
                0,
                endAlpha
            )
            return texture
        end
        return ____exports
    end
)
