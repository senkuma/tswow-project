--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
tstl_register_module(
    "TSAddons.commandpanel.addon.CommandCatalog",
    function()
        local ____exports = {}
        ____exports.COMMAND_SECTIONS = {
            {title = "Growing Weapons", buttons = {{label = "Get growing weapons", description = "Adds every growing weapon your class can use to your bags.", command = ".growingweapon add"}, {label = "Grant weapon XP", description = "Gives your carried and equipped growing weapons this much experience.", command = ".growingweapon xp", amount = {default = 5000}}}},
            {title = "Monk", buttons = {{label = "Jade Serpent gear", description = "Adds Battlegear of the Jade Serpent and its fist weapons to your bags.", command = ".monkgear"}}},
            {title = "Marauder", buttons = {{label = "Dreadcorsair gear", description = "Adds Dreadcorsair Battlegear and its weapons to your bags.", command = ".maraudergear"}}},
            {
                title = "Mountain King",
                buttons = {
                    {label = "Mountain King gear", description = "Adds Battlegear of the Mountain King to your bags.", command = ".mountainkinggear battlegear"},
                    {label = "Titanstorm gear", description = "Adds Titanstorm Battlegear to your bags.", command = ".mountainkinggear titanstorm"},
                    {
                        label = "Hero talents",
                        description = "Opens the hero talent window.",
                        command = "/hero",
                        classes = {"MOUNTAINKING"},
                        run = function()
                            local ____SlashCmdList_MKHERO_result_0 = SlashCmdList.MKHERO
                            if ____SlashCmdList_MKHERO_result_0 ~= nil then
                                ____SlashCmdList_MKHERO_result_0 = ____SlashCmdList_MKHERO_result_0("")
                            end
                            return ____SlashCmdList_MKHERO_result_0
                        end
                    },
                    {label = "Reset hero talents", description = "Forgets your hero talents so you can choose again.", command = ".mkhero reset", classes = {"MOUNTAINKING"}}
                }
            }
        }
        return ____exports
    end
)
