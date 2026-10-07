import {
    abilityFlat, abilityPercent, attackPowerPercent, createTalentTree, dodge, healingDone, powerRegenPercent,
    statPercent, threat,
} from "classkit";
import {
    ENVELOPING_MIST, EXPEL_HARM, LIFE_COCOON, RENEWING_MIST, REVIVAL, SURGING_MIST,
} from "../abilities/MonkAbilities";
import { MONK_CONTEXT as MK } from "../MonkClass";

/** Healer: mists that mend through attack power, and cocoons that keep allies alive. */
export const MISTWEAVER_TREE = createTalentTree(MK, {
    id: 'mistweaver',
    name: 'Mistweaver',
    tabIndex: 1,
    background: 'DruidRestoration',
    icon: 'Spell_Monk_MistWeaver_Spec',
    talents: [
        {
            kind: 'passive', id: 'serenity', row: 0, column: 0, ranks: 5,
            name: 'Serenity', icon: 'ABILITY_MONK_SERENITY',
            description: 'Increases your healing done by $s1%.',
            effects: [healingDone(2)],
        },
        {
            kind: 'passive', id: 'inner-peace', row: 0, column: 1, ranks: 5,
            name: 'Inner Peace', icon: 'Ability_Monk_ZenMeditation',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'thrifty-mists', row: 1, column: 0, ranks: 3,
            name: 'Thrifty Mists', icon: 'Monk_Ability_CherryManaTea',
            description: 'Reduces the energy cost of Surging Mist by $S1.',
            effects: [abilityFlat('COST', -3, [SURGING_MIST])],
        },
        {
            kind: 'passive', id: 'lingering-mists', row: 1, column: 2, ranks: 2,
            name: 'Lingering Mists', icon: 'Ability_Monk_RenewingMists',
            description: 'Increases the duration of Renewing Mist by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 3000, [RENEWING_MIST])],
        },
        {
            kind: 'passive', id: 'soothing-touch', row: 2, column: 0, ranks: 3,
            name: 'Soothing Touch', icon: 'Ability_Monk_SoothingMists',
            description: 'Increases the healing of Surging Mist by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [SURGING_MIST])],
        },
        { kind: 'active', id: 'enveloping-mist', row: 2, column: 1, ability: ENVELOPING_MIST },
        {
            kind: 'passive', id: 'meditation', row: 2, column: 2, ranks: 3,
            name: 'Meditation', icon: 'Spell_Monk_ZenPilgrimage',
            description: 'Increases your energy regeneration by $s1%.',
            effects: [powerRegenPercent('ENERGY', 5)],
        },
        {
            kind: 'passive', id: 'renewing-strength', row: 3, column: 0, ranks: 3,
            name: 'Renewing Strength', icon: 'INV_Ability_Monk_RenewingMists_Active',
            description: 'Increases the periodic healing of Renewing Mist and Enveloping Mist by $s1%.',
            effects: [abilityPercent('DOT', 10, [RENEWING_MIST, ENVELOPING_MIST])],
        },
        {
            kind: 'passive', id: 'fluid-motion', row: 3, column: 2, ranks: 3,
            name: 'Fluid Motion', icon: 'ability_monk_roll',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'teachings-of-the-monastery', row: 4, column: 0, ranks: 2,
            name: 'Teachings of the Monastery', icon: 'Passive_Monk_TeachingsofMonastery',
            description: 'Reduces the cooldown of Expel Harm by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -5000, [EXPEL_HARM])],
        },
        {
            kind: 'passive', id: 'mistweaving', row: 4, column: 1, ranks: 5,
            name: 'Mistweaving', icon: 'INV_Ability_MasterOfHarmonyMonk_AspectOfHarmony',
            description: 'Increases the critical effect chance of Surging Mist and Enveloping Mist by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 2, [SURGING_MIST, ENVELOPING_MIST])],
        },
        {
            kind: 'passive', id: 'calming-presence', row: 5, column: 0, ranks: 3,
            name: 'Calming Presence', icon: 'Ability_Monk_JasmineForceTea',
            description: 'Reduces the threat you cause by $S1%.',
            effects: [threat(-10)],
        },
        {
            kind: 'passive', id: 'chi-flow', row: 5, column: 2, ranks: 2,
            name: 'Chi Flow', icon: 'Ability_Monk_ChiWave',
            description: 'Increases the direct healing of Enveloping Mist by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [ENVELOPING_MIST])],
        },
        { kind: 'active', id: 'life-cocoon', row: 6, column: 1, ability: LIFE_COCOON },
        {
            kind: 'passive', id: 'improved-life-cocoon', row: 6, column: 2, ranks: 2,
            requires: 'life-cocoon',
            name: 'Improved Life Cocoon', icon: 'Ability_Monk_ChiCocoon',
            description: 'Reduces the cooldown of Life Cocoon by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -15000, [LIFE_COCOON])],
        },
        {
            kind: 'passive', id: 'resilient-spirit', row: 7, column: 0, ranks: 3,
            name: 'Resilient Spirit', icon: 'Ability_Monk_Uplift',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'uplift', row: 7, column: 2, ranks: 3,
            name: 'Uplift', icon: 'Ability_Monk_Uplift',
            description: 'Increases the critical healing bonus of Surging Mist and Enveloping Mist by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [SURGING_MIST, ENVELOPING_MIST])],
        },
        {
            kind: 'passive', id: 'jade-serpents-grace', row: 8, column: 1, ranks: 5,
            name: 'Grace of the Jade Serpent', icon: 'Ability_Monk_SummonSerpentStatue',
            description: 'Increases your healing done by $s1%.',
            effects: [healingDone(2)],
        },
        {
            kind: 'passive', id: 'rising-mist', row: 9, column: 1, ranks: 2,
            name: 'Rising Mist', icon: 'Ability_Monk_EssenceFont',
            description: 'Reduces the cooldown of Revival by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [REVIVAL])],
        },
        { kind: 'active', id: 'revival', row: 10, column: 1, ability: REVIVAL },
    ],
});
