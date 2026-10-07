--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
local ____WeaponCommand = require("livescripts.WeaponCommand")
local registerWeaponCommand = ____WeaponCommand.registerWeaponCommand
local ____WeaponGrowth = require("livescripts.WeaponGrowth")
local registerWeaponGrowth = ____WeaponGrowth.registerWeaponGrowth
function ____exports.Main(events)
    registerWeaponGrowth(events)
    registerWeaponCommand(events)
end
return ____exports
