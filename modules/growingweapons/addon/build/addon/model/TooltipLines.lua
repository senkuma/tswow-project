local ____lualib = require("lualib_bundle")
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
local __TS__ArraySplice = ____lualib.__TS__ArraySplice
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__Number = ____lualib.__TS__Number
local __TS__ObjectAssign = ____lualib.__TS__ObjectAssign
local __TS__StringReplace = ____lualib.__TS__StringReplace
local __TS__ArrayIndexOf = ____lualib.__TS__ArrayIndexOf
tstl_register_module(
    "TSAddons.growingweapons.addon.model.TooltipLines",
    function()
        local ____exports = {}
        local growDamage, weaponSpeed, isPrimary, primaryLine, equipLine, findLine, matches, PRIMARY_STATS, PLUS_SIGN, SPEED_NUMBER, WHITE, GREEN
        local ____TooltipTemplates = require("TSAddons.growingweapons.addon.model.TooltipTemplates")
        local grownDamage = ____TooltipTemplates.grownDamage
        local templatePattern = ____TooltipTemplates.templatePattern
        local ____WeaponProgress = require("TSAddons.growingweapons.addon.model.WeaponProgress")
        local WEAPON_DAMAGE = ____WeaponProgress.WEAPON_DAMAGE
        function growDamage(lines, state, strings)
            local damageFormat = strings("DAMAGE_TEMPLATE")
            local ____temp_1
            if damageFormat == nil then
                ____temp_1 = nil
            else
                ____temp_1 = templatePattern(damageFormat)
            end
            local damagePattern = ____temp_1
            local damageIndex = damagePattern == nil and -1 or findLine(lines, damagePattern)
            if damageFormat == nil or damagePattern == nil or damageIndex < 0 then
                return nil
            end
            local dpsFormat = strings("DPS_TEMPLATE")
            local dpsIndex = damageIndex + 1
            local hasDps = dpsFormat ~= nil and dpsIndex < #lines and matches(
                lines[dpsIndex + 1].left,
                templatePattern(dpsFormat)
            )
            local bonus = __TS__ArrayFind(
                state.bonuses,
                function(____, candidate) return candidate.key == WEAPON_DAMAGE end
            )
            if bonus ~= nil and bonus.amount > 0 then
                local damageLine = lines[damageIndex + 1]
                local min, max = strmatch(damageLine.left, damagePattern)
                local damage = grownDamage(
                    __TS__Number(min),
                    __TS__Number(max),
                    bonus.amount,
                    weaponSpeed(damageLine)
                )
                lines[damageIndex + 1] = __TS__ObjectAssign(
                    {},
                    damageLine,
                    {left = format(damageFormat, damage.min, damage.max)}
                )
                if hasDps and damage.dps ~= nil then
                    lines[dpsIndex + 1] = __TS__ObjectAssign(
                        {},
                        lines[dpsIndex + 1],
                        {left = format(dpsFormat, damage.dps)}
                    )
                end
            end
            local ____hasDps_2
            if hasDps then
                ____hasDps_2 = dpsIndex
            else
                ____hasDps_2 = damageIndex
            end
            return ____hasDps_2
        end
        function weaponSpeed(damageLine)
            local speed = strmatch(damageLine.right or "", SPEED_NUMBER)
            local ____temp_3
            if speed == nil then
                ____temp_3 = nil
            else
                ____temp_3 = __TS__Number(__TS__StringReplace(speed, ",", "."))
            end
            return ____temp_3
        end
        function isPrimary(bonus)
            return __TS__ArrayIndexOf(PRIMARY_STATS, bonus.key) >= 0
        end
        function primaryLine(bonus, strings)
            local statFormat = strings("ITEM_MOD_" .. bonus.key)
            local ____temp_4
            if statFormat == nil then
                ____temp_4 = (("+" .. tostring(bonus.amount)) .. " ") .. bonus.label
            else
                ____temp_4 = format(statFormat, PLUS_SIGN, bonus.amount)
            end
            local text = ____temp_4
            return {left = text, leftColor = WHITE}
        end
        function equipLine(bonus, strings)
            local trigger = strings("ITEM_SPELL_TRIGGER_ONEQUIP") or "Equip:"
            local statFormat = strings("ITEM_MOD_" .. bonus.key)
            local ____temp_5
            if statFormat == nil then
                ____temp_5 = (("+" .. tostring(bonus.amount)) .. " ") .. bonus.label
            else
                ____temp_5 = format(statFormat, bonus.amount)
            end
            local effect = ____temp_5
            return {left = (trigger .. " ") .. effect, leftColor = GREEN}
        end
        function findLine(lines, pattern)
            do
                local index = 1
                while index < #lines do
                    if matches(lines[index + 1].left, pattern) then
                        return index
                    end
                    index = index + 1
                end
            end
            return -1
        end
        function matches(text, pattern)
            return strmatch(text, pattern) ~= nil
        end
        --- Name of the server's level enchantment, which the client prints as a green
        -- line of its own (datascripts/LevelEnchantment.ts names it).
        local LEVEL_ENCHANTMENT_NAME = "Awakened Power (Level %d)"
        PRIMARY_STATS = {
            "STRENGTH",
            "AGILITY",
            "STAMINA",
            "INTELLECT",
            "SPIRIT"
        }
        PLUS_SIGN = 43
        SPEED_NUMBER = "(%d+[%.,]%d+)"
        WHITE = {1, 1, 1}
        GREEN = {0, 1, 0}
        --- An item tooltip's lines as if the weapon's grown bonuses were on the item:
        -- damage and damage per second include the weapon damage bonus, primary
        -- stats follow them as white lines and ratings follow the requirements as
        -- "Equip:" lines, as on any item. The level enchantment's own line goes, as
        -- the progress panel lists the bonuses.
        function ____exports.growTooltipLines(lines, state, strings)
            local enchantmentPattern = templatePattern(LEVEL_ENCHANTMENT_NAME)
            local grown = __TS__ArrayFilter(
                lines,
                function(____, line) return not matches(line.left, enchantmentPattern) end
            )
            local stats = __TS__ArrayFilter(
                state.bonuses,
                function(____, bonus) return bonus.key ~= WEAPON_DAMAGE and bonus.amount > 0 end
            )
            local lastDamageLine = growDamage(grown, state, strings)
            if lastDamageLine ~= nil then
                local primary = __TS__ArrayMap(
                    __TS__ArrayFilter(
                        stats,
                        function(____, bonus) return isPrimary(bonus) end
                    ),
                    function(____, bonus) return primaryLine(bonus, strings) end
                )
                __TS__ArraySplice(
                    grown,
                    lastDamageLine + 1,
                    0,
                    unpack(primary)
                )
            end
            local equip = __TS__ArrayMap(
                __TS__ArrayFilter(
                    stats,
                    function(____, bonus) return not isPrimary(bonus) end
                ),
                function(____, bonus) return equipLine(bonus, strings) end
            )
            local minLevelFormat = strings("ITEM_MIN_LEVEL")
            local requirement = minLevelFormat == nil and -1 or findLine(
                grown,
                templatePattern(minLevelFormat)
            )
            local ____temp_0
            if requirement >= 0 then
                ____temp_0 = requirement + 1
            else
                ____temp_0 = #grown
            end
            __TS__ArraySplice(
                grown,
                ____temp_0,
                0,
                unpack(equip)
            )
            return grown
        end
        return ____exports
    end
)
