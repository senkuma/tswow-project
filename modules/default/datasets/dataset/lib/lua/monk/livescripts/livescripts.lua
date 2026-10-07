--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local ____ChiAbilities = require("livescripts.ChiAbilities")
local registerChiAbilities = ____ChiAbilities.registerChiAbilities
local ____GearCommand = require("livescripts.GearCommand")
local registerGearCommand = ____GearCommand.registerGearCommand
local ____MistHealing = require("livescripts.MistHealing")
local registerMistHealing = ____MistHealing.registerMistHealing
local ____PersonalChi = require("livescripts.PersonalChi")
local registerPersonalChi = ____PersonalChi.registerPersonalChi
local ____SoothingMist = require("livescripts.SoothingMist")
local registerSoothingMist = ____SoothingMist.registerSoothingMist
function ____exports.Main(events)
    registerGearCommand(events)
    registerPersonalChi(events)
    registerChiAbilities(events)
    registerMistHealing(events)
    registerSoothingMist(events)
end
return ____exports
