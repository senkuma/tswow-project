"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.growingWeapons = growingWeapons;
exports.makeGrowingWeapon = makeGrowingWeapon;
var _growthCurve = require("./GrowthCurve");
var _levelEnchantment = require("./LevelEnchantment");
const ITEM_CLASS_WEAPON = 2;
const registered = [];
function growingWeapons() {
    return registered;
}
function makeGrowingWeapon(mod, item, definition) {
    validateItem(item);
    // Progress is per weapon, but the client can only tell weapons apart by item id.
    item.MaxCount.set(1);
    // The addon inserts the grown stats into the tooltip, which would misplace a vendor's sell price line.
    item.Price.set(0, 0);
    const table = (0, _growthCurve).growthTable(definition.growth);
    registered.push({
        item: item.ID,
        bonuses: table.bonuses,
        levels: table.levels.map((amounts, index)=>({
                enchantment: (0, _levelEnchantment).createLevelEnchantment(mod, `${definition.id}-level-${index + 1}`, index + 1, table.bonuses, amounts),
                amounts
            })
        )
    });
    return item;
}
function validateItem(item) {
    if (item.Class.getClass() !== ITEM_CLASS_WEAPON) {
        throw new Error(`Growing weapon ${item.ID} is not a weapon.`);
    }
    // The level enchantment lives in the socket bonus slot, which only socketed items use.
    let socketed = false;
    for(let index = 0; index < item.Socket.length; index++){
        socketed = socketed || !item.Socket.get(index).isClear();
    }
    if (socketed || item.SocketBonus.get() !== 0) {
        throw new Error(`Growing weapon ${item.ID} must not have sockets or a socket bonus.`);
    }
}

//# sourceMappingURL=GrowingWeapon.js.map