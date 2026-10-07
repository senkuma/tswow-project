import { sendLevelUp, sendState } from "./ClientMessages";
import { GrowingWeapon } from "./GrowingWeapon";
import { GROWING_WEAPONS } from "./GrowingWeaponData";
import { grow, killExperience, KilledCreature, levelCap } from "./GrowthRules";
import { progressOf, saveProgress } from "./ProgressStore";

// EnchantmentSlot BONUS_ENCHANTMENT_SLOT. Socket bonuses are its only other
// use, and growing weapons have no sockets. TrinityCore applies every slot's
// enchantment while the weapon is equipped and saves it with the item.
const LEVEL_ENCHANTMENT_SLOT = 5;
// EquipmentSlots: main hand, off hand, ranged.
const WEAPON_SLOTS = [15, 16, 17];

const CREATURE_TYPE_CRITTER = 8;
const CREATURE_TYPE_TOTEM = 11;
const CREATURE_TYPE_NON_COMBAT_PET = 12;
const CREATURE_FLAG_EXTRA_NO_XP = 0x40;
const CREATURE_FLAG_EXTRA_DUNGEON_BOSS = 0x10000000;

const WEAPONS_BY_ITEM: { [item: number]: GrowingWeapon } = {};
GROWING_WEAPONS.forEach(weapon => WEAPONS_BY_ITEM[weapon.item] = weapon);

export function registerWeaponGrowth(events: TSEvents) {
    events.Player.OnCreatureKill((player, killed) => {
        const experience = killExperience(killedCreature(killed), player.GetLevel());
        if (experience === 0) {
            return;
        }
        WEAPON_SLOTS.forEach(slot => {
            const item = player.GetEquippedItemBySlot(slot);
            const weapon = item === undefined ? undefined : WEAPONS_BY_ITEM[item.GetEntry()];
            if (item !== undefined && weapon !== undefined) {
                addExperience(player, item, weapon, experience);
            }
        });
    });
    // A higher player level raises the cap, releasing experience stored at it.
    events.Player.OnLevelChanged(player =>
        forEachOwnedWeapon(player, (item, weapon) => addExperience(player, item, weapon, 0)));
    // Keeps enchantments in step with saved levels, also after a rebuild renumbers them.
    events.Player.OnLogin(player =>
        forEachOwnedWeapon(player, (item, weapon) => applyLevel(item, weapon, progressOf(item).level)));
}

/** Calls `action` for every growing weapon the player carries or wears (the bank is not searched). */
export function forEachOwnedWeapon(player: TSPlayer, action: (item: TSItem, weapon: GrowingWeapon) => void) {
    GROWING_WEAPONS.forEach(weapon => {
        const item = player.GetItemByEntry(weapon.item);
        if (item !== undefined) {
            action(item, weapon);
        }
    });
}

export function addExperience(player: TSPlayer, item: TSItem, weapon: GrowingWeapon, experience: number) {
    const before = progressOf(item);
    const maxLevel = weapon.levels.length;
    const { progress, levelsGained } = grow(before, experience, maxLevel, levelCap(maxLevel, player.GetLevel()));
    if (progress.level === before.level && progress.experience === before.experience) {
        return;
    }
    saveProgress(item, progress);
    if (levelsGained > 0) {
        applyLevel(item, weapon, progress.level);
        player.SendBroadcastMessage(`|cffe6cc80${item.GetTemplate().GetName()}|r has reached level ${progress.level}!`);
    }
    sendState(player, weapon, progress);
    if (levelsGained > 0) {
        sendLevelUp(player, weapon, before.level, progress.level);
    }
}

function applyLevel(item: TSItem, weapon: GrowingWeapon, level: number) {
    const enchantment = weapon.levels[level - 1].enchantment;
    if (item.GetEnchantmentID(LEVEL_ENCHANTMENT_SLOT) === enchantment) {
        return;
    }
    if (!item.SetEnchantment(enchantment, LEVEL_ENCHANTMENT_SLOT)) {
        console.log(`[growingweapons] Could not set enchantment ${enchantment} on item ${item.GetGUIDLow()}.`);
    }
}

function killedCreature(killed: TSCreature): KilledCreature {
    const template = killed.GetTemplate();
    const type = template.GetType();
    const flagsExtra = template.GetFlagsExtra();
    return {
        level: killed.GetLevel(),
        rank: template.GetRank(),
        isDungeonBoss: (flagsExtra & CREATURE_FLAG_EXTRA_DUNGEON_BOSS) !== 0,
        givesExperience: type !== CREATURE_TYPE_CRITTER && type !== CREATURE_TYPE_TOTEM
            && type !== CREATURE_TYPE_NON_COMBAT_PET && (flagsExtra & CREATURE_FLAG_EXTRA_NO_XP) === 0,
    };
}
