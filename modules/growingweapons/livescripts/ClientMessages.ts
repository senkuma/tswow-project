import { GrowingWeapon } from "./GrowingWeapon";
import { experienceToNextLevel, levelCap, WeaponProgress } from "./GrowthRules";

/**
 * Addon messages to the growingweapons addon, which parses them in
 * addon/model/WeaponProgress.ts:
 *   STATE;item;level;maxLevel;experience;experienceToNext;cap;bonuses;amounts;nextAmounts;milestones
 *   LEVELUP;item;level;gains;awakened
 * Bonuses (AGILITY, CRIT_RATING, WEAPON_DAMAGE, ...) and amounts are comma
 * separated; amounts are the totals at a level,
 * gains what the level up added to them. experienceToNext is 0 and
 * nextAmounts empty at the maximum level. Milestones are comma separated
 * level:spell pairs, awakened the spells of the milestones the level up
 * reached; both are empty when there are none. STATE precedes its LEVELUP.
 */
const ADDON_PREFIX = 'GROWWPN';
// ChatMsg CHAT_MSG_WHISPER: addon whispers reach the client as CHAT_MSG_ADDON.
const CHAT_MSG_WHISPER = 7;

export function sendState(player: TSPlayer, weapon: GrowingWeapon, progress: WeaponProgress) {
    const maxLevel = weapon.levels.length;
    const atMax = progress.level >= maxLevel;
    const fields = [
        'STATE',
        `${weapon.item}`,
        `${progress.level}`,
        `${maxLevel}`,
        `${progress.experience}`,
        `${atMax ? 0 : experienceToNextLevel(progress.level)}`,
        `${levelCap(maxLevel, player.GetLevel())}`,
        weapon.bonuses.join(','),
        weapon.levels[progress.level - 1].amounts.join(','),
        atMax ? '' : weapon.levels[progress.level].amounts.join(','),
        weapon.milestones.map(({ level, spell }) => `${level}:${spell}`).join(','),
    ];
    send(player, fields.join(';'));
}

export function sendLevelUp(player: TSPlayer, weapon: GrowingWeapon, fromLevel: number, toLevel: number) {
    const before = weapon.levels[fromLevel - 1].amounts;
    const gains = weapon.levels[toLevel - 1].amounts.map((amount, index) => amount - before[index]);
    const awakened = weapon.milestones
        .filter(({ level }) => level > fromLevel && level <= toLevel)
        .map(({ spell }) => spell);
    send(player, `LEVELUP;${weapon.item};${toLevel};${gains.join(',')};${awakened.join(',')}`);
}

function send(player: TSPlayer, message: string) {
    player.SendAddonMessage(ADDON_PREFIX, message, CHAT_MSG_WHISPER, player);
}
