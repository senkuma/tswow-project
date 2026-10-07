import { hideFromCharacterCreation } from "classkit";
import { std } from "wow/wotlk";
import { BATTLE_MAGE_RACES, MODULE_NAME } from "./Constants";

const MAGE_CLASS_ID = 8;
const PALADIN_CLASS_ID = 2;
// Human is the only race that is both a mage and a paladin, so the difference
// between those two rows isolates the class difference from racial bonuses.
const REFERENCE_RACE_ID = 1;
// How far Battle Mage stats move from mage values towards paladin values.
const PALADIN_STAT_BLEND = 0.5;

export const BATTLE_MAGE = std.Classes.create(MODULE_NAME, 'battlemage', 'MAGE')
    .Name.enGB.set('Battle Mage')
    .UI.Color.set(0x8a4fff)
    .UI.Description.set(
        'Battle Mages are arcane warriors who forsake the frail robes of '
        + 'their order for plate armor, weaving destructive spells between '
        + 'blows of sword and mace.')
    .UI.Info.add('- Role: Tank, Damage (melee or caster)')
    .UI.Info.add('- Plate Armor, Shields')
    .UI.Info.add('- Swords, Maces, Staves')
    .UI.Info.add('- Uses mana as a resource')
    // INV_Sword_61 from the 3.3.5 client: an arcane-runed blade.
    .UI.setIcon(std.Image.readFromModule(MODULE_NAME, 'images/battle-mage-icon.png'))
    // Frostguard is a tank tree; the dungeon finder reads roles from here.
    .Roles.set(true, false, true)
    // Paladin formula (2 * Str) so melee attack power scales with strength.
    .Stats.MeleePowerType.set('PALADIN')
    // Stat tables are copied per race here, so races must be added before stats are tuned.
    .Races.add(BATTLE_MAGE_RACES);

// Not offered at character creation for now; existing characters are unaffected.
hideFromCharacterCreation(BATTLE_MAGE);

blendPrimaryStatsTowardsPaladin();
blendBaseHealthTowardsPaladin();

function blendPrimaryStatsTowardsPaladin() {
    const mageStats = referenceLevelStats(MAGE_CLASS_ID);
    const paladinStats = referenceLevelStats(PALADIN_CLASS_ID);

    const attributes = [
        { field: 'str', cell: BATTLE_MAGE.Stats.Strength },
        { field: 'agi', cell: BATTLE_MAGE.Stats.Agility },
        { field: 'sta', cell: BATTLE_MAGE.Stats.Stamina },
        { field: 'inte', cell: BATTLE_MAGE.Stats.Intellect },
        { field: 'spi', cell: BATTLE_MAGE.Stats.Spirit },
    ] as const;

    attributes.forEach(({ field, cell }) => cell.set((old, _race, level) => {
        const mage = mageStats.get(level);
        const paladin = paladinStats.get(level);
        if (!mage || !paladin) {
            return old;
        }
        return blend(old, mage[field].get(), paladin[field].get());
    }));
}

function blendBaseHealthTowardsPaladin() {
    const mageHealth = referenceBaseHealth(MAGE_CLASS_ID);
    const paladinHealth = referenceBaseHealth(PALADIN_CLASS_ID);

    BATTLE_MAGE.Stats.BaseHP.set((old, level) => {
        const mage = mageHealth.get(level);
        const paladin = paladinHealth.get(level);
        if (mage === undefined || paladin === undefined) {
            return old;
        }
        return blend(old, mage, paladin);
    });
}

function blend(current: number, mageReference: number, paladinReference: number) {
    return Math.round(current + (paladinReference - mageReference) * PALADIN_STAT_BLEND);
}

function referenceLevelStats(classId: number) {
    return new Map(std.SQL.player_levelstats
        .queryAll({ race: REFERENCE_RACE_ID, class: classId })
        .map(row => [row.level.get(), row] as const));
}

function referenceBaseHealth(classId: number) {
    return new Map(std.SQL.player_classlevelstats
        .queryAll({ class: classId })
        .map(row => [row.level.get(), row.basehp.get()] as const));
}
