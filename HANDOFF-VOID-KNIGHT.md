# Handoff: finish the Void Knight

Paste the prompt below into a new Claude Code session on this repository (branch `claude/loving-maxwell-h638mm`).

---

Finish the Void Knight class in `modules/voidknight` of this TSWoW project. The work was started in a previous session
and stopped part-way; this file and `tools/class-dev/void-knight-spec.md` describe everything.

**Setup first:** run `bash tools/class-dev/setup.sh` (about 5–10 min). It builds the real WoW 3.3.5 client data
(Spell.dbc etc.) and this repo's world tables into `tools/class-dev/data/wotlk.sqlite`, installs TypeScript 4.7.3 for
`tools/class-dev/typecheck.py`, and writes `tools/class-dev/data/api_usage.txt`. Read `tools/class-dev/README.md` and
`tools/class-dev/void-knight-spec.md` (the design contract and the hard rules) before writing code. Verify every
parent spell, item and display id with `tools/class-dev/spellinfo.py` / the SQLite DB — never from memory. Spells whose
effects are DUMMY / SCRIPT_EFFECT / (PERIODIC_)DUMMY auras do nothing on clones.

**Done and committed (not yet reviewed against the data):**
- Core: `Constants.ts`, `VoidKnightClass.ts`, `VoidKnightSkills.ts`, `abilities/FamilyBits.ts` (every bit allocated),
  `abilities/VoidShards.ts`, `abilities/Aspects.ts`, `abilities/AllAbilities.ts`, `VoidKnightTrainer.ts`,
  `VoidKnightStartingKit.ts`, `images/void-knight-icon.png`; Details icon + talent UI art registration.
- `abilities/RiftAbilities.ts`; `talents/GravityTree.ts`, `RiftTree.ts`, `BulwarkTree.ts` and their `*Procs.ts`;
  `VoidKnightGear.ts` (two sets with accessories); `livescripts/` (`.voidknightgear [battlegear|bulwark]`);
  command panel buttons.
- growingweapons: 15% edge over regular weapons (`GROWING_WEAPON_EDGE`), milestone passives
  (`milestones: [{ level, spell }]` on `makeGrowingWeapon`; livescripts keep unlocked passives on the wielder while
  equipped; STATE/LEVELUP addon messages and the panel/toast show them).
- Plague Doctor audit changes (Miasma now deals real periodic damage; category cooldowns set explicitly; other
  tooltip/talent fixes). `.DamagePeriod` on Miasma's effect is not in api_usage.txt — confirm or replace it.

**Still to do, in this order:**
1. Write `modules/voidknight/datascripts/abilities/GravityAbilities.ts` and `abilities/BulwarkAbilities.ts` exactly per
   the spec's contract tables (export names, family bits, levels, `GRAVITY_ABILITIES` / `BULWARK_ABILITIES` arrays;
   helper spells only on `*_PROC_7`/`*_PROC_8`). The talent trees, gear, starting kit and AllAbilities already import
   these names — keep them.
2. Write `modules/voidknight/datascripts/UmbraGreatsword.ts`: the growing two-handed sword with 4 milestone passives
   (25/50/75/100) per the spec; read `modules/growingweapons/datascripts/*.ts` for the final API. Then add 4 milestone
   passives each to Fu Zan (`modules/monk/datascripts/FuZan.ts`) and Mortis (`modules/plaguedoctor/datascripts/MortisCane.ts`),
   appending new family bits to the end of each class's FAMILY_BIT.
3. Review everything listed under "Done" against the real data (parents, effect indices vs tooltip `$s1/$o1/$t1/$a1/$d`,
   category cooldowns, icons/visuals/displays exist, family bits used once, talent tier reachability, Void Shards
   finisher bits) and fix what's wrong. Prefer small focused passes; parallel review agents are fine if credits allow.
4. `python3 -I tools/class-dev/typecheck.py all` must be clean (pre-existing stub artifacts in battlemage and classkit
   ClassTrainer TS2347 are filtered already).
5. Re-enable the module: the committed `modules/voidknight/datascripts/datascripts.ts` is a placeholder (`export {}`) so
   the other modules keep building. Replace it with these imports, in this order:
   `./VoidKnightClass`, `./VoidKnightSkills`, `./abilities/VoidShards`, `./abilities/Aspects`,
   `./abilities/GravityAbilities`, `./abilities/RiftAbilities`, `./abilities/BulwarkAbilities`, `./talents/GravityTree`,
   `./talents/RiftTree`, `./talents/BulwarkTree`, `./VoidKnightStartingKit`, `./VoidKnightTrainer`, `./VoidKnightGear`,
   `./UmbraGreatsword` (each as `import "./X";`).
6. Commit with a clear message, push, delete this handoff file in the same commit, and tell the user to rebuild
   datascripts/livescripts/addons and to rerun `py modules/detailscompat/tools/build_details_icons.py` against their client
   for the new Details icons.

Do not commit a state where `datascripts.ts` imports files that don't exist: TSWoW builds every module, so one broken
module stops the whole datascript build.
