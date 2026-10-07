--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.talentui.addon.ui.TalentArt",
    function()
        local ____exports = {}
        ____exports.PARTS_TEXTURE = "Interface\\TalentUI\\Parts.tga"
        ____exports.ATLAS = {
            frameTopLeft = {
                width = 125,
                height = 59,
                left = 0.016602,
                right = 0.50293,
                top = 0.016602,
                bottom = 0.245117,
                outsetX = 0,
                outsetY = 0
            },
            frameTopRight = {
                width = 74,
                height = 59,
                left = 0.520508,
                right = 0.807617,
                top = 0.016602,
                bottom = 0.245117,
                outsetX = 3,
                outsetY = 0
            },
            frameBottomLeft = {
                width = 25.5,
                height = 31,
                left = 0.825195,
                right = 0.922852,
                top = 0.016602,
                bottom = 0.135742,
                outsetX = 0,
                outsetY = 3
            },
            frameBottomRight = {
                width = 27,
                height = 31,
                left = 0.016602,
                right = 0.120117,
                top = 0.262695,
                bottom = 0.381836,
                outsetX = 4,
                outsetY = 3
            },
            frameTitle = {
                width = 32,
                height = 26,
                left = 0.137695,
                right = 0.260742,
                top = 0.262695,
                bottom = 0.362305,
                outsetX = 0,
                outsetY = 0
            },
            frameBottom = {
                width = 32,
                height = 6,
                left = 0.27832,
                right = 0.401367,
                top = 0.262695,
                bottom = 0.28418,
                outsetX = 0,
                outsetY = 3
            },
            frameLeft = {
                width = 6.5,
                height = 16,
                left = 0.418945,
                right = 0.442383,
                top = 0.262695,
                bottom = 0.323242,
                outsetX = 0,
                outsetY = 0
            },
            frameRight = {
                width = 7,
                height = 16,
                left = 0.459961,
                right = 0.485352,
                top = 0.262695,
                bottom = 0.323242,
                outsetX = 4,
                outsetY = 0
            },
            squareLocked = {
                width = 64,
                height = 64,
                left = 0.50293,
                right = 0.625977,
                top = 0.262695,
                bottom = 0.385742,
                outsetX = 0,
                outsetY = 0
            },
            squareAvailable = {
                width = 64,
                height = 64,
                left = 0.643555,
                right = 0.766602,
                top = 0.262695,
                bottom = 0.385742,
                outsetX = 0,
                outsetY = 0
            },
            squareLearned = {
                width = 64,
                height = 64,
                left = 0.78418,
                right = 0.907227,
                top = 0.262695,
                bottom = 0.385742,
                outsetX = 0,
                outsetY = 0
            },
            circleLocked = {
                width = 64,
                height = 64,
                left = 0.016602,
                right = 0.139648,
                top = 0.40332,
                bottom = 0.526367,
                outsetX = 0,
                outsetY = 0
            },
            circleAvailable = {
                width = 64,
                height = 64,
                left = 0.157227,
                right = 0.280273,
                top = 0.40332,
                bottom = 0.526367,
                outsetX = 0,
                outsetY = 0
            },
            circleLearned = {
                width = 64,
                height = 64,
                left = 0.297852,
                right = 0.420898,
                top = 0.40332,
                bottom = 0.526367,
                outsetX = 0,
                outsetY = 0
            },
            undo = {
                width = 38,
                height = 36,
                left = 0.438477,
                right = 0.510742,
                top = 0.40332,
                bottom = 0.47168,
                outsetX = 0,
                outsetY = 0
            }
        }
        --- Height of the title bar of the frame.
        ____exports.TITLE_BAR_HEIGHT = 21
        --- Retail specialization backgrounds of each class, in retail specialization order.
        ____exports.RETAIL_SPEC_BACKGROUNDS = {
            DeathKnight = {"Interface\\TalentUI\\Backgrounds\\DeathKnight1", "Interface\\TalentUI\\Backgrounds\\DeathKnight2", "Interface\\TalentUI\\Backgrounds\\DeathKnight3"},
            Druid = {"Interface\\TalentUI\\Backgrounds\\Druid1", "Interface\\TalentUI\\Backgrounds\\Druid2", "Interface\\TalentUI\\Backgrounds\\Druid3", "Interface\\TalentUI\\Backgrounds\\Druid4"},
            Hunter = {"Interface\\TalentUI\\Backgrounds\\Hunter1", "Interface\\TalentUI\\Backgrounds\\Hunter2", "Interface\\TalentUI\\Backgrounds\\Hunter3"},
            Mage = {"Interface\\TalentUI\\Backgrounds\\Mage1", "Interface\\TalentUI\\Backgrounds\\Mage2", "Interface\\TalentUI\\Backgrounds\\Mage3"},
            Monk = {"Interface\\TalentUI\\Backgrounds\\Monk1", "Interface\\TalentUI\\Backgrounds\\Monk2", "Interface\\TalentUI\\Backgrounds\\Monk3"},
            Paladin = {"Interface\\TalentUI\\Backgrounds\\Paladin1", "Interface\\TalentUI\\Backgrounds\\Paladin2", "Interface\\TalentUI\\Backgrounds\\Paladin3"},
            Priest = {"Interface\\TalentUI\\Backgrounds\\Priest1", "Interface\\TalentUI\\Backgrounds\\Priest2", "Interface\\TalentUI\\Backgrounds\\Priest3"},
            Rogue = {"Interface\\TalentUI\\Backgrounds\\Rogue1", "Interface\\TalentUI\\Backgrounds\\Rogue2", "Interface\\TalentUI\\Backgrounds\\Rogue3"},
            Shaman = {"Interface\\TalentUI\\Backgrounds\\Shaman1", "Interface\\TalentUI\\Backgrounds\\Shaman2", "Interface\\TalentUI\\Backgrounds\\Shaman3"},
            Warlock = {"Interface\\TalentUI\\Backgrounds\\Warlock1", "Interface\\TalentUI\\Backgrounds\\Warlock2", "Interface\\TalentUI\\Backgrounds\\Warlock3"},
            Warrior = {"Interface\\TalentUI\\Backgrounds\\Warrior1", "Interface\\TalentUI\\Backgrounds\\Warrior2", "Interface\\TalentUI\\Backgrounds\\Warrior3"}
        }
        return ____exports
    end
)
