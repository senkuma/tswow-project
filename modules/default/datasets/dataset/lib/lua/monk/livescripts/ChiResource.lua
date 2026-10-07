--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
local ____exports = {}
--- The monk's Chi, kept in WotLK combo points. TrinityCore keeps combo points
-- on one unit; the Chi is held by the monk's enemy target, or by the monk
-- when they are not targeting an enemy, so it is theirs wherever they look.
-- The client shows the combo points held by the target or the monk.
____exports.MONK_CLASS = 15
function ____exports.monkOf(object)
    local ____temp_0
    if object == nil then
        ____temp_0 = nil
    else
        ____temp_0 = object:ToPlayer()
    end
    local player = ____temp_0
    return player ~= nil and player:GetClass() == ____exports.MONK_CLASS and player or nil
end
--- Neutral creatures count: they can be attacked, though they are not hostile until then.
function ____exports.isEnemy(monk, unit)
    return unit:IsAlive() and not monk:IsFriendlyTo(unit)
end
function ____exports.sameUnit(a, b)
    return a:GetGUIDLow() == b:GetGUIDLow() and a:IsPlayer() == b:IsPlayer()
end
--- Who should hold the monk's Chi while `target` is selected.
function ____exports.chiHolderFor(monk, target)
    return target ~= nil and ____exports.isEnemy(monk, target) and target or monk
end
--- The unit holding the monk's Chi, if they have any. Never call
-- GetComboTarget directly: TSWoW's dereferences the combo target unchecked
-- and crashes the server when there is none. A unit with combo points always
-- has one; with none, the last holder may also be an enemy long left behind.
function ____exports.chiHolder(monk)
    local ____temp_1
    if monk:GetComboPoints() > 0 then
        ____temp_1 = monk:GetComboTarget()
    else
        ____temp_1 = nil
    end
    return ____temp_1
end
--- Moves all of the monk's Chi onto `destination`.
function ____exports.moveChi(monk, destination)
    local holder = ____exports.chiHolder(monk)
    if holder == nil or ____exports.sameUnit(holder, destination) then
        return
    end
    monk:AddComboPoints(
        destination,
        monk:GetComboPoints()
    )
end
function ____exports.gainChi(monk, amount)
    local holder = ____exports.chiHolder(monk)
    monk:AddComboPoints(
        holder ~= nil and holder or ____exports.chiHolderFor(
            monk,
            monk:GetSelection()
        ),
        amount
    )
end
function ____exports.spendChi(monk, amount)
    local holder = ____exports.chiHolder(monk)
    if holder ~= nil then
        monk:AddComboPoints(holder, -amount)
    end
end
return ____exports
