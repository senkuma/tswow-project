import {
    abilityFlat, abilityPercent, createTalentTree, damageDone, onAbilityHit, spellCrit, spellHit, statPercent,
    triggerSpell,
} from "classkit";
import {
    BLACK_DEATH, BLIGHT_INJECTION, CHOKING_GAS, CONTAGION, FESTERING_BLIGHT, LEECH_THERAPY, MIASMA,
    PARALYTIC_TOXIN, PLAGUE_SWARM, TOXIC_VIAL,
} from "../abilities/PlagueDoctorAbilities";
import { PLAGUE_DOCTOR_CONTEXT as PD } from "../PlagueDoctorClass";

const DISEASES = [BLIGHT_INJECTION, CONTAGION, PLAGUE_SWARM, BLACK_DEATH, FESTERING_BLIGHT];

/** Damage over time: toxins, gas clouds and creeping disease. */
export const PESTILENCE_TREE = createTalentTree(PD, {
    id: 'pestilence',
    name: 'Pestilence',
    tabIndex: 0,
    background: 'WarlockCurses',
    icon: 'Spell_Shadow_PlagueCloud',
    talents: [
        {
            kind: 'passive', id: 'virulent-toxins', row: 0, column: 0, ranks: 5,
            name: 'Virulent Toxins', icon: 'Spell_Nature_CorrosiveBreath',
            description: 'Increases the damage of Toxic Vial by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, [TOXIC_VIAL])],
        },
        {
            kind: 'passive', id: 'clinical-precision', row: 0, column: 1, ranks: 5,
            name: 'Clinical Precision', icon: 'Spell_Shadow_ShadowWordPain',
            description: 'Increases your chance to hit with spells by $s1%.',
            effects: [spellHit(1)],
        },
        {
            kind: 'passive', id: 'lingering-sickness', row: 1, column: 0, ranks: 3,
            name: 'Lingering Sickness', icon: 'Spell_Shadow_Contagion',
            description: 'Increases the periodic damage of Blight Injection, Contagion, Plague Swarm, Black Death'
                + ' and Festering Blight by $s1%.',
            effects: [abilityPercent('DOT', 5, DISEASES)],
        },
        {
            kind: 'passive', id: 'quick-hands', row: 1, column: 2, ranks: 5,
            name: 'Quick Hands', icon: 'Spell_Nature_NatureTouchDecay',
            description: 'Reduces the casting time of Toxic Vial by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -100, [TOXIC_VIAL])],
        },
        { kind: 'active', id: 'plague-swarm', row: 2, column: 1, ability: PLAGUE_SWARM },
        {
            kind: 'passive', id: 'spreading-blight', row: 2, column: 2, ranks: 3,
            name: 'Spreading Blight', icon: 'Ability_Creature_Disease_02',
            description: 'Toxic Vial has a $h% chance to infect the target with Festering Blight, causing'
                + ` $${FESTERING_BLIGHT.ID}o1 Nature damage over $${FESTERING_BLIGHT.ID}d.`,
            effects: [triggerSpell(FESTERING_BLIGHT.ID)],
            configure: onAbilityHit(PD, 10, [TOXIC_VIAL]),
        },
        {
            kind: 'passive', id: 'dense-miasma', row: 3, column: 0, ranks: 3,
            name: 'Dense Miasma', icon: 'Spell_Shadow_PlagueCloud',
            description: 'Increases the damage of Miasma by $s1%.',
            effects: [abilityPercent('DOT', 6, [MIASMA])],
        },
        {
            kind: 'passive', id: 'morbid-fascination', row: 3, column: 2, ranks: 5,
            name: 'Morbid Fascination', icon: 'Spell_Shadow_CurseOfMannoroth',
            description: 'Increases all Nature and Shadow damage you deal by $s1%.',
            effects: [damageDone(['NATURE', 'SHADOW'], 1)],
        },
        {
            kind: 'passive', id: 'festering-wounds', row: 4, column: 0, ranks: 3,
            name: 'Festering Wounds', icon: 'Spell_Shadow_CreepingPlague',
            description: 'Increases the duration of Contagion by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 3000, [CONTAGION])],
        },
        {
            kind: 'passive', id: 'morbid-intellect', row: 4, column: 2, ranks: 5,
            name: 'Morbid Intellect', icon: 'Spell_Shadow_UnsummonBuilding',
            description: 'Increases your Intellect by $s1%.',
            effects: [statPercent('INTELLECT', 2)],
        },
        {
            kind: 'passive', id: 'fast-acting-paralytic', row: 5, column: 0, ranks: 2,
            name: 'Fast-Acting Paralytic', icon: 'Ability_PoisonSting',
            description: 'Reduces the casting time of Paralytic Toxin by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -500, [PARALYTIC_TOXIN])],
        },
        {
            kind: 'passive', id: 'pestilent-precision', row: 5, column: 2, ranks: 3,
            name: 'Pestilent Precision', icon: 'Spell_Shadow_DeathScream',
            description: 'Increases your chance to get a critical strike with spells by $s1%.',
            effects: [spellCrit(1)],
        },
        { kind: 'active', id: 'choking-gas', row: 6, column: 1, ability: CHOKING_GAS },
        {
            kind: 'passive', id: 'improved-choking-gas', row: 6, column: 2, ranks: 2,
            requires: 'choking-gas',
            name: 'Improved Choking Gas', icon: 'Spell_Shadow_CurseOfTounges',
            description: 'Reduces the cooldown of Choking Gas by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -7500, [CHOKING_GAS])],
        },
        {
            kind: 'passive', id: 'caustic-burns', row: 7, column: 0, ranks: 3,
            name: 'Caustic Burns', icon: 'Spell_Nature_Acid_01',
            description: 'Increases the critical strike damage bonus of Toxic Vial by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [TOXIC_VIAL])],
        },
        {
            kind: 'passive', id: 'ravenous-leeches', row: 7, column: 2, ranks: 3,
            name: 'Ravenous Leeches', icon: 'Spell_Shadow_LifeDrain02',
            description: 'Increases the health drained by Leech Therapy by $s1%.',
            effects: [abilityPercent('DOT', 10, [LEECH_THERAPY])],
        },
        {
            kind: 'passive', id: 'epidemic', row: 8, column: 1, ranks: 3,
            name: 'Epidemic', icon: 'Spell_Shadow_AbominationExplosion',
            description: 'Reduces the mana cost of Blight Injection, Contagion, Plague Swarm, Black Death and Miasma'
                + ' by $s1%.',
            effects: [abilityPercent('COST', -5, [BLIGHT_INJECTION, CONTAGION, PLAGUE_SWARM, BLACK_DEATH, MIASMA])],
        },
        {
            kind: 'passive', id: 'plague-bearer', row: 9, column: 1, ranks: 3,
            name: 'Plague Bearer', icon: 'Spell_Shadow_CallofBone',
            description: 'Increases the periodic damage of Contagion and Plague Swarm by $s1%.',
            effects: [abilityPercent('DOT', 4, [CONTAGION, PLAGUE_SWARM])],
        },
        { kind: 'active', id: 'black-death', row: 10, column: 1, ability: BLACK_DEATH },
    ],
});
