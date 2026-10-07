import { std } from "wow/wotlk";
import { ENDGAME_POWER_FACTOR, MAX_LEVEL } from "./EndgamePower";

// Game tables are 100 levels per block: row = block * 100 + (level - 1).
const LEVELS_PER_BLOCK = 100;
const MAX_LEVEL_ROW = MAX_LEVEL - 1;
// GtCombatRatings has one block per combat rating type (32 in 3.3.5).
const COMBAT_RATING_BLOCKS = 32;

// TSWoW loads this file by path while other modules import it through the
// "endgame" package link. Should those ever resolve to two module instances,
// the tables must still be scaled only once.
const APPLIED = Symbol.for('endgame.stat-conversions-applied');
const processState = globalThis as unknown as Record<symbol, boolean>;
if (!processState[APPLIED]) {
    processState[APPLIED] = true;
    scaleCombatRatings();
    scaleCritPerStat();
}

/**
 * Rating needed per 1% (crit, hit, haste, expertise, armor penetration, dodge,
 * parry, block, defense, resilience). Shared by all classes; read by both the
 * server and the client's character sheet.
 */
function scaleCombatRatings() {
    for (let rating = 0; rating < COMBAT_RATING_BLOCKS; ++rating) {
        const row = std.DBC.GtCombatRatings.getRow(rating * LEVELS_PER_BLOCK + MAX_LEVEL_ROW);
        row.Data.set(row.Data.get() * ENDGAME_POWER_FACTOR);
    }
}

/**
 * Crit chance per point of agility (which also drives dodge from agility) and
 * spell crit per point of intellect, one block per class.
 *
 * Custom classes copy their parent's rows when created, so whether they are
 * created before or after this runs, each class ends up scaled exactly once.
 */
function scaleCritPerStat() {
    std.DBC.ChrClasses.queryAll({}).forEach(cls => {
        const row = (cls.ID.get() - 1) * LEVELS_PER_BLOCK + MAX_LEVEL_ROW;
        [std.DBC.GtChanceToMeleeCrit, std.DBC.GtChanceToSpellCrit].forEach(table => {
            if (row < table.rowCount) {
                const entry = table.getRow(row);
                entry.Data.set(entry.Data.get() / ENDGAME_POWER_FACTOR);
            }
        });
    });
}
