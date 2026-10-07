import {
    abilityFlat, abilityPercent, ALL_SCHOOLS, armorFromItems, attackerMeleeCrit, createTalentTree, damageTaken, dodge,
    maxHealthPercent, onMeleeHitTaken, parry, statPercent, stunDuration, threat, triggerSpell,
} from "classkit";
import {
    BLACKOUT_KICK, BREATH_OF_FIRE, DAMPEN_HARM, EXPEL_HARM, FORTIFYING_BREW, KEG_SMASH,
} from "../abilities/MonkAbilities";
import { MONK_CONTEXT as MK } from "../MonkClass";
import { GIFT_OF_THE_OX } from "./ProcEffects";

/** Tank: brews, kegs and a body that shrugs off blows. */
export const BREWMASTER_TREE = createTalentTree(MK, {
    id: 'brewmaster',
    name: 'Brewmaster',
    tabIndex: 0,
    background: 'WarriorProtection',
    icon: 'Spell_Monk_Brewmaster_Spec',
    talents: [
        {
            kind: 'passive', id: 'ox-endurance', row: 0, column: 0, ranks: 5,
            name: 'Endurance of the Ox', icon: 'Monk_Ability_SummonOxStatue',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'ironskin', row: 0, column: 1, ranks: 5,
            name: 'Ironskin', icon: 'Ability_Monk_IronSkinBrew',
            description: 'Increases your armor value from items by $s1%.',
            effects: [armorFromItems(4)],
        },
        {
            kind: 'passive', id: 'drunken-haze', row: 1, column: 0, ranks: 5,
            name: 'Drunken Haze', icon: 'Ability_Monk_DrunkenHaze',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'hard-liquor', row: 1, column: 2, ranks: 3,
            name: 'Hard Liquor', icon: 'Ability_Monk_ElusiveAle',
            description: 'Increases the threat you cause by $s1%.',
            effects: [threat(10)],
        },
        {
            kind: 'passive', id: 'steady-footing', row: 2, column: 0, ranks: 2,
            name: 'Steady Footing', icon: 'Ability_Monk_Sparring',
            description: 'Reduces the duration of stun effects on you by $S1%.',
            effects: [stunDuration(-15)],
        },
        { kind: 'active', id: 'keg-smash', row: 2, column: 1, ability: KEG_SMASH },
        {
            kind: 'passive', id: 'deflection', row: 2, column: 2, ranks: 3,
            name: 'Deflection', icon: 'Ability_Monk_Guard',
            description: 'Increases your chance to parry by $s1%.',
            effects: [parry(1)],
        },
        {
            kind: 'passive', id: 'gift-of-the-ox', row: 3, column: 0, ranks: 3,
            name: 'Gift of the Ox', icon: 'Ability_Monk_HealthSphere',
            description: 'When struck by a melee attack you have a $h% chance to heal yourself'
                + ` for $${GIFT_OF_THE_OX.ID}s1% of your maximum health.`,
            effects: [triggerSpell(GIFT_OF_THE_OX.ID)],
            configure: onMeleeHitTaken(4),
        },
        {
            kind: 'passive', id: 'light-stagger', row: 3, column: 2, ranks: 3,
            name: 'Light Stagger', icon: 'Monk_Ability_AvertHarm',
            description: 'Reduces the chance you will be critically hit by melee attacks by $S1%.',
            effects: [attackerMeleeCrit(-2)],
        },
        {
            kind: 'passive', id: 'brewing-fortitude', row: 4, column: 0, ranks: 3,
            name: 'Brewing Fortitude', icon: 'Ability_Monk_FortifyingAle',
            description: 'Reduces the cooldown of Fortifying Brew by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [FORTIFYING_BREW])],
        },
        {
            kind: 'passive', id: 'shuffle', row: 4, column: 1, ranks: 5,
            name: 'Shuffle', icon: 'Ability_Monk_Shuffle',
            description: 'Increases the damage of Blackout Kick and Keg Smash by $s1%.',
            effects: [abilityPercent('DAMAGE', 4, [BLACKOUT_KICK, KEG_SMASH])],
        },
        {
            kind: 'passive', id: 'heavy-stagger', row: 5, column: 0, ranks: 3,
            name: 'Heavy Stagger', icon: 'Ability_Monk_ChargingOxWave',
            description: 'Reduces all physical damage taken by $S1%.',
            effects: [damageTaken(['PHYSICAL'], -2)],
        },
        {
            kind: 'passive', id: 'wide-kegs', row: 5, column: 2, ranks: 2,
            name: 'Wide Kegs', icon: 'Achievement_brewery_2',
            description: 'Increases the radius of Keg Smash by $s1 yards.',
            effects: [abilityFlat('RADIUS', 2, [KEG_SMASH])],
        },
        { kind: 'active', id: 'breath-of-fire', row: 6, column: 1, ability: BREATH_OF_FIRE },
        {
            kind: 'passive', id: 'smoldering-breath', row: 6, column: 2, ranks: 2,
            requires: 'breath-of-fire',
            name: 'Smoldering Breath', icon: 'Ability_Monk_BreathofFire',
            description: 'Increases the burn damage of Breath of Fire by $s1%.',
            effects: [abilityPercent('DOT', 20, [BREATH_OF_FIRE])],
        },
        {
            kind: 'passive', id: 'strength-of-the-ox', row: 7, column: 0, ranks: 3,
            name: 'Strength of the Ox', icon: 'Ability_Monk_MightyOxKick',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        {
            kind: 'passive', id: 'healing-elixirs', row: 7, column: 2, ranks: 3,
            name: 'Healing Elixirs', icon: 'Ability_Monk_FortifyingElixir',
            description: 'Increases the healing of Expel Harm and Gift of the Ox by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 10, [EXPEL_HARM, GIFT_OF_THE_OX])],
        },
        {
            kind: 'passive', id: 'celestial-fortune', row: 8, column: 1, ranks: 5,
            name: 'Celestial Fortune', icon: 'Ability_Monk_Ascension',
            description: 'Reduces all damage taken by $S1%.',
            effects: [damageTaken(ALL_SCHOOLS, -1)],
        },
        {
            kind: 'passive', id: 'unbreakable-spirit', row: 9, column: 1, ranks: 2,
            name: 'Unbreakable Spirit', icon: 'Ability_Monk_DampenHarm',
            description: 'Reduces the cooldown of Dampen Harm and Fortifying Brew by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -15000, [DAMPEN_HARM, FORTIFYING_BREW])],
        },
        { kind: 'active', id: 'dampen-harm', row: 10, column: 1, ability: DAMPEN_HARM },
    ],
});
