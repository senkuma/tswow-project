import {
    abilityFlat, abilityPercent, ALL_SCHOOLS, armorFromItems, attackerMeleeCrit, createTalentTree, damageTaken, dodge,
    MAGIC_SCHOOLS, maxHealthPercent, onMeleeHitTaken, parry, procMask, statPercent, stunDuration, TalentSpellConfig,
    threat, triggerSpell,
} from "classkit";
import { std } from "wow/wotlk";
import {
    ANCHOR, BARRIER_PROJECTION, CRUSHING_WEIGHT, EVENT_HORIZON, GRAVITON_SHOCKWAVE, GRAVITY_WELL, OBSIDIAN_STAND,
    SIPHON_THE_VOID, UNRAVEL, VOID_BARRIER,
} from "../abilities/BulwarkAbilities";
import { VOID_SHARDS } from "../abilities/VoidShards";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import {
    ENTROPIC_ABSORPTION, GRAVITON_SHELL, KINETIC_RECOIL, SPATIAL_BACKLASH, SPATIAL_BACKLASH_DAMAGE,
} from "./BulwarkProcs";

// TrinityCore's spell_proc hit masks, as Shield Specialization (dodge, parry) and Mana Shield (absorb) use them.
const PROC_HIT_DODGE = 0x10;
const PROC_HIT_PARRY = 0x20;
const PROC_HIT_ABSORB = 0x400;

const ENTROPIC_ABSORPTION_COOLDOWN_MS = 1000;
const ACCRETION_COOLDOWN_MS = 3000;
const GRAVITON_SHELL_COOLDOWN_MS = 30000;

/** Procs when the owner dodges or parries a melee attack or ability. */
const onDodgeOrParry = (chancePerRank: number): TalentSpellConfig => (spell, rank) => {
    // DBC proc flags and chance first: creating the spell_proc row copies them.
    spell.Proc.TriggerMask.set(procMask(['TAKEN_MELEE_AUTO_ATTACK', 'TAKEN_MELEE_SPELL']));
    spell.Proc.Chance.set(chancePerRank * rank);
    // An avoided ability deals no damage, so every spell type counts.
    spell.Proc.TypeMask.set(['DAMAGE', 'HEAL', 'OTHER']);
    spell.Proc.PhaseMask.set('HIT');
    // UNVERIFIED API: HitMask given a raw mask, as classkit gives TriggerMask one.
    spell.Proc.HitMask.set(PROC_HIT_DODGE | PROC_HIT_PARRY);
};

/** Procs when an absorb effect soaks part or all of a hit on the owner, whoever cast the absorb. */
const onDamageAbsorbed = (chancePerRank: number, cooldownMs: number): TalentSpellConfig => (spell, rank) => {
    // Mana Shield's proc flags: every melee, ranged and spell hit taken.
    spell.Proc.TriggerMask.set(procMask([
        'TAKEN_MELEE_AUTO_ATTACK', 'TAKEN_MELEE_SPELL', 'TAKEN_RANGED_AUTO_ATTACK', 'TAKEN_RANGED_SPELL',
        'TAKEN_NO_CLASS_SPELL_NEGATIVE', 'TAKEN_MAGIC_SPELL_NEGATIVE',
    ]));
    spell.Proc.Chance.set(chancePerRank * rank);
    spell.Proc.TypeMask.set('DAMAGE');
    spell.Proc.PhaseMask.set('HIT');
    // UNVERIFIED API: HitMask given a raw mask, as classkit gives TriggerMask one.
    spell.Proc.HitMask.set(PROC_HIT_ABSORB);
    std.SQL.spell_proc.query({ SpellId: spell.ID }).Cooldown.set(cooldownMs);
};

/** Tank: void barriers, avoidance, and the mass to hold every foe in orbit. */
export const BULWARK_TREE = createTalentTree(VK, {
    id: 'bulwark',
    name: 'Bulwark',
    tabIndex: 2,
    background: 'DeathKnightBlood',
    icon: 'Spell_Shadow_AntiShadow',
    talents: [
        {
            kind: 'passive', id: 'dense-matter', row: 0, column: 0, ranks: 5,
            name: 'Dense Matter', icon: 'INV_Elemental_Primal_Shadow',
            description: 'Increases your armor value from items by $s1%.',
            effects: [armorFromItems(2)],
        },
        {
            kind: 'passive', id: 'abyssal-fortitude', row: 0, column: 1, ranks: 5,
            name: 'Abyssal Fortitude', icon: 'Spell_Shadow_DemonicFortitude',
            description: 'Increases your Stamina by $s1%.',
            effects: [statPercent('STAMINA', 2)],
        },
        {
            kind: 'passive', id: 'kinetic-recoil', row: 0, column: 2, ranks: 2,
            name: 'Kinetic Recoil', icon: 'Spell_Shadow_GatherShadows',
            description: 'When you dodge or parry an attack, you have a $h% chance to turn its force into'
                + ` $/10;${KINETIC_RECOIL.ID}s1 rage.`,
            effects: [triggerSpell(KINETIC_RECOIL.ID)],
            configure: onDodgeOrParry(50),
        },
        {
            kind: 'passive', id: 'gravitic-reflexes', row: 1, column: 0, ranks: 5,
            name: 'Gravitic Reflexes', icon: 'Ability_Warlock_Avoidance',
            description: 'Increases your chance to dodge by $s1%.',
            effects: [dodge(1)],
        },
        {
            kind: 'passive', id: 'tethered-will', row: 1, column: 1, ranks: 2,
            name: 'Tethered Will', icon: 'Spell_Shadow_SoulLeech_3',
            description: 'Reduces the cooldown of Anchor by $/1000;S1 sec and the cooldown of Gravity Well'
                + ' by $/1000;S2 sec.',
            effects: [
                abilityFlat('COOLDOWN', -1000, [ANCHOR]),
                abilityFlat('COOLDOWN', -30000, [GRAVITY_WELL]),
            ],
        },
        {
            kind: 'passive', id: 'inexorable-gravity', row: 1, column: 2, ranks: 3,
            name: 'Inexorable Gravity', icon: 'Spell_Shadow_AuraOfDarkness',
            description: 'Increases the threat you cause by $s1%.',
            effects: [threat(5)],
        },
        {
            kind: 'passive', id: 'reinforced-barriers', row: 2, column: 0, ranks: 3,
            name: 'Reinforced Barriers', icon: 'Spell_Shadow_NetherProtection',
            description: 'Increases the damage absorbed by Void Barrier by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 10, [VOID_BARRIER])],
        },
        { kind: 'active', id: 'obsidian-stand', row: 2, column: 1, ability: OBSIDIAN_STAND },
        {
            kind: 'passive', id: 'deflecting-field', row: 2, column: 2, ranks: 3,
            name: 'Deflecting Field', icon: 'Spell_DeathKnight_SpellDeflection',
            description: 'Increases your chance to parry by $s1%.',
            effects: [parry(1)],
        },
        {
            kind: 'passive', id: 'fixed-point', row: 3, column: 0, ranks: 2,
            name: 'Fixed Point', icon: 'Spell_Arcane_FocusedPower',
            description: 'Reduces the duration of stun effects on you by $S1%.',
            effects: [stunDuration(-15)],
        },
        {
            kind: 'passive', id: 'improved-obsidian-stand', row: 3, column: 1, ranks: 2,
            requires: 'obsidian-stand',
            name: 'Improved Obsidian Stand', icon: 'INV_Misc_Gem_EbonDraenite_02',
            description: 'Reduces the cooldown of Obsidian Stand by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [OBSIDIAN_STAND])],
        },
        {
            kind: 'passive', id: 'entropic-absorption', row: 3, column: 2, ranks: 2,
            name: 'Entropic Absorption', icon: 'Spell_Shadow_ManaFeed',
            description: 'Whenever an absorb effect soaks damage done to you, you have a $h% chance to gain'
                + ` $/10;${ENTROPIC_ABSORPTION.ID}s1 rage.  This effect cannot occur more often than once every`
                + ` ${ENTROPIC_ABSORPTION_COOLDOWN_MS / 1000} sec.`,
            effects: [triggerSpell(ENTROPIC_ABSORPTION.ID)],
            configure: onDamageAbsorbed(50, ENTROPIC_ABSORPTION_COOLDOWN_MS),
        },
        {
            kind: 'passive', id: 'unyielding-mass', row: 4, column: 0, ranks: 3,
            name: 'Unyielding Mass', icon: 'Ability_Defend',
            description: 'Reduces the chance you will be critically hit by melee attacks by $S1%.',
            effects: [attackerMeleeCrit(-2)],
        },
        {
            kind: 'passive', id: 'heavy-burden', row: 4, column: 1, ranks: 3,
            name: 'Heavy Burden', icon: 'Spell_Shadow_CurseOfSargeras',
            description: 'Increases the damage of Crushing Weight by $s1% and reduces its rage cost by $/10;S2.',
            // Rage costs are stored in tenths of a point.
            effects: [
                abilityPercent('DAMAGE', 10, [CRUSHING_WEIGHT]),
                abilityFlat('COST', -10, [CRUSHING_WEIGHT]),
            ],
        },
        {
            kind: 'passive', id: 'quickened-barriers', row: 4, column: 2, ranks: 2,
            name: 'Quickened Barriers', icon: 'Spell_Shadow_SealOfKings',
            description: 'Reduces the cooldown of Void Barrier by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [VOID_BARRIER])],
        },
        {
            kind: 'passive', id: 'null-ward', row: 5, column: 0, ranks: 3,
            name: 'Null Ward', icon: 'Spell_Shadow_AntiMagicShell',
            description: 'Reduces all spell damage taken by $S1%.',
            effects: [damageTaken(MAGIC_SCHOOLS, -2)],
        },
        {
            kind: 'passive', id: 'accretion', row: 5, column: 1, ranks: 3,
            name: 'Accretion', icon: 'INV_Enchant_VoidSphere',
            description: 'When struck by a melee attack, you have a $h% chance to gain a Void Shard.'
                + `  This effect cannot occur more often than once every ${ACCRETION_COOLDOWN_MS / 1000} sec.`,
            effects: [triggerSpell(VOID_SHARDS.ID)],
            configure: onMeleeHitTaken(5, ACCRETION_COOLDOWN_MS),
        },
        {
            kind: 'passive', id: 'receding-horizon', row: 5, column: 2, ranks: 3,
            name: 'Receding Horizon', icon: 'Spell_Shadow_Twilight',
            description: 'Reduces the cooldown of Event Horizon by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [EVENT_HORIZON])],
        },
        {
            kind: 'passive', id: 'spatial-backlash', row: 6, column: 0, ranks: 3,
            name: 'Spatial Backlash', icon: 'Spell_Shadow_Shadesofdarkness',
            description: 'When struck by a melee attack, you have a $h% chance to lash the attacker with warped'
                + ` space, dealing ${SPATIAL_BACKLASH_DAMAGE} Shadow damage.`,
            effects: [triggerSpell(SPATIAL_BACKLASH.ID)],
            configure: onMeleeHitTaken(5),
        },
        { kind: 'active', id: 'barrier-projection', row: 6, column: 1, ability: BARRIER_PROJECTION },
        {
            kind: 'passive', id: 'crystalline-lattice', row: 6, column: 2, ranks: 2,
            name: 'Crystalline Lattice', icon: 'INV_Misc_Gem_Amethyst_02',
            description: 'Each Void Shard increases the damage absorbed by Void Barrier and the healing of Siphon'
                + ' the Void by an additional $s1%.',
            // Void Shards' second effect is its per-shard bonus to Void Barrier and Siphon the Void.
            effects: [abilityFlat('EFFECT2', 5, [VOID_SHARDS])],
        },
        {
            kind: 'passive', id: 'deep-siphon', row: 7, column: 0, ranks: 3,
            name: 'Deep Siphon', icon: 'Spell_Shadow_LifeDrain02',
            description: 'Increases the healing of Siphon the Void by $s1%.',
            effects: [abilityPercent('ALL_EFFECTS', 10, [SIPHON_THE_VOID])],
        },
        {
            kind: 'passive', id: 'improved-barrier-projection', row: 7, column: 1, ranks: 2,
            requires: 'barrier-projection',
            name: 'Improved Barrier Projection', icon: 'Spell_Shadow_SacrificialShield',
            description: 'Reduces the cooldown of Barrier Projection by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -10000, [BARRIER_PROJECTION])],
        },
        {
            kind: 'passive', id: 'void-hardened-shards', row: 7, column: 2, ranks: 1,
            requires: 'crystalline-lattice',
            name: 'Void-Hardened Shards', icon: 'Spell_Shadow_SoulGem',
            description: 'Each Void Shard you hold reduces damage taken by an additional $S1%.',
            // Void Shards' third effect is its per-shard damage reduction.
            // UNVERIFIED API: SpellModOp 'EFFECT3', named like the proven 'EFFECT1' and 'EFFECT2'.
            effects: [abilityFlat('EFFECT3', -1, [VOID_SHARDS])],
        },
        {
            kind: 'passive', id: 'graviton-shell', row: 8, column: 0, ranks: 3,
            name: 'Graviton Shell', icon: 'Spell_Shadow_ShadowWard',
            description: 'When struck by a melee attack, you have a $h% chance to harden the void around you,'
                + ` reducing all damage taken by $${GRAVITON_SHELL.ID}S1% for $${GRAVITON_SHELL.ID}d.`
                + `  This effect cannot occur more often than once every ${GRAVITON_SHELL_COOLDOWN_MS / 1000} sec.`,
            effects: [triggerSpell(GRAVITON_SHELL.ID)],
            configure: onMeleeHitTaken(2, GRAVITON_SHELL_COOLDOWN_MS),
        },
        {
            kind: 'passive', id: 'gravitational-dominance', row: 8, column: 1, ranks: 3,
            name: 'Gravitational Dominance', icon: 'Spell_Shadow_EvilEye',
            description: 'Increases the threat generated by Unravel, Crushing Weight and Graviton Shockwave by $s1%.',
            effects: [abilityPercent('THREAT', 10, [UNRAVEL, CRUSHING_WEIGHT, GRAVITON_SHOCKWAVE])],
        },
        {
            kind: 'passive', id: 'neutron-core', row: 8, column: 2, ranks: 3,
            name: 'Neutron Core', icon: 'Spell_Arcane_StarFire',
            description: 'Increases your maximum health by $s1%.',
            effects: [maxHealthPercent(2)],
        },
        {
            kind: 'passive', id: 'void-lattice', row: 9, column: 1, ranks: 3,
            name: 'Void Lattice', icon: 'Spell_Shadow_NetherCloak',
            description: 'Reduces all damage taken by $S1%.',
            effects: [damageTaken(ALL_SCHOOLS, -1)],
        },
        { kind: 'active', id: 'graviton-shockwave', row: 10, column: 1, ability: GRAVITON_SHOCKWAVE },
    ],
});
