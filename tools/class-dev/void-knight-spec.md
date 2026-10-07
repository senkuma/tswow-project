# Void Knight build spec (shared by every implementer)

Repo: /home/user/tswow-project (TSWoW 3.3.5 server project; modules under `modules/`).
New module: `modules/voidknight` — a plate **tank/DPS** class that manipulates **space, gravity and void barriers**
(not "just shadow damage"). It must be the most complete custom class in the repo: WotLK-like spell count
(~40 abilities, many with WotLK-style rank chains), three full talent trees, two gear sets with accessories,
and a growing weapon. Read the existing modules first — **match their style exactly** (comment density,
naming, idioms): `modules/marauder`, `modules/monk`, `modules/mountainking`, `modules/plaguedoctor`, and the
shared builders in `modules/classkit/datascripts/*.ts` (read ALL of classkit; it is short).

## Already written (do not rename; you may read)
- `voidknight/datascripts/Constants.ts` — MODULE_NAME, VOID_KNIGHT_RACES (all 10), VOID_KNIGHT_SPELL_FAMILY = 25,
  GLOBAL_COOLDOWN_MS = 1500, ATTACK_SPELL, ARMS_SKILL_LINE, WARRIOR_CLASS_ID, PALADIN_CLASS_ID.
- `VoidKnightClass.ts` — class (WARRIOR parent: **rage**), `VOID_KNIGHT_CONTEXT` (import as `VK`).
- `VoidKnightSkills.ts` — spellbook tabs `SKILL_GRAVITY`, `SKILL_RIFT`, `SKILL_BULWARK`; proficiencies (plate,
  all 1H/2H swords/axes/maces, polearms; **no shields** — void barriers replace them; tanks use 2H like death knights).
- `abilities/FamilyBits.ts` — `FAMILY_BIT`: **every** bit is pre-allocated. Use only your assigned names/slots.
- `abilities/VoidShards.ts` — the class resource: `VOID_SHARDS` (stacking aura, max 5), `grantVoidShard(effect)`,
  `grantVoidShards(spell, n)`. Finishers that spend shards: COLLAPSE, IMPLOSION (damage +20%/shard via DAMAGE
  spell mod), VOID_BARRIER, SIPHON_THE_VOID (+20%/shard via ALL_EFFECTS). Each shard held: -1% damage taken.
- `abilities/Aspects.ts` — the three stances (ASPECT_OF_GRAVITY L1 dps, ASPECT_OF_THE_BULWARK L10 tank,
  ASPECT_OF_THE_RIFT L30 haste), exclusive spell group. Export `ASPECTS`.
- `abilities/AllAbilities.ts` — imports `GRAVITY_ABILITIES`, `RIFT_ABILITIES`, `BULWARK_ABILITIES` from the three
  ability files (you must export these arrays, including that tab's talent abilities) plus ASPECTS.
- `datascripts.ts` — imports every file listed below in this order.

## Tools (use them — memory of WoW data is NOT acceptable evidence)
Tools: `tools/class-dev` (run `bash tools/class-dev/setup.sh` once per session; data goes to tools/class-dev/data).
- `python3 -I tools/class-dev/spellinfo.py <spellId|'Name%pattern'> ...` — the REAL 3.3.5.12340 Spell.dbc: effects with
  TrinityCore/TSWoW names, implicit targets, radius, basepoints (`s1 = bp+1`), periodic amplitude, trigger spells,
  rank chain + levels (spell_ranks), spell_bonus_data, spell_proc, icon, cooldown, **category cooldown (catCd)**,
  category (`category` column), dispel, mechanic, power, description.
- `sqlite3`-style queries via python on `tools/class-dev/data/wotlk.sqlite` — tables: `spell` (all fields; see tools/class-dev/build_db.py),
  `icon(id,path)`, `duration`, `range`, `radius`, `casttime`, `itemdisplay(id,model0,model1,tex0,tex1,icon)`,
  `skillline`, `skilllineability`, `talenttab`, `talent`, `enchant`, `spell_ranks`, `spell_bonus_data`,
  `spell_proc`, `spell_group`, `item` (item_template subset incl. stats st1..6/sv1..6, displayid, itemLevel,
  spell1/trigger1, sockets), `creature`, `creature_default_trainer`, `trainer`.
  Example: `python3 -c "import sqlite3;c=sqlite3.connect('tools/class-dev/data/wotlk.sqlite');print(c.execute('select ...').fetchall())"`
- `python3 -I tools/class-dev/typecheck.py [datascripts|livescripts|addons|all]` — TypeScript 4.7.3 type check of the whole
  repo (TSWoW std imports are stubbed as `any`, so it checks classkit/growingweapons/module code, livescript
  and addon typings, and that side-effect imports exist). Must end clean except for files still being written
  by other agents.
- `tools/class-dev/data/api_usage.txt` — every TSWoW std member (PascalCase/UPPER) the repo already uses, with examples. TSWoW's
  library is NOT available here, so **only use members that appear in this catalog** (or in classkit). If you
  truly need another, write it in the obvious TSWoW naming, add a comment `// UNVERIFIED API: ...`, and list it
  in your final report.

## Hard rules (these are the bugs that already happened)
1. **Verify every parent spell** with spellinfo.py before using it, and design around its real effects:
   - Effects that are `DUMMY`, `SCRIPT_EFFECT`, `APPLY_AURA DUMMY`, `APPLY_AURA PERIODIC_DUMMY`, or bp `-1`
     placeholders filled by class scripts **do nothing** on a clone (clones get a new id and family 25, so no
     TrinityCore spell script or family-flag code applies). Examples found: Death and Decay's area aura is
     PERIODIC_DUMMY, Death Grip is DUMMY, Last Stand is DUMMY, Shockwave's damage is a dummy, Charge's rage is a
     dummy, Sunder Armor just triggers the warrior debuff 58567. Replace such effects with native ones
     (e.g. `Type.APPLY_AURA.set()...Aura.PERIODIC_DAMAGE.set()`, `Type.SCHOOL_DAMAGE.set()`,
     `Type.ENERGIZE.set().PowerType.set('RAGE')`), or pick another parent.
   - Prefer player spells **with rank chains** for core abilities so the spellbook gets WotLK-style ranks
     (createRankedAbility clones the whole chain and keeps its levels). Use `ranks: [...]` hand-made ranks
     (see marauder `handMadeRanks`) for parents without chains or whose levels don't fit, every ~8–10 levels to 80.
2. **Tooltip variables must match the final effect indices**: `$s1/$s2/$s3` = effect 1/2/3 base value
   (displayed unsigned), `$m1` same, `$o1` total periodic, `$t1` period seconds, `$d` duration, `$a1` radius,
   `$x1` chain targets, `$h` proc chance, `$/1000;S1` ms→sec, `$<spellId>s1` another spell's value. If you clear
   or move effects, fix the text. AP-scaled numbers use classkit `withAttackPower('$s1', coeff)`.
3. **Category cooldowns carry over** from the parent (`catCd` + `category` in spellinfo). Two clones of parents
   in the same category share one cooldown (e.g. warrior Shield Wall/Recklessness/Retaliation share category
   1209-ish with a 12s catCd). Set `Cooldown.Category.set(0)` / `Cooldown.CategoryTime.set(...)` and
   `Cooldown.Time.set(...)` explicitly whenever the parent has a category or category cooldown.
4. Rage costs: `cost: { kind: 'rage', rage: N }` (classkit converts to tenths). Free: `{ kind: 'free' }`.
   Builders typically cost 10–20 rage or are free with a cooldown; finishers 20–40; big cooldowns free.
5. Remove parent equipment requirements that don't fit (shields, daggers, ranged):
   `rank.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0)` (proven in the repo).
   Rune costs: `rank.row.RuneCostID.set(0)`.
6. Scaling: weapon strikes scale through weapon damage. Non-weapon damage/absorbs/heals use
   `scalesWithAttackPower(spell, coeff)` (direct; puts the spell on the ranged table) and
   `periodicDamageScalesWithAttackPower(spell, coeffPerTick)`; tooltip via `withAttackPower`. Endgame values:
   the server multiplies endgame gear stats by ENDGAME_POWER_FACTOR (3.25, `import { ENDGAME_POWER_FACTOR } from "endgame"`)
   — MountainKingAbilities shows how a signature buff's last rank is scaled to it.
7. Schools: gravity/void effects are SHADOW; plain weapon strikes PHYSICAL unless the ability is explicitly
   void-infused (Void Strike, Tear Reality are SHADOW weapon strikes).
8. Visuals: `visual: { id }` must be a real SpellVisual id — take it from `spell.visual0` of a real spell whose
   look fits (query the DB). Icons must exist in the `icon` table (case-insensitive match) — check every one.
9. Every ability: `familyBit: FAMILY_BIT.<NAME>`, `skillLine`, `school`, `cost`, `firstRankSource`
   ('START' only for VOID_STRIKE; 'TALENT' for talent abilities; else 'TRAINER'), `description`, `icon`.
   Proc/triggered helper spells: `createFamilySpell` with your assigned `*_PROC_n` bits only.
10. Keep comments sparse and in the repo's voice: explain *why* (what the parent provides, what is cleared and
    why), not what. No references to this spec, reviews, or "agents" in code.
11. Do not edit files you don't own (listed per workstream). If you need something from another file, use the
    exported names in the contract below.

## Ability contract (exports are fixed; levels are first-rank levels)
Each ability file exports every ability below as `export const NAME = createRankedAbility(VK, {...})` and an array
(`GRAVITY_ABILITIES`, `RIFT_ABILITIES`, `BULWARK_ABILITIES`) of all of them, in this order.

### GravityAbilities.ts (skillLine SKILL_GRAVITY)
| export | lvl | concept | parent ideas (verify!) |
|---|---|---|---|
| VOID_STRIKE | 1 START | Shadow weapon strike + bonus damage, **grants 1 Void Shard**. Core builder. | Sinister Strike 1752 chain (12 ranks; clear combo point → grantVoidShard) |
| GRAVITY_LASH | 6 | Ranged (25yd) shadow lash: AP damage + 50% snare 4s, 6s cd, **grants a shard** | Frost Shock 8056 chain / Shadow Whip 30638 (pull+dmg) w/ hand ranks |
| GRAVITATIONAL_PULL | 12 | Rip the target to you (pull) + short taunt; 25s cd; works as a tank pull | Shadow Whip 30638 (native PULL_TOWARDS + dmg); add MOD_TAUNT effect |
| COLLAPSE | 10 | Single-target **finisher**: heavy shadow weapon blow, consumes shards (+20%/shard) | Sinister Strike / Mortal-Strike-like weapon % damage, hand ranks |
| IMPLOSION | 20 | AoE **finisher** around you: AP shadow damage to all enemies within 10yd, consumes shards | Arcane Explosion 1449 chain (10 ranks, native SRC_CASTER area) |
| ANNIHILATE | 24 | Execute: only usable < 20% health, big shadow-weapon hit (marauder Behead pattern) | Sinister Strike + TargetAuraState HEALTHLESS_20_PERCENT |
| GRAVITY_LOCK | 32 | Crush gravity around you: AoE root 8s + small damage; 25s cd | Frost Nova 122 chain (native root + damage) |
| TAP_THE_VOID | 16 | Draw rage from the Void: instant 20 rage then 10 over 10s; 1 min cd; costs a little health | Bloodrage 2687 (ENERGIZE is native; check 29131 trigger) |
| CRUSHING_DESCENT | 60 | Leap to a location; slam deals weapon damage + 2s stun in 8yd | Heroic Leap 6544 (JUMP_DEST native; trigger 52174 has native stun+weapon dmg — clone 52174 as a family spell w/ GRAVITY_PROC bit and point the trigger at it) |
| talent: SINGULARITY | (row 2) | Collapse space at a target point: pull every enemy within 15yd to it + shadow damage | Gravity Well Effect 47764 / Black Hole Effect 46230 (native PULL_TOWARDS_DEST); ground-targeted dest; hand ranks |
| talent: GRAVITON_SURGE | (row 6) | Self buff 15s: melee hits gain shadow damage + each hit has 25% to grant a shard | Death Wish 12292-like self buff + proc trigger |
| talent: STELLAR_COLLAPSE | (row 10) | Capstone: black hole at target location for 8s — pulls enemies in on cast and deals heavy shadow damage every sec to enemies inside | PERSISTENT_AREA_AURA with native PERIODIC_DAMAGE (Death and Decay shape but change aura 226→3, school, AP) + pull effect |

### RiftAbilities.ts (skillLine SKILL_RIFT)
| export | lvl | concept | parent ideas |
|---|---|---|---|
| SPATIAL_REND | 4 | Tear space around the target: shadow DoT 15s (AP per tick), **grants a shard** | Rend 772 chain (10 ranks); clear BLEED mechanic, school SHADOW |
| RIFT_CLEAVE | 20 | Next swing cleaves through space: target + 1 nearby enemy | Cleave 845 chain (8 ranks) |
| FOLD_SPACE | 8 | Gap closer: charge to target, stun 1s, generates rage; 15s cd | Charge 100 (rage from DUMMY → make ENERGIZE like MountainKing ThunderCharge) |
| RIFT_STEP | 22 | Blink forward 15–20yd, frees from stuns/roots; 20s cd | Blink 1953 / Netherstep 29525 (native LEAP + mechanic immunities) |
| NULL_STRIKE | 10 | Interrupt + 4s school lockout | Pummel 6552 / Kick 1766 |
| PHASE_SHIFT | 28 | Partially phase out: +50% dodge 10s; 3 min cd | Evasion 5277 chain |
| DIMENSIONAL_RUPTURE | 36 | Whirl through rifts: weapon damage to up to 4 enemies in 8yd; 10s cd | Whirlwind 1680 (check 44949 trigger = off-hand; clear) |
| WEIGHTLESS | 26 | Shed gravity: +60% run speed 8s; 3 min cd | Sprint 2983 chain |
| talent: TEAR_REALITY | (row 2) | Shadow weapon strike, -50% healing received on target 10s, 6s cd | Mortal Strike 12294 chain (8 ranks) |
| talent: RIFT_AMBUSH | (row 6) | Step through a rift to the target (teleport) and next ability +20% | Shadowstep 36554 (check 36563/44373 triggers) or Charge-based |
| talent: SHATTER_REALITY | (row 10) | Capstone 20s burst: +20% damage, +20% haste, attacks ignore 20% armor? (pick natively supported auras) | Death Wish 12292 / Recklessness 1719 (fix category!) |

### BulwarkAbilities.ts (skillLine SKILL_BULWARK)
| export | lvl | concept | parent ideas |
|---|---|---|---|
| VOID_BARRIER | 10 | **Finisher**: void absorb shield on self (AP scaled), consumes shards (+20%/shard via ALL_EFFECTS); 8s cd | Ice Barrier 11426 (SCHOOL_ABSORB self, all schools) — hand ranks from L10 |
| ANCHOR | 10 | Taunt | Taunt 355 |
| CRUSHING_WEIGHT | 8 | AoE around you: AP shadow damage + attack speed -10/-20% 30s (tank threat builder), **grants a shard** | Thunder Clap 6343 chain (9 ranks) |
| UNRAVEL | 12 | Armor reduction 4% per stack, 5 stacks, 30s (tank builder); high threat | Sunder 7386 triggers warrior 58567 → make a family spell (BULWARK_PROC bit) with MOD_RESISTANCE_PCT/armor reduction stacks, or another native stacking armor debuff |
| ENTROPIC_SHOUT | 14 | Enemy AP reduction aura 30s (Demoralizing shout group) | Demoralizing Shout 1160 chain + `spellGroup` (look up its spell_group id) |
| MANTLE_OF_THE_VOID | 6 | Party/raid stamina buff, 1 hr, scaled like MountainKing's Strength of the Mountain | Power Word: Fortitude 1243 chain (8 ranks) or Commanding Shout; keep the parent's spell_group |
| SIPHON_THE_VOID | 18 | Instant % max-health self heal, 30s cd; **finisher** (+20%/shard via ALL_EFFECTS) | Rune Tap 48982 (HEAL_PCT native; rune cost → 0) |
| EVENT_HORIZON | 28 | -60% damage taken 12s, 5 min cd | Shield Wall 871 (no shield requirement; fix category) |
| WARP_REFLECTION | 40 | Reflect next spell, 5s, 10s cd | Spell Reflection 23920 (drop shield requirement) |
| GRAVITY_WELL | 44 | AoE taunt 10yd, 3 min cd | Challenging Shout 1161 |
| GUARDIAN_WARP | 52 | Rush to a party member and intercept the next attack | Intervene 3411 |
| talent: OBSIDIAN_STAND | (row 2) | +30% max health 20s, 3 min cd (Last Stand's effect is DUMMY → use MOD_INCREASE_HEALTH_PERCENT) | Last Stand 12975 / Shield Wall shape |
| talent: BARRIER_PROJECTION | (row 6) | Absorb shield on every party member within 30yd (AP scaled), 1 min cd | find a native area absorb (APPLY_AREA_AURA_PARTY + SCHOOL_ABSORB) or targeted ally absorb |
| talent: GRAVITON_SHOCKWAVE | (row 10) | Capstone: frontal cone 10yd, AP shadow damage + 4s stun; 20s cd | Shockwave 46968 (its damage effect is a dummy-scripted bp -1: set real PointsBase + AP scaling) |

## Talent trees (talents/GravityTree.ts, RiftTree.ts, BulwarkTree.ts)
Use classkit `createTalentTree` (read `TalentBuilder.ts`): tabIndex 0 Gravity (DPS: control/AoE/crush), 1 Rift
(DPS: space/haste/DoT burst), 2 Bulwark (tank). Backgrounds must be names from the DB `talenttab.background`
list (e.g. `DeathKnightUnholy`, `DeathKnightFrost`, `DeathKnightBlood`, `WarlockCurses`, `WarriorProtection`...).
- WotLK scale: rows 0–10, **26–30 talents per tree**, ≥ 61 total ranks, capstone at row 10 column 1. Talent
  abilities at the rows given above (kind 'active'). A few `requires` arrows (e.g. "Improved X" requires X).
- Mix: % passives via effect builders, ability-specific spell mods (`abilityPercent`/`abilityFlat` with ops
  DAMAGE, DOT, COST, COOLDOWN, CRITICAL_CHANCE, CRIT_DAMAGE_BONUS, DURATION, RADIUS, CASTING_TIME, ALL_EFFECTS,
  THREAT, JUMP_TARGETS, RANGE), procs (`onAbilityHit`, `onMeleeHit`, `onMeleeHitTaken`, `onKillingBlow` +
  `triggerSpell(familySpell.ID)`), proc-buff talents (`createProcBuffTalentRanks`), `cloned` generic talents only
  when their effects don't depend on a class family (verify in DB).
- Talents that grant/consume Void Shards should interact with the mechanic (e.g. extra shard chance on crit,
  bigger per-shard values via spell mods on VOID_SHARDS? — careful: VOID_SHARDS is a family spell with bit
  VOID_SHARD, so talents can modify it with `{ familyBit: FAMILY_BIT.VOID_SHARD }`).
- Each tree's triggered helper spells live in `talents/<Tree>Procs.ts` using that tree's `*_PROC_n` bits.
- `createTalentTree` asserts tier reachability (5 points per row) — keep it satisfied.

## Gear (VoidKnightGear.ts + livescripts)
Two endgame sets like the other classes (read MarauderGear.ts, MountainKingTitanstormGear.ts, PlagueDoctorGear.ts):
- **Voidforged Battlegear** (DPS) — stat parents: Sanctified Scourgelord Battlegear (DK DPS 277):
  Helmet 51312, Shoulderplates 51314, Battleplate 51310, Gauntlets 51311, Legplates 51313.
- **Voidforged Bulwark** (tank) — Sanctified Scourgelord Plate (DK tank 277): Faceguard 51306, Pauldrons 51309,
  Chestguard 51305, Handguards 51307, Legguards 51308.
- For EACH set: waist, wrists, feet, plus accessories **neck, back, 2 rings, 2 trinkets**, and a two-handed
  weapon; parents = item level 277 (ICC heroic) strength DPS plate / tank plate items found in the `item` table.
  Trinket parents must have natively working spells (check each `spell1` in spellinfo) — or replace their spell
  with a custom on-use/proc you build.
- Looks (`display`): pick void/shadow themed plate and weapons from `item`/`itemdisplay` (e.g. Darkruned (DK T8),
  Scourgeborne (T7), Voidheart, Shadowmourne, Corrupted Ashbringer displays) — every display id must exist.
- Scaling: `scaleItemPower` with ENDGAME_POWER_FACTOR (armor 1), ItemLevel 300, as the other sets.
- Set bonuses: 2- and 4-piece for each set via `createClassItemSet` + `createPassiveSpell`; procs use GEAR_PROC bits.
- Tags: `void-knight-battlegear`, `void-knight-bulwark`; livescript `.voidknightgear [battlegear|bulwark]`
  (copy MountainKing's GearCommand.ts shape; own Commands helper in the voidknight livescripts), plus
  `voidknight/livescripts/livescripts.ts`; command panel buttons in `commandpanel/addon/CommandCatalog.ts`.

## Growing weapons
- Framework change (growingweapons module): growing weapons are **15% stronger** than regular weapons of their
  level (one constant applied to every level's amounts), and gain **milestone passives**: a weapon definition
  may list `milestones: [{ level, spell }]` (spell = a *passive* spell id); while the weapon is equipped and at or
  above that level, the passive aura is on the wielder. Shown in the addon panel; level-up toast announces unlocks.
- **Umbra** (voidknight `UmbraGreatsword.ts`): 2H sword growing weapon (artifact quality, like FuZan.ts):
  WEAPON_DAMAGE, STRENGTH, STAMINA, CRIT_RATING, HASTE_RATING, HIT_RATING; milestones at 25/50/75/100.
- Fu Zan (monk) and Mortis (plaguedoctor) also get 4 milestone passives each.
