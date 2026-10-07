import { std } from "wow/wotlk";
import {
    ARCANE_BLADE, ARCANE_CHARGE, ARCANE_CLEAVE, ARCANE_SHOCKWAVE, ARCANE_STRIKE,
} from "../abilities/BattleMageAbilities";
import { MODULE_NAME } from "../Constants";
import {
    abilityFlat, abilityPercent, attackPowerFromStat, createTalentTree, damageDone,
    meleeCrit, meleeHaste, meleeHit, statPercent,
} from "./TalentBuilder";

const MELEE_ABILITIES = [ARCANE_STRIKE, ARCANE_CLEAVE, ARCANE_BLADE];

// Warrior Flurry: the talent ranks and the attack speed buff each rank triggers.
const FLURRY_TALENT_RANKS = [12319, 12971, 12972, 12973, 12974];
const FLURRY_BUFF_RANKS = [12966, 12967, 12968, 12969, 12970];
// TDB's spell_proc rows for Flurry apply to whole rank chains (negative ids),
// which per-spell cloning does not copy.
const FLURRY_TALENT_PROC = -12319;
const FLURRY_BUFF_PROC = -12966;

export const SPELLBLADE_TREE = createTalentTree({
    id: 'spellblade',
    name: 'Spellblade',
    tabIndex: 0,
    background: 'MageArcane',
    icon: 'Spell_Arcane_Blast',
    talents: [
        {
            kind: 'passive', id: 'keen-edge', row: 0, column: 1, ranks: 5,
            name: 'Keen Edge', icon: 'Ability_Warrior_DecisiveStrike',
            description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
            effects: [meleeCrit(1)],
        },
        {
            kind: 'passive', id: 'runic-edge', row: 0, column: 2, ranks: 5,
            name: 'Runic Edge', icon: 'INV_Sword_39',
            description: 'Increases the damage of Arcane Strike, Arcane Cleave and Arcane Blade by $s1%.',
            effects: [abilityPercent('DAMAGE', 3, MELEE_ABILITIES)],
        },
        {
            kind: 'passive', id: 'spell-forged-might', row: 1, column: 0, ranks: 5,
            name: 'Spell-Forged Might', icon: 'Spell_Holy_FistOfJustice',
            description: 'Increases your Strength by $s1%.',
            effects: [statPercent('STRENGTH', 2)],
        },
        {
            kind: 'passive', id: 'arcane-momentum', row: 1, column: 1, ranks: 2,
            name: 'Arcane Momentum', icon: 'Spell_Arcane_Blink',
            description: 'Reduces the cooldown of Arcane Charge by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2000, [ARCANE_CHARGE])],
        },
        {
            kind: 'passive', id: 'arcane-fury', row: 1, column: 2, ranks: 3,
            name: 'Arcane Fury', icon: 'Spell_Arcane_ArcanePotency',
            description: 'Increases all physical and Arcane damage you deal by $s1%.',
            effects: [damageDone(['PHYSICAL', 'ARCANE'], 1)],
        },
        {
            kind: 'passive', id: 'arcane-might', row: 2, column: 1, ranks: 3,
            name: 'Arcane Might', icon: 'Spell_Arcane_ArcaneResilience',
            description: 'Increases your attack power by $s1% of your Intellect.',
            effects: [attackPowerFromStat('INTELLECT', 10)],
        },
        {
            kind: 'passive', id: 'blade-discipline', row: 2, column: 2, ranks: 2,
            name: 'Blade Discipline', icon: 'Spell_Arcane_MindMastery',
            description: 'Reduces the mana cost of Arcane Strike and Arcane Cleave by $S1%.',
            effects: [abilityPercent('COST', -10, [ARCANE_STRIKE, ARCANE_CLEAVE])],
        },
        {
            kind: 'passive', id: 'improved-shockwave', row: 3, column: 0, ranks: 3,
            name: 'Improved Arcane Shockwave', icon: 'Spell_Arcane_ArcaneTorrent',
            description: 'Increases the damage of Arcane Shockwave by $s1%.',
            effects: [abilityPercent('DAMAGE', 10, [ARCANE_SHOCKWAVE])],
        },
        {
            kind: 'passive', id: 'steady-hand', row: 3, column: 2, ranks: 3,
            name: 'Steady Hand', icon: 'Ability_Marksmanship',
            description: 'Increases your chance to hit with melee attacks by $s1%.',
            effects: [meleeHit(1)],
        },
        {
            kind: 'custom', id: 'arcane-flurry', row: 4, column: 1, ranks: FLURRY_TALENT_RANKS.length,
            createRanks: createArcaneFlurryRanks,
        },
        {
            kind: 'passive', id: 'improved-arcane-cleave', row: 5, column: 0, ranks: 3,
            name: 'Improved Arcane Cleave', icon: 'Ability_Warrior_Cleave',
            description: 'Increases the damage of Arcane Cleave by $s1%.',
            effects: [abilityPercent('DAMAGE', 15, [ARCANE_CLEAVE])],
        },
        {
            kind: 'passive', id: 'battle-trance', row: 5, column: 2, ranks: 5,
            name: 'Battle Trance', icon: 'Ability_SearingArrow',
            description: 'Increases the critical strike damage bonus of Arcane Strike, Arcane Cleave'
                + ' and Arcane Blade by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, MELEE_ABILITIES)],
        },
        { kind: 'active', id: 'arcane-blade', row: 6, column: 1, ability: ARCANE_BLADE },
        {
            kind: 'passive', id: 'quickened-blade', row: 7, column: 0, ranks: 5,
            name: 'Quickened Blade', icon: 'Ability_Rogue_SliceDice',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'improved-arcane-blade', row: 7, column: 1, ranks: 2,
            requires: 'arcane-blade',
            name: 'Improved Arcane Blade', icon: 'Spell_Arcane_FocusedPower',
            description: 'Reduces the cooldown of Arcane Blade by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -500, [ARCANE_BLADE])],
        },
        {
            kind: 'passive', id: 'enduring-might', row: 8, column: 0, ranks: 2,
            name: 'Enduring Might', icon: 'Spell_Holy_WordFortitude',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'arcane-supremacy', row: 8, column: 2, ranks: 3,
            name: 'Arcane Supremacy', icon: 'Spell_Arcane_Arcane04',
            description: 'Increases all Arcane damage you deal by $s1%.',
            effects: [damageDone(['ARCANE'], 2)],
        },
        {
            kind: 'passive', id: 'unrelenting-arcana', row: 9, column: 1, ranks: 3,
            name: 'Unrelenting Arcana', icon: 'Spell_Arcane_Arcane01',
            description: 'Increases the critical strike chance of Arcane Strike by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 5, [ARCANE_STRIKE])],
        },
        {
            kind: 'passive', id: 'blade-of-the-magus', row: 10, column: 1, ranks: 1,
            name: 'Blade of the Magus', icon: 'INV_Sword_61',
            description: 'Increases the damage of Arcane Strike, Arcane Cleave and Arcane Blade by $s1%'
                + ' and your chance to get a critical strike with melee weapons by $s2%.',
            effects: [abilityPercent('DAMAGE', 10, MELEE_ABILITIES), meleeCrit(3)],
        },
    ],
});

function createArcaneFlurryRanks() {
    return FLURRY_TALENT_RANKS.map((talentParent, index) => {
        const rank = index + 1;
        const buff = std.Spells.create(MODULE_NAME, `arcane-flurry-buff-rank-${rank}`, FLURRY_BUFF_RANKS[index])
            .Name.enGB.set('Arcane Flurry')
            .Icon.setPath('Spell_Arcane_ArcanePotency')
            .AuraDescription.enGB.set('Attack speed increased by $s1%.');
        std.SQL.spell_proc.query({ SpellId: FLURRY_BUFF_PROC }).clone(buff.ID);

        const talent = std.Spells.create(MODULE_NAME, `arcane-flurry-rank-${rank}`, talentParent)
            .Name.enGB.set('Arcane Flurry')
            .Icon.setPath('Spell_Arcane_ArcanePotency')
            .Description.enGB.set(`Increases your attack speed by $${buff.ID}s1% for your next 3 swings`
                + ' after dealing a melee critical strike.');
        talent.Effects.get(0).TriggerSpell.set(buff.ID);
        std.SQL.spell_proc.query({ SpellId: FLURRY_TALENT_PROC }).clone(talent.ID);
        return talent;
    });
}
