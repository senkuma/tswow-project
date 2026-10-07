import { RETAIL_SPEC_BACKGROUNDS, RetailClass } from "./TalentArt";

interface ClassArt {
    retailClass: RetailClass;
    /** Retail specialization (index into its backgrounds) for each talent tree, in tab order. */
    specByTree: number[];
}

const IN_ORDER = [0, 1, 2];

/**
 * Retail specialization art for each class file. WotLK trees follow the
 * retail spec order except for druids, whose Restoration is retail's fourth
 * spec after Guardian. Custom classes borrow the art of their closest class.
 */
const CLASS_ART: Record<string, ClassArt> = {
    DEATHKNIGHT: { retailClass: 'DeathKnight', specByTree: IN_ORDER },
    DRUID: { retailClass: 'Druid', specByTree: [0, 1, 3] },
    HUNTER: { retailClass: 'Hunter', specByTree: IN_ORDER },
    MAGE: { retailClass: 'Mage', specByTree: IN_ORDER },
    PALADIN: { retailClass: 'Paladin', specByTree: IN_ORDER },
    PRIEST: { retailClass: 'Priest', specByTree: IN_ORDER },
    ROGUE: { retailClass: 'Rogue', specByTree: IN_ORDER },
    SHAMAN: { retailClass: 'Shaman', specByTree: IN_ORDER },
    WARLOCK: { retailClass: 'Warlock', specByTree: IN_ORDER },
    WARRIOR: { retailClass: 'Warrior', specByTree: IN_ORDER },
    MONK: { retailClass: 'Monk', specByTree: IN_ORDER },
    BATTLEMAGE: { retailClass: 'Mage', specByTree: IN_ORDER },
    MOUNTAINKING: { retailClass: 'Warrior', specByTree: IN_ORDER },
    MARAUDER: { retailClass: 'Rogue', specByTree: IN_ORDER },
};

const FALLBACK_ART: ClassArt = CLASS_ART.WARRIOR;

/** The background texture for a class's talent tree (0-based tree index). */
export function specBackground(classFile: string, tree: number): string {
    const art = CLASS_ART[classFile] ?? FALLBACK_ART;
    const backgrounds = RETAIL_SPEC_BACKGROUNDS[art.retailClass];
    const spec = art.specByTree[tree] ?? 0;
    return backgrounds[Math.min(spec, backgrounds.length - 1)];
}
