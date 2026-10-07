import { WeaponProgress } from "./GrowthRules";

/** One weapon's progress in the characters database, keyed by the item's GUID. */
@CharactersTable
export class GrowingWeaponProgress extends DBEntry {
    @DBPrimaryKey
    itemGuid: uint32 = 0;
    @DBField
    level: uint32 = 1;
    @DBField
    experience: uint32 = 0;

    constructor(itemGuid: uint32) {
        super();
        this.itemGuid = itemGuid;
    }
}

// Kills come every few seconds, so rows are read once and kept.
const loaded: { [itemGuid: number]: GrowingWeaponProgress } = {};

/** A weapon's progress; level 1 with no experience until it first earns some. */
export function progressOf(item: TSItem): WeaponProgress {
    const row = rowOf(item);
    return { level: row.level, experience: row.experience };
}

export function saveProgress(item: TSItem, progress: WeaponProgress) {
    const row = rowOf(item);
    row.level = progress.level;
    row.experience = progress.experience;
    row.Save();
}

function rowOf(item: TSItem) {
    const guid = item.GetGUIDLow();
    let row = loaded[guid];
    if (row === undefined) {
        row = new GrowingWeaponProgress(guid);
        // Leaves the defaults in place when the weapon has no row yet.
        row.Load();
        loaded[guid] = row;
    }
    return row;
}
