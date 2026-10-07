import { GrowthBonus, LevelAmounts } from "./GrowthCurve";
/**
 * The enchantment holding a weapon's total bonuses at one level. Weapon
 * damage and up to three stats are its own effects; when there are more
 * stats, effects instead cast passive spells of three stat auras each while
 * the weapon is equipped.
 */
export declare function createLevelEnchantment(mod: string, id: string, level: number, bonuses: GrowthBonus[], amounts: LevelAmounts): number;
