/**
 * How growing weapons earn experience and level, free of server APIs so the
 * rules can be tested on their own.
 *
 * While its wielder levels, a weapon cannot outgrow them: its level is capped
 * at theirs, and experience earned at the cap waits in a full bar until they
 * level too. At the maximum player level the cap lifts and the weapon can
 * climb its remaining levels, which take far more kills.
 */
export const MAX_PLAYER_LEVEL = 80;

export interface KilledCreature {
    level: number;
    /** creature_template rank: 0 normal, 1 elite, 2 rare elite, 3 boss, 4 rare. */
    rank: number;
    isDungeonBoss: boolean;
    /** False for critters, totems and creatures flagged to give no experience. */
    givesExperience: boolean;
}

export interface WeaponProgress {
    level: number;
    experience: number;
}

const RANK_MULTIPLIERS = [1, 2.5, 4, 10, 3];
const BOSS_MULTIPLIER = 10;

const BASE_KILL_EXPERIENCE = 20;
const KILL_EXPERIENCE_PER_LEVEL = 5;

/** The highest creature level that is trivial (gray) to a player, as TrinityCore computes it. */
export function grayLevel(playerLevel: number) {
    if (playerLevel <= 5) {
        return 0;
    }
    if (playerLevel <= 39) {
        return playerLevel - 5 - Math.floor(playerLevel / 10);
    }
    if (playerLevel <= 59) {
        return playerLevel - 1 - Math.floor(playerLevel / 5);
    }
    return playerLevel - 9;
}

function normalKillExperience(creatureLevel: number) {
    return BASE_KILL_EXPERIENCE + KILL_EXPERIENCE_PER_LEVEL * creatureLevel;
}

export function killExperience(creature: KilledCreature, playerLevel: number) {
    if (!creature.givesExperience || creature.level <= grayLevel(playerLevel)) {
        return 0;
    }
    const rankMultiplier = RANK_MULTIPLIERS[creature.rank] ?? 1;
    const multiplier = creature.isDungeonBoss ? Math.max(rankMultiplier, BOSS_MULTIPLIER) : rankMultiplier;
    return Math.round(normalKillExperience(creature.level) * multiplier);
}

/**
 * Kills of creatures at the weapon's level that the next level takes. While
 * leveling this stays below the player's own pace, so the weapon keeps up
 * with its wielder; past the maximum player level it climbs steeply.
 */
function killsToNextLevel(weaponLevel: number) {
    return weaponLevel < MAX_PLAYER_LEVEL
        ? 4 + Math.floor(weaponLevel / 8)
        : 25 + 5 * (weaponLevel - MAX_PLAYER_LEVEL);
}

export function experienceToNextLevel(weaponLevel: number) {
    return killsToNextLevel(weaponLevel) * normalKillExperience(Math.min(weaponLevel, MAX_PLAYER_LEVEL));
}

/** The highest level the weapon may reach now. */
export function levelCap(maxLevel: number, playerLevel: number) {
    return playerLevel >= MAX_PLAYER_LEVEL ? maxLevel : Math.min(maxLevel, playerLevel);
}

export interface Growth {
    progress: WeaponProgress;
    levelsGained: number;
}

/** Adds experience (none to only apply a raised cap), levelling up as far as the cap allows. */
export function grow(progress: WeaponProgress, experience: number, maxLevel: number, cap: number): Growth {
    let level = progress.level;
    let remaining = progress.experience + experience;
    let levelsGained = 0;
    while (level < cap && remaining >= experienceToNextLevel(level)) {
        remaining -= experienceToNextLevel(level);
        level++;
        levelsGained++;
    }
    if (level >= maxLevel) {
        remaining = 0;
    } else if (level >= cap) {
        remaining = Math.min(remaining, experienceToNextLevel(level));
    }
    return { progress: { level, experience: remaining }, levelsGained };
}
