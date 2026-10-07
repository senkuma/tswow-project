import {
    ARCANE_BOLT, CASTER_SPELLS, FIRE_ABILITIES, FLAME_BURST, RIMEBOLT, SEARING_BRAND,
} from "../abilities/BattleMageAbilities";
import {
    abilityFlat, abilityPercent, createTalentTree, damageDone, MAGIC_SCHOOLS, manaCost,
    manaRegenWhileCasting, spellCrit, spellHit, spellPowerFromStat, statPercent,
} from "./TalentBuilder";

const SPELL_CRIT_ABILITIES = [...CASTER_SPELLS, SEARING_BRAND, FLAME_BURST];

// Mage talents whose effects apply to all spells, so they work unchanged for Battle Mages.
const ARCANE_INSTABILITY = [15058, 15059, 15060];
const PLAYING_WITH_FIRE = [31638, 31639, 31640];
const NETHERWIND_PRESENCE = [44400, 44402, 44403];

export const WAR_MAGIC_TREE = createTalentTree({
    id: 'war-magic',
    name: 'War Magic',
    tabIndex: 2,
    background: 'MageFire',
    icon: 'Spell_Fire_FlameBolt',
    talents: [
        {
            kind: 'passive', id: 'battle-focus', row: 0, column: 1, ranks: 5,
            name: 'Battle Focus', icon: 'Spell_Holy_MagicalSentry',
            description: 'Increases the critical strike chance of your spells by $s1%.',
            effects: [spellCrit(1)],
        },
        {
            kind: 'passive', id: 'searing-edge', row: 0, column: 2, ranks: 3,
            name: 'Searing Edge', icon: 'Spell_Fire_FlameShock',
            description: 'Increases the damage of Searing Brand by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [SEARING_BRAND])],
        },
        {
            kind: 'passive', id: 'spell-forged-mind', row: 1, column: 0, ranks: 5,
            name: 'Spell-Forged Mind', icon: 'Spell_Holy_MindVision',
            description: 'Increases your Intellect by $s1%.',
            effects: [statPercent('INTELLECT', 2)],
        },
        {
            kind: 'passive', id: 'improved-arcane-bolt', row: 1, column: 1, ranks: 5,
            name: 'Improved Arcane Bolt', icon: 'Spell_Arcane_StarFire',
            description: 'Reduces the casting time of your Arcane Bolt spell by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -100, [ARCANE_BOLT])],
        },
        {
            kind: 'passive', id: 'martial-sorcery', row: 2, column: 1, ranks: 3,
            name: 'Martial Sorcery', icon: 'Spell_Holy_SealOfMight',
            description: 'Increases your spell power by $s1% of your Strength.',
            effects: [spellPowerFromStat('STRENGTH', 10)],
        },
        {
            kind: 'passive', id: 'mana-discipline', row: 2, column: 2, ranks: 3,
            name: 'Mana Discipline', icon: 'Spell_Shadow_ManaBurn',
            description: 'Reduces the mana cost of all your spells and abilities by $S1%.',
            effects: [manaCost(-2)],
        },
        {
            kind: 'passive', id: 'flame-mastery', row: 3, column: 0, ranks: 3,
            name: 'Flame Mastery', icon: 'Spell_Fire_Fire',
            description: 'Increases all Fire damage you deal by $s1%.',
            effects: [damageDone(['FIRE'], 2)],
        },
        {
            kind: 'passive', id: 'battle-meditation', row: 3, column: 2, ranks: 3,
            name: 'Battle Meditation', icon: 'Spell_Nature_Sleep',
            description: 'Allows $s1% of your mana regeneration to continue while casting.',
            effects: [manaRegenWhileCasting(10)],
        },
        {
            kind: 'passive', id: 'elemental-precision', row: 4, column: 0, ranks: 3,
            name: 'Elemental Precision', icon: 'Spell_Ice_MagicDamage',
            description: 'Increases your chance to hit with spells by $s1%.',
            effects: [spellHit(1)],
        },
        {
            kind: 'passive', id: 'improved-rimebolt', row: 4, column: 1, ranks: 5,
            name: 'Improved Rimebolt', icon: 'Spell_Frost_FrostBolt02',
            description: 'Reduces the casting time of your Rimebolt spell by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -100, [RIMEBOLT])],
        },
        {
            kind: 'passive', id: 'critical-mass', row: 5, column: 0, ranks: 3,
            name: 'Critical Mass', icon: 'Spell_Nature_WispHeal',
            description: 'Increases the critical strike chance of Fire Lance, Searing Brand and Flame Burst by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 2, FIRE_ABILITIES)],
        },
        {
            kind: 'passive', id: 'spell-power', row: 5, column: 2, ranks: 2,
            name: 'Spell Power', icon: 'Spell_Arcane_ArcaneTorrent',
            description: 'Increases the critical strike damage bonus of your Battle Mage spells by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 25, SPELL_CRIT_ABILITIES)],
        },
        { kind: 'active', id: 'flame-burst', row: 6, column: 1, ability: FLAME_BURST },
        { kind: 'cloned', id: 'arcane-instability', row: 7, column: 0, parentRanks: ARCANE_INSTABILITY },
        {
            kind: 'passive', id: 'improved-flame-burst', row: 7, column: 1, ranks: 2,
            requires: 'flame-burst',
            name: 'Improved Flame Burst', icon: 'Spell_Holy_Excorcism_02',
            description: 'Reduces the cooldown of Flame Burst by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -5000, [FLAME_BURST])],
        },
        {
            kind: 'passive', id: 'fire-power', row: 8, column: 0, ranks: 5,
            name: 'Fire Power', icon: 'Spell_Fire_Immolation',
            description: 'Increases the damage done by Fire Lance, Searing Brand and Flame Burst by $s1%.',
            effects: [
                abilityPercent('DAMAGE', 2, FIRE_ABILITIES),
                // Damage over time is modified separately from direct damage.
                abilityPercent('DOT', 2, FIRE_ABILITIES),
            ],
        },
        { kind: 'cloned', id: 'playing-with-fire', row: 8, column: 2, parentRanks: PLAYING_WITH_FIRE },
        { kind: 'cloned', id: 'netherwind-presence', row: 9, column: 1, parentRanks: NETHERWIND_PRESENCE },
        {
            kind: 'passive', id: 'archmages-wrath', row: 10, column: 1, ranks: 1,
            name: 'Archmage\'s Wrath', icon: 'Spell_Fire_SelfDestruct',
            description: 'Increases all spell damage you deal by $s1% and your spell critical strike chance by $s2%.',
            effects: [damageDone(MAGIC_SCHOOLS, 5), spellCrit(5)],
        },
    ],
});
