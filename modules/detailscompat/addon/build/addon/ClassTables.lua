local ____lualib = require("lualib_bundle")
local __TS__ObjectKeys = ____lualib.__TS__ObjectKeys
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
tstl_register_module(
    "TSAddons.detailscompat.addon.ClassTables",
    function()
        local ____exports = {}
        local toByte
        local ____DetailsIconLayout = require("TSAddons.detailscompat.addon.DetailsIconLayout")
        local DETAILS_ICON_COORDS = ____DetailsIconLayout.DETAILS_ICON_COORDS
        function toByte(value)
            return math.floor(value * 255 + 0.5)
        end
        --- Colors as "ffRRGGBB" strings, which Details wraps in |c...|r for player names; it only adds the stock classes'.
        function ____exports.addColorStrings()
            local colors = _G.RAID_CLASS_COLORS
            __TS__ArrayForEach(
                __TS__ObjectKeys(colors),
                function(____, className)
                    local color = colors[className]
                    if color.colorStr == nil then
                        color.colorStr = format(
                            "ff%02x%02x%02x",
                            toByte(color.r),
                            toByte(color.g),
                            toByte(color.b)
                        )
                    end
                end
            )
        end
        --- Gives Details the custom classes' colors, and every icon's place on the
        -- class icon sheets rebuilt by tools/build_details_icons.py.
        function ____exports.addClassesToDetails(details)
            if details.class_colors == nil or details.class_coords == nil then
                return
            end
            local colors = _G.RAID_CLASS_COLORS
            local classes = _G.CLASS_SORT_ORDER
            __TS__ArrayForEach(
                classes,
                function(____, className)
                    local color = colors[className]
                    if details.class_colors[className] == nil and color ~= nil then
                        details.class_colors[className] = {color.r, color.g, color.b}
                    end
                end
            )
            __TS__ArrayForEach(
                __TS__ObjectKeys(DETAILS_ICON_COORDS),
                function(____, key)
                    details.class_coords[key] = {unpack(DETAILS_ICON_COORDS[key])}
                end
            )
        end
        return ____exports
    end
)
