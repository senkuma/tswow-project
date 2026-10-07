import {
    abilityFlat, abilityPercent, ALL_SCHOOLS, armorFromItems, createTalentTree, damageDone, healingDone, manaCost,
    manaRegenWhileCasting, maxHealthPercent, spellCrit, spellHit, spellPowerFromStat, statPercent,
} from "classkit";
import {
    ALCHEMISTS_FIRE, DISTILL_ESSENCE, MERCURIAL_WARD, PHILOSOPHERS_DRAUGHT, TOXIC_VIAL,
} from "../abilities/PlagueDoctorAbilities";
import { PLAGUE_DOCTOR_CONTEXT as PD } from "../PlagueDoctorClass";

/** The hybrid tree: concoctions that both harm and protect, and the reagents to brew them. */
export const ALCHEMY_TREE = createTalentTree(PD, {
    id: 'alchemy',
    name: 'Alchemy',
    tabIndex: 1,
    background: 'ShamanElementalCombat',
    icon: 'Trade_Alchemy',
    talents: [
        {
            kind: 'passive', id: 'potent-reagents', row: 0, column: 0, ranks: 5,
            name: 'Potent Reagents', icon: 'INV_Misc_Herb_GoldClover',
            description: 'Increases all damage and healing you deal by $s1%.',
            effects: [damageDone(ALL_SCHOOLS, 1), healingDone(1)],
        },
        {
            kind: 'passive', id: 'frugal-brewing', row: 0, column: 2, ranks: 5,
            name: 'Frugal Brewing', icon: 'INV_Misc_Bag_10_Green',
            description: 'Reduces the mana cost of all your spells by $s1%.',
            effects: [manaCost(-2)],
        },
        {
            kind: 'passive', id: 'catalyst', row: 1, column: 0, ranks: 3,
            name: 'Catalyst', icon: 'Spell_Fire_Incinerate',
            description: 'Increases your chance to get a critical strike with spells by $s1%.',
            effects: [spellCrit(1)],
        },
        {
            kind: 'passive', id: 'herbal-lore', row: 1, column: 1, ranks: 5,
            name: 'Herbal Lore', icon: 'INV_Misc_Flower_02',
            description: 'Increases your Spirit by $s1%.',
            effects: [statPercent('SPIRIT', 2)],
        },
        { kind: 'active', id: 'alchemists-fire', row: 2, column: 0, ability: ALCHEMISTS_FIRE },
        {
            kind: 'passive', id: 'combustible-compounds', row: 2, column: 1, ranks: 3,
            name: 'Combustible Compounds', icon: 'INV_Misc_Bomb_04',
            description: 'Increases the damage of Alchemist\'s Fire by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 5, [ALCHEMISTS_FIRE])],
        },
        {
            kind: 'passive', id: 'refined-distillation', row: 3, column: 0, ranks: 2,
            name: 'Refined Distillation', icon: 'Trade_Alchemy',
            description: 'Reduces the cooldown of Distill Essence by $/60000;S1 min.',
            effects: [abilityFlat('COOLDOWN', -60000, [DISTILL_ESSENCE])],
        },
        {
            kind: 'passive', id: 'elixir-mastery', row: 3, column: 2, ranks: 5,
            name: 'Elixir Mastery', icon: 'Spell_Nature_ManaRegenTotem',
            description: 'Allows $s1% of your mana regeneration to continue while casting.',
            effects: [manaRegenWhileCasting(3)],
        },
        {
            kind: 'passive', id: 'precise-measurements', row: 4, column: 0, ranks: 3,
            name: 'Precise Measurements', icon: 'INV_Misc_Spyglass_02',
            description: 'Increases your chance to hit with spells by $s1%.',
            effects: [spellHit(1)],
        },
        {
            kind: 'passive', id: 'iron-constitution', row: 4, column: 2, ranks: 5,
            name: 'Iron Constitution', icon: 'Spell_Holy_MagicalSentry',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'accelerant', row: 5, column: 0, ranks: 3,
            name: 'Accelerant', icon: 'Spell_Fire_Fireball02',
            description: 'Reduces the casting time of Alchemist\'s Fire by $/1000;S1 sec.',
            effects: [abilityFlat('CASTING_TIME', -250, [ALCHEMISTS_FIRE])],
        },
        {
            kind: 'passive', id: 'treated-leather', row: 5, column: 2, ranks: 3,
            name: 'Treated Leather', icon: 'INV_Chest_Leather_09',
            description: 'Increases your armor value from items by $s1%.',
            effects: [armorFromItems(5)],
        },
        { kind: 'active', id: 'mercurial-ward', row: 6, column: 1, ability: MERCURIAL_WARD },
        {
            kind: 'passive', id: 'improved-mercurial-ward', row: 6, column: 2, ranks: 3,
            requires: 'mercurial-ward',
            name: 'Improved Mercurial Ward', icon: 'INV_Potion_83',
            description: 'Increases the damage absorbed by Mercurial Ward by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 10, [MERCURIAL_WARD])],
        },
        {
            kind: 'passive', id: 'volatility', row: 7, column: 0, ranks: 3,
            name: 'Volatility', icon: 'Spell_Fire_SelfDestruct',
            description: 'Increases the critical strike damage bonus of Toxic Vial and Alchemist\'s Fire by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [TOXIC_VIAL, ALCHEMISTS_FIRE])],
        },
        {
            kind: 'passive', id: 'fortifying-elixirs', row: 7, column: 2, ranks: 3,
            name: 'Fortifying Elixirs', icon: 'INV_Potion_164',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        {
            kind: 'passive', id: 'arcane-catalysis', row: 8, column: 1, ranks: 3,
            name: 'Arcane Catalysis', icon: 'Spell_Arcane_ArcaneResilience',
            description: 'Increases your spell damage by an amount equal to $s1% of your Intellect.',
            effects: [spellPowerFromStat('INTELLECT', 5)],
        },
        {
            kind: 'passive', id: 'magnum-opus', row: 9, column: 1, ranks: 3,
            name: 'Magnum Opus', icon: 'INV_Misc_Gem_Variety_02',
            description: 'Increases all damage and healing you deal by $s1%.',
            effects: [damageDone(ALL_SCHOOLS, 1), healingDone(1)],
        },
        { kind: 'active', id: 'philosophers-draught', row: 10, column: 1, ability: PHILOSOPHERS_DRAUGHT },
    ],
});
