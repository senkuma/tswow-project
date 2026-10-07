import {
    abilityFlat, abilityPercent, attackPowerPercent, createProcBuffTalentRanks, createTalentTree, damageDone,
    FamilyTarget, meleeCrit, meleeHaste, meleeHit, onAbilityHit, onMeleeHit, onMeleeHitTaken, procMask,
    restrictProcToFamily, TalentSpellConfig, triggerSpell,
} from "classkit";
import {
    DIMENSIONAL_RUPTURE, FOLD_SPACE, NULL_STRIKE, PHASE_SHIFT, RIFT_AMBUSH, RIFT_CLEAVE, RIFT_STEP, SHATTER_REALITY,
    SPATIAL_REND, TEAR_REALITY, WEIGHTLESS,
} from "../abilities/RiftAbilities";
import { VOID_SHARDS } from "../abilities/VoidShards";
import { VOID_KNIGHT_CONTEXT as VK } from "../VoidKnightClass";
import {
    DISPLACEMENT, RIFT_ECHO, RIFT_ECHO_DAMAGE_TEXT, SPLINTERED_REALITY, SPLINTERED_REALITY_DAMAGE_TEXT,
} from "./RiftProcs";

const RIFT_STRIKES = [TEAR_REALITY, RIFT_CLEAVE, DIMENSIONAL_RUPTURE];
const DISPLACEMENT_COOLDOWN_MS = 30000;

/**
 * Procs on the periodic damage of `targets`. The classkit proc configs only
 * react to direct hits, and a damage-over-time tick is neither a melee nor a
 * magic spell hit.
 */
const onPeriodicDamage = (chancePerRank: number, targets: FamilyTarget[]): TalentSpellConfig => (spell, rank) => {
    // See classkit's onMeleeHit for why the DBC fields come first.
    spell.Proc.TriggerMask.set(procMask(['DONE_PERIODIC']));
    spell.Proc.Chance.set(chancePerRank * rank);
    spell.Proc.TypeMask.set('DAMAGE');
    spell.Proc.PhaseMask.set('HIT');
    restrictProcToFamily(VK, spell, targets);
};

/** Damage: tears in space, quickened strikes and shadow wounds that build to a burst. */
export const RIFT_TREE = createTalentTree(VK, {
    id: 'rift',
    name: 'Rift',
    tabIndex: 1,
    background: 'DeathKnightFrost',
    icon: 'Spell_Arcane_PortalShattrath',
    talents: [
        {
            kind: 'passive', id: 'jagged-rifts', row: 0, column: 0, ranks: 5,
            name: 'Jagged Rifts', icon: 'Spell_Shadow_ShadowWordPain',
            description: 'Increases the periodic damage of Spatial Rend by $s1%.',
            effects: [abilityPercent('DOT', 4, [SPATIAL_REND])],
        },
        {
            kind: 'passive', id: 'temporal-acuity', row: 0, column: 1, ranks: 5,
            name: 'Temporal Acuity', icon: 'Spell_Arcane_MindMastery',
            description: 'Increases your chance to get a critical strike with melee weapons by $s1%.',
            effects: [meleeCrit(1)],
        },
        {
            kind: 'passive', id: 'slipstream', row: 0, column: 2, ranks: 2,
            name: 'Slipstream', icon: 'Spell_Arcane_Blink',
            description: 'Reduces the cooldown of Fold Space and Rift Step by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -2500, [FOLD_SPACE, RIFT_STEP])],
        },
        {
            kind: 'passive', id: 'silent-void', row: 1, column: 0, ranks: 2,
            name: 'Silent Void', icon: 'Spell_Shadow_ConeOfSilence',
            description: 'Reduces the cooldown of Null Strike by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -1000, [NULL_STRIKE])],
        },
        {
            kind: 'passive', id: 'umbral-edge', row: 1, column: 1, ranks: 5,
            name: 'Umbral Edge', icon: 'Spell_Shadow_ShadowBolt',
            description: 'Increases all Shadow damage you deal by $s1%.',
            effects: [damageDone(['SHADOW'], 1)],
        },
        {
            kind: 'passive', id: 'widening-rift', row: 1, column: 2, ranks: 2,
            name: 'Widening Rift', icon: 'Spell_Arcane_PortalUnderCity',
            description: 'Your Rift Cleave strikes up to $s1 additional targets.',
            effects: [abilityFlat('JUMP_TARGETS', 1, [RIFT_CLEAVE])],
        },
        {
            kind: 'passive', id: 'displacement', row: 1, column: 3, ranks: 3,
            name: 'Displacement', icon: 'Spell_Shadow_ImpPhaseShift',
            description: 'When struck by a melee attack, you have a $h% chance to slip partially out of phase,'
                + ` increasing your chance to dodge by $${DISPLACEMENT.ID}s1% for $${DISPLACEMENT.ID}d.`
                + `  This effect cannot occur more often than once every ${DISPLACEMENT_COOLDOWN_MS / 1000} sec.`,
            effects: [triggerSpell(DISPLACEMENT.ID)],
            configure: onMeleeHitTaken(10, DISPLACEMENT_COOLDOWN_MS),
        },
        {
            kind: 'passive', id: 'blurred-edges', row: 2, column: 0, ranks: 3,
            name: 'Blurred Edges', icon: 'Spell_Shadow_DetectLesserInvisibility',
            description: 'Reduces the rage cost of Spatial Rend, Rift Cleave and Tear Reality by $/10;S1.',
            // Rage costs are stored in tenths of a point.
            effects: [abilityFlat('COST', -10, [SPATIAL_REND, RIFT_CLEAVE, TEAR_REALITY])],
        },
        { kind: 'active', id: 'tear-reality', row: 2, column: 1, ability: TEAR_REALITY },
        {
            kind: 'passive', id: 'fractured-space', row: 2, column: 2, ranks: 2,
            name: 'Fractured Space', icon: 'INV_Enchant_ShardPrismaticLarge',
            description: 'Critical strikes with Tear Reality and Dimensional Rupture have a $h% chance to grant'
                + ' you a Void Shard.',
            effects: [triggerSpell(VOID_SHARDS.ID)],
            configure: onAbilityHit(VK, 50, [TEAR_REALITY, DIMENSIONAL_RUPTURE], 'CRITICAL'),
        },
        {
            kind: 'passive', id: 'void-sight', row: 2, column: 3, ranks: 3,
            name: 'Void Sight', icon: 'Spell_Shadow_DetectInvisibility',
            description: 'Increases your chance to hit with melee attacks by $s1%.',
            effects: [meleeHit(1)],
        },
        {
            kind: 'passive', id: 'lingering-tear', row: 3, column: 0, ranks: 2,
            name: 'Lingering Tear', icon: 'Spell_Shadow_LastingAfflictions',
            description: 'Increases the duration of Spatial Rend by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 3000, [SPATIAL_REND])],
        },
        {
            kind: 'passive', id: 'improved-tear-reality', row: 3, column: 1, ranks: 2,
            requires: 'tear-reality',
            name: 'Improved Tear Reality', icon: 'Spell_Shadow_PainAndSuffering',
            description: 'Reduces the cooldown of Tear Reality by $/1000;S1 sec and increases its damage by $s2%.',
            effects: [
                abilityFlat('COOLDOWN', -500, [TEAR_REALITY]),
                abilityPercent('DAMAGE', 5, [TEAR_REALITY]),
            ],
        },
        {
            kind: 'passive', id: 'shearing-strikes', row: 3, column: 2, ranks: 3,
            name: 'Shearing Strikes', icon: 'Spell_Shadow_MindShear',
            description: 'Increases the critical strike chance of Tear Reality, Rift Cleave and Dimensional Rupture'
                + ' by $s1%.',
            effects: [abilityFlat('CRITICAL_CHANCE', 2, RIFT_STRIKES)],
        },
        {
            kind: 'passive', id: 'unstable-rifts', row: 4, column: 0, ranks: 3,
            name: 'Unstable Rifts', icon: 'Spell_Shadow_UnstableAffliction_3',
            description: 'The periodic damage of your Spatial Rend has a $h% chance to grant you a Void Shard.',
            effects: [triggerSpell(VOID_SHARDS.ID)],
            configure: onPeriodicDamage(6, [SPATIAL_REND]),
        },
        {
            kind: 'custom', id: 'temporal-flux', row: 4, column: 1, ranks: 5,
            createRanks: () => createProcBuffTalentRanks(VK, {
                id: 'temporal-flux',
                name: 'Temporal Flux',
                icon: 'Spell_Nature_TimeStop',
                // Shaman Flurry: talent ranks, the buff each triggers, and TDB's chain-wide proc rows.
                talentRanks: [16256, 16281, 16282, 16283, 16284],
                buffRanks: [16257, 16277, 16278, 16279, 16280],
                talentProcRow: -16256,
                buffProcRow: -16257,
                description: buffId => `Increases your attack speed by $${buffId}s1% for your next 3 swings`
                    + ' after dealing a melee critical strike.',
                buffDescription: 'Attack speed increased by $s1%.',
            }),
        },
        {
            kind: 'passive', id: 'riftstorm', row: 4, column: 2, ranks: 3,
            name: 'Riftstorm', icon: 'Ability_Rogue_ShadowStrikes',
            description: 'Increases the damage of Rift Cleave and Dimensional Rupture by $s1%.',
            effects: [abilityPercent('DAMAGE', 5, [RIFT_CLEAVE, DIMENSIONAL_RUPTURE])],
        },
        {
            kind: 'passive', id: 'unmoored', row: 5, column: 0, ranks: 2,
            name: 'Unmoored', icon: 'Spell_Magic_FeatherFall',
            description: 'Reduces the cooldown of Phase Shift and Weightless by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -30000, [PHASE_SHIFT, WEIGHTLESS])],
        },
        {
            kind: 'passive', id: 'accelerated-reflexes', row: 5, column: 1, ranks: 3,
            name: 'Accelerated Reflexes', icon: 'Spell_Holy_BorrowedTime',
            description: 'Increases your melee attack speed by $s1%.',
            effects: [meleeHaste(2)],
        },
        {
            kind: 'passive', id: 'reverberating-rifts', row: 5, column: 3, ranks: 3,
            name: 'Reverberating Rifts', icon: 'Spell_Arcane_PortalDalaran',
            description: 'Your melee attacks have a $h% chance to tear a small rift in the target, dealing '
                + RIFT_ECHO_DAMAGE_TEXT + ` Shadow damage and generating $/10;${RIFT_ECHO.ID}s2 rage.`,
            effects: [triggerSpell(RIFT_ECHO.ID)],
            configure: onMeleeHit(3),
        },
        { kind: 'active', id: 'rift-ambush', row: 6, column: 1, ability: RIFT_AMBUSH },
        {
            kind: 'passive', id: 'improved-rift-ambush', row: 6, column: 2, ranks: 2,
            requires: 'rift-ambush',
            name: 'Improved Rift Ambush', icon: 'Ability_Rogue_Shadowstep',
            description: 'Reduces the cooldown of Rift Ambush by $/1000;S1 sec.',
            effects: [abilityFlat('COOLDOWN', -5000, [RIFT_AMBUSH])],
        },
        {
            kind: 'passive', id: 'splintered-reality', row: 7, column: 0, ranks: 2,
            name: 'Splintered Reality', icon: 'Spell_Shadow_Misery',
            description: 'Your Rift Cleave and Dimensional Rupture have a $h% chance to splinter reality around each'
                + ` enemy they strike, dealing ${SPLINTERED_REALITY_DAMAGE_TEXT} Shadow damage over`
                + ` $${SPLINTERED_REALITY.ID}d.`,
            effects: [triggerSpell(SPLINTERED_REALITY.ID)],
            configure: onAbilityHit(VK, 50, [RIFT_CLEAVE, DIMENSIONAL_RUPTURE]),
        },
        {
            kind: 'passive', id: 'riftborn-might', row: 7, column: 1, ranks: 3,
            name: 'Riftborn Might', icon: 'Spell_DeathKnight_DarkConviction',
            description: 'Increases your attack power by $s1%.',
            effects: [attackPowerPercent(2)],
        },
        {
            kind: 'passive', id: 'cascading-rupture', row: 7, column: 2, ranks: 2,
            name: 'Cascading Rupture', icon: 'Spell_Shadow_DemonicCircleSummon',
            description: 'Increases the radius of Dimensional Rupture by $s1 yards and reduces its cooldown'
                + ' by $/1000;S2 sec.',
            effects: [
                abilityFlat('RADIUS', 2, [DIMENSIONAL_RUPTURE]),
                abilityFlat('COOLDOWN', -1000, [DIMENSIONAL_RUPTURE]),
            ],
        },
        {
            kind: 'passive', id: 'echoing-void', row: 7, column: 3, ranks: 2,
            requires: 'reverberating-rifts',
            name: 'Echoing Void', icon: 'Spell_Shadow_Haunting',
            description: 'Increases the damage of Rift Echo by $s1%.',
            effects: [abilityPercent('DAMAGE', 20, [RIFT_ECHO])],
        },
        {
            kind: 'passive', id: 'entropy', row: 8, column: 1, ranks: 3,
            name: 'Entropy', icon: 'Spell_Shadow_CurseOfAchimonde',
            description: 'Increases the periodic damage of Spatial Rend and Splintered Reality by $s1%.',
            effects: [abilityPercent('DOT', 5, [SPATIAL_REND, SPLINTERED_REALITY])],
        },
        {
            kind: 'passive', id: 'time-dilation', row: 8, column: 2, ranks: 2,
            name: 'Time Dilation', icon: 'INV_Misc_PocketWatch_01',
            description: 'Increases the duration of Shatter Reality by $/1000;s1 sec.',
            effects: [abilityFlat('DURATION', 2000, [SHATTER_REALITY])],
        },
        {
            kind: 'passive', id: 'rift-mastery', row: 9, column: 1, ranks: 3,
            name: 'Rift Mastery', icon: 'Spell_Arcane_ArcanePotency',
            description: 'Increases the critical strike damage bonus of Tear Reality, Rift Cleave, Dimensional'
                + ' Rupture and Rift Echo by $s1%.',
            effects: [abilityPercent('CRIT_DAMAGE_BONUS', 10, [...RIFT_STRIKES, RIFT_ECHO])],
        },
        { kind: 'active', id: 'shatter-reality', row: 10, column: 1, ability: SHATTER_REALITY },
    ],
});
