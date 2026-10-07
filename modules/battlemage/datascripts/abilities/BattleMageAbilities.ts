import { SKILL_ARCANE, SKILL_FIRE, SKILL_FROST } from "../Constants";
import { createRankedAbility, RankedAbility } from "./RankedAbility";

// Parent rank chains (first rank of each WotLK ability).
const SINISTER_STRIKE = 1752;
const CHARGE = 100;
const THUNDER_CLAP = 6343;
const FLAME_SHOCK = 8050;
const TAUNT = 355;
const SHIELD_BLOCK = 2565;
const FROST_SHOCK = 8056;
const CLEAVE = 845;
const MORTAL_STRIKE = 12294;
const SHIELD_WALL = 871;
const BLAST_WAVE = 11113;
const LIGHTNING_BOLT = 403;
const FROSTBOLT = 116;
const IMMOLATE = 348;

const MELEE_RANGE_INDEX = 2;
const STANDARD_GLOBAL_COOLDOWN_MS = 1500;

export const ARCANE_STRIKE = createRankedAbility({
    id: 'arcane-strike',
    parent: SINISTER_STRIKE,
    familyBit: 0,
    firstRankSource: 'START',
    name: 'Arcane Strike',
    description: 'An instant strike that causes $m1 Arcane damage in addition to your normal weapon damage.',
    icon: 'Spell_Arcane_Blast',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 5,
    // Combo points.
    clearedEffects: [1],
    // Rogues use a 1 sec global cooldown.
    customize: rank => rank.Cooldown.GlobalTime.set(STANDARD_GLOBAL_COOLDOWN_MS),
});

export const ARCANE_CHARGE = createRankedAbility({
    id: 'arcane-charge',
    parent: CHARGE,
    // Charge's later ranks only add rage, which is cleared below.
    maxRanks: 1,
    familyBit: 1,
    firstRankSource: 'TRAINER',
    name: 'Arcane Charge',
    description: 'Charge an enemy in a flash of arcane energy, stunning it for $7922d.  Cannot be used in combat.',
    icon: 'Spell_Arcane_Blink',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 3,
    // Rage generation, implemented only by the warrior script.
    clearedEffects: [1],
});

export const ARCANE_SHOCKWAVE = createRankedAbility({
    id: 'arcane-shockwave',
    parent: THUNDER_CLAP,
    familyBit: 2,
    firstRankSource: 'TRAINER',
    name: 'Arcane Shockwave',
    description: 'Releases a shockwave of arcane force, dealing $s1 Arcane damage to nearby enemies'
        + ' and increasing the time between their attacks by $s2% for $d.'
        + '  Damage increased by attack power and spell power.',
    icon: 'Spell_Arcane_ArcaneTorrent',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 6,
    // Thunder Clap's attack power coefficient, mirrored for spell power so
    // melee and caster Battle Mages both get value from it.
    customize: rank => rank
        .BonusData.APBonus.set(0.12)
        .BonusData.DirectBonus.set(0.12),
});

export const SEARING_BRAND = createRankedAbility({
    id: 'searing-brand',
    parent: FLAME_SHOCK,
    familyBit: 5,
    firstRankSource: 'TRAINER',
    name: 'Searing Brand',
    description: 'Brands the target with searing steel, causing $s1 Fire damage immediately'
        + ' and $o2 Fire damage over $d.  Shares a cooldown with Frostblade.',
    icon: 'Spell_Fire_FlameShock',
    school: 'FIRE',
    skillLine: SKILL_FIRE,
    manaCostPercent: 8,
    customize: rank => rank.Range.set(MELEE_RANGE_INDEX),
});

export const PROVOKE = createRankedAbility({
    id: 'provoke',
    parent: TAUNT,
    familyBit: 6,
    firstRankSource: 'TRAINER',
    name: 'Provoke',
    description: 'Taunts the target to attack you, but has no effect if the target is already attacking you.',
    icon: 'Spell_Nature_Reincarnation',
    school: 'ARCANE',
    skillLine: SKILL_FROST,
    manaCostPercent: 0,
});

export const RIME_GUARD = createRankedAbility({
    id: 'rime-guard',
    parent: SHIELD_BLOCK,
    familyBit: 7,
    firstRankSource: 'TRAINER',
    name: 'Rime Guard',
    description: 'Coats your shield in hardened rime, increasing your chance to block'
        + ' and block value by $s1% for $d.',
    icon: 'Spell_Frost_FrostArmor02',
    school: 'FROST',
    skillLine: SKILL_FROST,
    manaCostPercent: 0,
});

export const FROSTBLADE = createRankedAbility({
    id: 'frostblade',
    parent: FROST_SHOCK,
    familyBit: 4,
    firstRankSource: 'TRAINER',
    name: 'Frostblade',
    description: 'Strikes the target with frost-infused steel, causing $s2 Frost damage'
        + ' and slowing movement speed by $s1% for $d.  Causes a high amount of threat.'
        + '  Shares a cooldown with Searing Brand.',
    icon: 'Spell_Frost_FrostBrand',
    school: 'FROST',
    skillLine: SKILL_FROST,
    manaCostPercent: 8,
    customize: rank => rank.Range.set(MELEE_RANGE_INDEX),
});

export const ARCANE_CLEAVE = createRankedAbility({
    id: 'arcane-cleave',
    parent: CLEAVE,
    familyBit: 3,
    firstRankSource: 'TRAINER',
    name: 'Arcane Cleave',
    description: 'A sweeping arcane attack on your next swing that does your weapon damage'
        + ' plus $s1 to the target and its nearest ally.',
    icon: 'Ability_Warrior_Cleave',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 6,
});

export const ARCANE_BLADE = createRankedAbility({
    id: 'arcane-blade',
    parent: MORTAL_STRIKE,
    familyBit: 8,
    firstRankSource: 'TALENT',
    name: 'Arcane Blade',
    description: 'A devastating strike that deals weapon damage plus $s2 as Arcane damage.',
    icon: 'Spell_Arcane_FocusedPower',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 7,
    // Mortal Strike's healing reduction.
    clearedEffects: [0],
});

export const ICE_FORTRESS = createRankedAbility({
    id: 'ice-fortress',
    parent: SHIELD_WALL,
    familyBit: 9,
    firstRankSource: 'TALENT',
    name: 'Ice Fortress',
    description: 'Encases you in living ice, reducing all damage taken by $s1% for $d.',
    icon: 'Spell_Frost_Glacier',
    school: 'FROST',
    skillLine: SKILL_FROST,
    manaCostPercent: 0,
    // Shield Wall needs a shield; Battle Mages also tank with two-handers.
    customize: rank => rank.row.EquippedItemClass.set(-1),
});

export const FLAME_BURST = createRankedAbility({
    id: 'flame-burst',
    parent: BLAST_WAVE,
    familyBit: 10,
    firstRankSource: 'TALENT',
    name: 'Flame Burst',
    description: 'Battle-fire erupts from you, dealing $s1 Fire damage to nearby enemies,'
        + ' knocking them back and dazing them for $d.',
    icon: 'Spell_Holy_Excorcism_02',
    school: 'FIRE',
    skillLine: SKILL_FIRE,
    manaCostPercent: 7,
});

export const ARCANE_BOLT = createRankedAbility({
    id: 'arcane-bolt',
    parent: LIGHTNING_BOLT,
    familyBit: 11,
    firstRankSource: 'START',
    name: 'Arcane Bolt',
    description: 'Hurls a bolt of arcane energy at the target for $s1 Arcane damage.',
    icon: 'Spell_Arcane_StarFire',
    school: 'ARCANE',
    skillLine: SKILL_ARCANE,
    manaCostPercent: 6,
});

export const RIMEBOLT = createRankedAbility({
    id: 'rimebolt',
    parent: FROSTBOLT,
    familyBit: 12,
    firstRankSource: 'TRAINER',
    name: 'Rimebolt',
    description: 'Launches a bolt of rime at the enemy, causing $m2 to $M2 Frost damage'
        + ' and slowing movement speed by $s1% for $d.',
    icon: 'Spell_Frost_FrostBolt02',
    school: 'FROST',
    skillLine: SKILL_FROST,
    manaCostPercent: 7,
});

export const FIRE_LANCE = createRankedAbility({
    id: 'fire-lance',
    parent: IMMOLATE,
    familyBit: 13,
    firstRankSource: 'TRAINER',
    name: 'Fire Lance',
    description: 'Pierces the enemy with a lance of flame for $s2 Fire damage'
        + ' and then an additional $o1 Fire damage over $d.',
    icon: 'Spell_Fire_FlameBolt',
    school: 'FIRE',
    skillLine: SKILL_FIRE,
    manaCostPercent: 10,
    // Hook for the warlock-only Conflagrate script.
    clearedEffects: [2],
});

export const CASTER_SPELLS = [ARCANE_BOLT, RIMEBOLT, FIRE_LANCE];
export const FIRE_ABILITIES = [FIRE_LANCE, SEARING_BRAND, FLAME_BURST];

export const ALL_ABILITIES: RankedAbility[] = [
    ARCANE_STRIKE, ARCANE_CHARGE, ARCANE_SHOCKWAVE, SEARING_BRAND, PROVOKE, RIME_GUARD,
    FROSTBLADE, ARCANE_CLEAVE, ARCANE_BLADE, ICE_FORTRESS, FLAME_BURST,
    ARCANE_BOLT, RIMEBOLT, FIRE_LANCE,
];
