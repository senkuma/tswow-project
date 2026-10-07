local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local ____exports = {}
local applyLevel, killedCreature, LEVEL_ENCHANTMENT_SLOT, CREATURE_TYPE_CRITTER, CREATURE_TYPE_TOTEM, CREATURE_TYPE_NON_COMBAT_PET, CREATURE_FLAG_EXTRA_NO_XP, CREATURE_FLAG_EXTRA_DUNGEON_BOSS
local ____ClientMessages = require("livescripts.ClientMessages")
local sendLevelUp = ____ClientMessages.sendLevelUp
local sendState = ____ClientMessages.sendState
local ____GrowingWeaponData = require("livescripts.GrowingWeaponData")
local GROWING_WEAPONS = ____GrowingWeaponData.GROWING_WEAPONS
local ____GrowthRules = require("livescripts.GrowthRules")
local grow = ____GrowthRules.grow
local killExperience = ____GrowthRules.killExperience
local levelCap = ____GrowthRules.levelCap
local ____ProgressStore = require("livescripts.ProgressStore")
local progressOf = ____ProgressStore.progressOf
local saveProgress = ____ProgressStore.saveProgress
--- Calls `action` for every growing weapon the player carries or wears (the bank is not searched).
function ____exports.forEachOwnedWeapon(player, action)
    __TS__ArrayForEach(
        GROWING_WEAPONS,
        function(____, weapon)
            local item = player:GetItemByEntry(weapon.item)
            if item ~= nil then
                action(item, weapon)
            end
        end
    )
end
function ____exports.addExperience(player, item, weapon, experience)
    local before = progressOf(item)
    local maxLevel = #weapon.levels
    local ____grow_result_2 = grow(
        before,
        experience,
        maxLevel,
        levelCap(
            maxLevel,
            player:GetLevel()
        )
    )
    local progress = ____grow_result_2.progress
    local levelsGained = ____grow_result_2.levelsGained
    if progress.level == before.level and progress.experience == before.experience then
        return
    end
    saveProgress(item, progress)
    if levelsGained > 0 then
        applyLevel(item, weapon, progress.level)
        player:SendBroadcastMessage(((("|cffe6cc80" .. item:GetTemplate():GetName()) .. "|r has reached level ") .. tostring(progress.level)) .. "!")
    end
    sendState(player, weapon, progress)
    if levelsGained > 0 then
        sendLevelUp(player, weapon, before.level, progress.level)
    end
end
function applyLevel(item, weapon, level)
    local enchantment = weapon.levels[level].enchantment
    if item:GetEnchantmentID(LEVEL_ENCHANTMENT_SLOT) == enchantment then
        return
    end
    if not item:SetEnchantment(enchantment, LEVEL_ENCHANTMENT_SLOT) then
        print(((("[growingweapons] Could not set enchantment " .. tostring(enchantment)) .. " on item ") .. tostring(item:GetGUIDLow())) .. ".")
    end
end
function killedCreature(killed)
    local template = killed:GetTemplate()
    local ____type = template:GetType()
    local flagsExtra = template:GetFlagsExtra()
    return {
        level = killed:GetLevel(),
        rank = template:GetRank(),
        isDungeonBoss = flagsExtra & CREATURE_FLAG_EXTRA_DUNGEON_BOSS ~= 0,
        givesExperience = ____type ~= CREATURE_TYPE_CRITTER and ____type ~= CREATURE_TYPE_TOTEM and ____type ~= CREATURE_TYPE_NON_COMBAT_PET and flagsExtra & CREATURE_FLAG_EXTRA_NO_XP == 0
    }
end
LEVEL_ENCHANTMENT_SLOT = 5
local WEAPON_SLOTS = {15, 16, 17}
CREATURE_TYPE_CRITTER = 8
CREATURE_TYPE_TOTEM = 11
CREATURE_TYPE_NON_COMBAT_PET = 12
CREATURE_FLAG_EXTRA_NO_XP = 64
CREATURE_FLAG_EXTRA_DUNGEON_BOSS = 268435456
local WEAPONS_BY_ITEM = {}
__TS__ArrayForEach(
    GROWING_WEAPONS,
    function(____, weapon)
        local ____weapon_0 = weapon
        WEAPONS_BY_ITEM[weapon.item] = ____weapon_0
        return ____weapon_0
    end
)
function ____exports.registerWeaponGrowth(events)
    events.Player:OnCreatureKill(function(player, killed)
        local experience = killExperience(
            killedCreature(killed),
            player:GetLevel()
        )
        if experience == 0 then
            return
        end
        __TS__ArrayForEach(
            WEAPON_SLOTS,
            function(____, slot)
                local item = player:GetEquippedItemBySlot(slot)
                local ____temp_1
                if item == nil then
                    ____temp_1 = nil
                else
                    ____temp_1 = WEAPONS_BY_ITEM[item:GetEntry()]
                end
                local weapon = ____temp_1
                if item ~= nil and weapon ~= nil then
                    ____exports.addExperience(player, item, weapon, experience)
                end
            end
        )
    end)
    events.Player:OnLevelChanged(function(player) return ____exports.forEachOwnedWeapon(
        player,
        function(item, weapon) return ____exports.addExperience(player, item, weapon, 0) end
    ) end)
    events.Player:OnLogin(function(player) return ____exports.forEachOwnedWeapon(
        player,
        function(item, weapon) return applyLevel(
            item,
            weapon,
            progressOf(item).level
        ) end
    ) end)
end
return ____exports
