import {
    abilityFlat, abilityPercent, createTalentTree, healingDone, manaCost, manaRegenWhileCasting, maxHealthPercent,
    spellCrit, statPercent, threat,
} from "classkit";
import {
    ADRENAL_INJECTION, HEALING_VAPORS, HERBAL_TONIC, PANACEA, RESTORATIVE_DRAUGHT, RESTORATIVE_INJECTION,
} from "../abilities/PlagueDoctorAbilities";
import { PLAGUE_DOCTOR_CONTEXT as PD } from "../PlagueDoctorClass";

/** The healer tree: draughts, tonics and injections. */
export const REMEDY_TREE = createTalentTree(PD, {
    id: 'remedy',
    name: 'Remedy',
    tabIndex: 2,
    background: 'DruidRestoration',
    icon: 'Spell_Nature_HealingTouch',
    talents: [
        {
            kind: 'passive', id: 'bedside-manner', row: 0, column: 0, ranks: 5,
            name: 'Bedside Manner', icon: 'Spell_Holy_Renew',
            description: 'Increases the healing done by your spells by $s1%.',
            effects: [healingDone(2)],
        },
        {
            kind: 'passive', id: 'steady-pulse', row: 0, column: 2, ranks: 5,
            name: 'Steady Pulse', icon: 'INV_Potion_51',
            description: 'Reduces the casting time of Restorative Draught by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -100, [RESTORATIVE_DRAUGHT])],
        },
        {
            kind: 'passive', id: 'herbal-expertise', row: 1, column: 0, ranks: 3,
            name: 'Herbal Expertise', icon: 'Spell_Nature_Rejuvenation',
            description: 'Increases the periodic healing of Herbal Tonic and Restorative Injection by $s1%.',
            effects: [abilityPercent('DOT', 5, [HERBAL_TONIC, RESTORATIVE_INJECTION])],
        },
        {
            kind: 'passive', id: 'clean-needles', row: 1, column: 2, ranks: 5,
            name: 'Clean Needles', icon: 'Spell_Nature_ResistNature',
            description: 'Reduces the mana cost of Restorative Draught and Restorative Injection by $s1%.',
            effects: [abilityPercent('COST', -4, [RESTORATIVE_DRAUGHT, RESTORATIVE_INJECTION])],
        },
        { kind: 'active', id: 'adrenal-injection', row: 2, column: 1, ability: ADRENAL_INJECTION },
        {
            kind: 'passive', id: 'field-medicine', row: 2, column: 2, ranks: 3,
            name: 'Field Medicine', icon: 'Spell_Holy_GreaterHeal',
            description: 'Increases your chance to get a critical effect with spells by $s1%.',
            effects: [spellCrit(1)],
        },
        {
            kind: 'passive', id: 'tonic-infusion', row: 3, column: 0, ranks: 2,
            name: 'Tonic Infusion', icon: 'Spell_Nature_Regeneration',
            description: 'Increases the duration of Herbal Tonic by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 3000, [HERBAL_TONIC])],
        },
        {
            kind: 'passive', id: 'vital-spirit', row: 3, column: 2, ranks: 5,
            name: 'Vital Spirit', icon: 'Spell_Holy_HolyProtection',
            description: 'Increases your Spirit by $s1%.',
            effects: [statPercent('SPIRIT', 2)],
        },
        {
            kind: 'passive', id: 'vigilant-care', row: 4, column: 0, ranks: 3,
            name: 'Vigilant Care', icon: 'Spell_Nature_ManaRegenTotem',
            description: 'Allows $s1% of your mana regeneration to continue while casting.',
            effects: [manaRegenWhileCasting(5)],
        },
        {
            kind: 'passive', id: 'prudent-dosage', row: 4, column: 2, ranks: 3,
            name: 'Prudent Dosage', icon: 'INV_Potion_27',
            description: 'Reduces the mana cost of all your spells by $s1%.',
            effects: [manaCost(-2)],
        },
        {
            kind: 'passive', id: 'second-opinion', row: 5, column: 0, ranks: 3,
            name: 'Second Opinion', icon: 'Spell_Nature_ResistNature',
            description: 'Increases the critical effect chance of Restorative Injection by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 5, [RESTORATIVE_INJECTION])],
        },
        {
            kind: 'passive', id: 'hardy-physician', row: 5, column: 2, ranks: 3,
            name: 'Hardy Physician', icon: 'Spell_Holy_DevotionAura',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        { kind: 'active', id: 'healing-vapors', row: 6, column: 1, ability: HEALING_VAPORS },
        {
            kind: 'passive', id: 'improved-healing-vapors', row: 6, column: 2, ranks: 3,
            requires: 'healing-vapors',
            name: 'Improved Healing Vapors', icon: 'Spell_Nature_Tranquility',
            description: 'Reduces the mana cost of Healing Vapors by $s1%.',
            effects: [abilityPercent('COST', -10, [HEALING_VAPORS])],
        },
        {
            kind: 'passive', id: 'restorative-mastery', row: 7, column: 0, ranks: 3,
            name: 'Restorative Mastery', icon: 'Spell_Nature_HealingTouch',
            description: 'Increases the direct healing of Restorative Draught and Restorative Injection by $s1%.',
            effects: [abilityPercent('DAMAGE', 4, [RESTORATIVE_DRAUGHT, RESTORATIVE_INJECTION])],
        },
        {
            kind: 'passive', id: 'gentle-hands', row: 7, column: 2, ranks: 3,
            name: 'Gentle Hands', icon: 'Spell_Holy_SealOfSalvation',
            description: 'Reduces the threat caused by your spells by $s1%.',
            effects: [threat(-10)],
        },
        {
            kind: 'passive', id: 'second-wind', row: 8, column: 1, ranks: 3,
            name: 'Second Wind', icon: 'Spell_Nature_Tranquility',
            description: 'Increases the healing done by Healing Vapors by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [HEALING_VAPORS])],
        },
        {
            kind: 'passive', id: 'empowered-remedies', row: 9, column: 1, ranks: 3,
            name: 'Empowered Remedies', icon: 'Spell_Nature_HealingWaveGreater',
            description: 'Increases the healing done by your spells by $s1%.',
            effects: [healingDone(2)],
        },
        { kind: 'active', id: 'panacea', row: 10, column: 1, ability: PANACEA },
    ],
});
