--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
--- How growing weapons earn experience and level, free of server APIs so the
-- rules can be tested on their own.
-- 
-- While its wielder levels, a weapon cannot outgrow them: its level is capped
-- at theirs, and experience earned at the cap waits in a full bar until they
-- level too. At the maximum player level the cap lifts and the weapon can
-- climb its remaining levels, which take far more kills.
____exports.MAX_PLAYER_LEVEL = 80
local RANK_MULTIPLIERS = {
    1,
    2.5,
    4,
    10,
    3
}
local BOSS_MULTIPLIER = 10
local BASE_KILL_EXPERIENCE = 20
local KILL_EXPERIENCE_PER_LEVEL = 5
--- The highest creature level that is trivial (gray) to a player, as TrinityCore computes it.
function ____exports.grayLevel(playerLevel)
    if playerLevel <= 5 then
        return 0
    end
    if playerLevel <= 39 then
        return playerLevel - 5 - math.floor(playerLevel / 10)
    end
    if playerLevel <= 59 then
        return playerLevel - 1 - math.floor(playerLevel / 5)
    end
    return playerLevel - 9
end
local function normalKillExperience(creatureLevel)
    return BASE_KILL_EXPERIENCE + KILL_EXPERIENCE_PER_LEVEL * creatureLevel
end
function ____exports.killExperience(creature, playerLevel)
    if not creature.givesExperience or creature.level <= ____exports.grayLevel(playerLevel) then
        return 0
    end
    local rankMultiplier = RANK_MULTIPLIERS[creature.rank + 1] or 1
    local multiplier = creature.isDungeonBoss and math.max(rankMultiplier, BOSS_MULTIPLIER) or rankMultiplier
    return math.floor(normalKillExperience(creature.level) * multiplier + 0.5)
end
--- Kills of creatures at the weapon's level that the next level takes. While
-- leveling this stays below the player's own pace, so the weapon keeps up
-- with its wielder; past the maximum player level it climbs steeply.
local function killsToNextLevel(weaponLevel)
    return weaponLevel < ____exports.MAX_PLAYER_LEVEL and 4 + math.floor(weaponLevel / 8) or 25 + 5 * (weaponLevel - ____exports.MAX_PLAYER_LEVEL)
end
function ____exports.experienceToNextLevel(weaponLevel)
    return killsToNextLevel(weaponLevel) * normalKillExperience(math.min(weaponLevel, ____exports.MAX_PLAYER_LEVEL))
end
--- The highest level the weapon may reach now.
function ____exports.levelCap(maxLevel, playerLevel)
    return playerLevel >= ____exports.MAX_PLAYER_LEVEL and maxLevel or math.min(maxLevel, playerLevel)
end
--- Adds experience (none to only apply a raised cap), levelling up as far as the cap allows.
function ____exports.grow(progress, experience, maxLevel, cap)
    local level = progress.level
    local remaining = progress.experience + experience
    local levelsGained = 0
    while level < cap and remaining >= ____exports.experienceToNextLevel(level) do
        remaining = remaining - ____exports.experienceToNextLevel(level)
        level = level + 1
        levelsGained = levelsGained + 1
    end
    if level >= maxLevel then
        remaining = 0
    elseif level >= cap then
        remaining = math.min(
            remaining,
            ____exports.experienceToNextLevel(level)
        )
    end
    return {progress = {level = level, experience = remaining}, levelsGained = levelsGained}
end
return ____exports
