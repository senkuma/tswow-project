--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local ____GearCommand = require("livescripts.GearCommand")
local registerGearCommand = ____GearCommand.registerGearCommand
local ____HeroTalents = require("livescripts.hero.HeroTalents")
local registerHeroTalents = ____HeroTalents.registerHeroTalents
function ____exports.Main(events)
    registerGearCommand(events)
    registerHeroTalents(events)
end
return ____exports
