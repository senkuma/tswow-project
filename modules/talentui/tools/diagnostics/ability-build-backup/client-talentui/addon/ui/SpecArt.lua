--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.talentui.addon.ui.SpecArt",
    function()
        local ____exports = {}
        local ____TalentArt = require("TSAddons.talentui.addon.ui.TalentArt")
        local RETAIL_SPEC_BACKGROUNDS = ____TalentArt.RETAIL_SPEC_BACKGROUNDS
        local IN_ORDER = {0, 1, 2}
        --- Retail specialization art for each class file. WotLK trees follow the
        -- retail spec order except for druids, whose Restoration is retail's fourth
        -- spec after Guardian. Custom classes borrow the art of their closest class.
        local CLASS_ART = {
            DEATHKNIGHT = {retailClass = "DeathKnight", specByTree = IN_ORDER},
            DRUID = {retailClass = "Druid", specByTree = {0, 1, 3}},
            HUNTER = {retailClass = "Hunter", specByTree = IN_ORDER},
            MAGE = {retailClass = "Mage", specByTree = IN_ORDER},
            PALADIN = {retailClass = "Paladin", specByTree = IN_ORDER},
            PRIEST = {retailClass = "Priest", specByTree = IN_ORDER},
            ROGUE = {retailClass = "Rogue", specByTree = IN_ORDER},
            SHAMAN = {retailClass = "Shaman", specByTree = IN_ORDER},
            WARLOCK = {retailClass = "Warlock", specByTree = IN_ORDER},
            WARRIOR = {retailClass = "Warrior", specByTree = IN_ORDER},
            MONK = {retailClass = "Monk", specByTree = IN_ORDER},
            BATTLEMAGE = {retailClass = "Mage", specByTree = IN_ORDER},
            MOUNTAINKING = {retailClass = "Warrior", specByTree = IN_ORDER},
            MARAUDER = {retailClass = "Rogue", specByTree = IN_ORDER}
        }
        local FALLBACK_ART = CLASS_ART.WARRIOR
        --- The background texture for a class's talent tree (0-based tree index).
        function ____exports.specBackground(classFile, tree)
            local art = CLASS_ART[classFile] or FALLBACK_ART
            local backgrounds = RETAIL_SPEC_BACKGROUNDS[art.retailClass]
            local spec = art.specByTree[tree + 1] or 0
            return backgrounds[math.min(spec, #backgrounds - 1) + 1]
        end
        return ____exports
    end
)
