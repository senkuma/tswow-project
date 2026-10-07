local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__StringSplit = ____lualib.__TS__StringSplit
local __TS__ArraySlice = ____lualib.__TS__ArraySlice
local __TS__Number = ____lualib.__TS__Number
local __TS__NumberIsNaN = ____lualib.__TS__NumberIsNaN
local __TS__ArraySome = ____lualib.__TS__ArraySome
local __TS__ArrayMap = ____lualib.__TS__ArrayMap
local __TS__SparseArrayNew = ____lualib.__TS__SparseArrayNew
local __TS__SparseArrayPush = ____lualib.__TS__SparseArrayPush
local __TS__SparseArraySpread = ____lualib.__TS__SparseArraySpread
local __TS__ArrayEvery = ____lualib.__TS__ArrayEvery
tstl_register_module(
    "TSAddons.growingweapons.addon.model.WeaponProgress",
    function()
        local ____exports = {}
        local parseState, list, numbers, WEAPON_DAMAGE_LABEL
        --- The client's short name of a bonus ("Critical Strike Rating").
        function ____exports.bonusLabel(key)
            if key == ____exports.WEAPON_DAMAGE then
                return WEAPON_DAMAGE_LABEL
            end
            local label = _G[("ITEM_MOD_" .. key) .. "_SHORT"]
            return label or key
        end
        function parseState(fields)
            local item, level, maxLevel, experience, experienceToNext, cap = unpack(numbers(__TS__ArraySlice(fields, 1, 7)))
            local keys = list(fields[8])
            local amounts = numbers(list(fields[9]))
            local nextAmounts = numbers(list(fields[10]))
            local atMax = level >= maxLevel
            local ____array_0 = __TS__SparseArrayNew(
                item,
                level,
                maxLevel,
                experience,
                experienceToNext,
                cap,
                unpack(amounts)
            )
            __TS__SparseArrayPush(
                ____array_0,
                unpack(nextAmounts)
            )
            local valid = __TS__ArrayEvery(
                {__TS__SparseArraySpread(____array_0)},
                function(____, n) return not __TS__NumberIsNaN(__TS__Number(n)) end
            ) and #keys == #amounts and #nextAmounts == (atMax and 0 or #amounts)
            if not valid then
                return nil
            end
            return {
                item = item,
                level = level,
                maxLevel = maxLevel,
                experience = experience,
                experienceToNext = experienceToNext,
                cap = cap,
                bonuses = __TS__ArrayMap(
                    keys,
                    function(____, key, index)
                        local ____key_2 = key
                        local ____exports_bonusLabel_result_3 = ____exports.bonusLabel(key)
                        local ____amounts_index_4 = amounts[index + 1]
                        local ____atMax_1
                        if atMax then
                            ____atMax_1 = nil
                        else
                            ____atMax_1 = nextAmounts[index + 1]
                        end
                        return {key = ____key_2, label = ____exports_bonusLabel_result_3, amount = ____amounts_index_4, next = ____atMax_1}
                    end
                )
            }
        end
        function list(field)
            local ____temp_5
            if field == "" then
                ____temp_5 = {}
            else
                ____temp_5 = __TS__StringSplit(field, ",")
            end
            return ____temp_5
        end
        function numbers(fields)
            return __TS__ArrayMap(
                fields,
                function(____, field) return __TS__Number(field) end
            )
        end
        --- Growing weapon progress as the server reports it in addon messages
        -- (livescripts/ClientMessages.ts writes them):
        --   STATE;item;level;maxLevel;experience;experienceToNext;cap;bonuses;amounts;nextAmounts
        --   LEVELUP;item;level;gains
        ____exports.ADDON_PREFIX = "GROWWPN"
        --- The bonus that adds flat damage per swing; the others are stats named as the ITEM_MOD_* strings name them.
        ____exports.WEAPON_DAMAGE = "WEAPON_DAMAGE"
        WEAPON_DAMAGE_LABEL = "Weapon Damage"
        local STATE_FIELDS = 10
        local LEVEL_UP_FIELDS = 4
        function ____exports.isMaxLevel(state)
            return state.level >= state.maxLevel
        end
        --- Experience is held at a full bar while the weapon waits for its wielder to level.
        function ____exports.isHeldAtCap(state)
            return not ____exports.isMaxLevel(state) and state.level >= state.cap
        end
        --- How far the bar is filled, from 0 to 1.
        function ____exports.progressFraction(state)
            if ____exports.isMaxLevel(state) or state.experienceToNext <= 0 then
                return 1
            end
            return math.min(1, state.experience / state.experienceToNext)
        end
        --- The latest progress of every growing weapon the server has reported, by item id.
        ____exports.WeaponProgressStore = __TS__Class()
        local WeaponProgressStore = ____exports.WeaponProgressStore
        WeaponProgressStore.name = "WeaponProgressStore"
        function WeaponProgressStore.prototype.____constructor(self)
            self.states = {}
        end
        function WeaponProgressStore.prototype.stateOf(self, item)
            return self.states[item]
        end
        function WeaponProgressStore.prototype.apply(self, message)
            local fields = __TS__StringSplit(message, ";")
            if fields[1] == "STATE" and #fields == STATE_FIELDS then
                local state = parseState(fields)
                if state ~= nil then
                    self.states[state.item] = state
                    return {kind = "state", state = state}
                end
            elseif fields[1] == "LEVELUP" and #fields == LEVEL_UP_FIELDS then
                local levelUp = self:parseLevelUp(fields)
                if levelUp ~= nil then
                    return {kind = "levelUp", levelUp = levelUp}
                end
            end
            return nil
        end
        function WeaponProgressStore.prototype.parseLevelUp(self, fields)
            local item, level = unpack(numbers(__TS__ArraySlice(fields, 1, 3)))
            local gains = numbers(list(fields[4]))
            local state = self:stateOf(item)
            if not (level > 0) or __TS__ArraySome(
                gains,
                function(____, gain) return __TS__NumberIsNaN(__TS__Number(gain)) end
            ) or state == nil or #gains ~= #state.bonuses then
                return nil
            end
            return {
                item = item,
                level = level,
                gains = __TS__ArrayMap(
                    gains,
                    function(____, amount, index) return {label = state.bonuses[index + 1].label, amount = amount} end
                )
            }
        end
        return ____exports
    end
)
