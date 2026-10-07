# Class development tools

Verification tools used to build custom classes against the real WoW 3.3.5.12340 data rather than memory.
Run `bash tools/class-dev/setup.sh` once (it fills the git-ignored `data/` folder), then:

- `python3 -I tools/class-dev/spellinfo.py 6343 'Death Grip%'`: a spell's real effects (TrinityCore/TSWoW names),
  targets, radius, base points, rank chain and levels, category cooldown, spell_bonus_data, spell_proc, icon, tooltip.
- `tools/class-dev/data/wotlk.sqlite`: the same data for SQL queries (`spell`, `icon`, `itemdisplay`, `item`,
  `creature`, `spell_ranks`, `talenttab`, ...; see build_db.py and import_world.py for the columns).
- `python3 -I tools/class-dev/typecheck.py [datascripts|livescripts|addons|all]`: TypeScript 4.7.3 check of every
  module. TSWoW's std library is not in the repo, so `wow/*` imports are stubbed as `any`: it checks the repo's own
  code and the livescript/addon typings, and that side-effect imports point at real files.
- `tools/class-dev/data/api_usage.txt`: every TSWoW std member the repo already uses, as proof it exists.

Spells whose effects are DUMMY, SCRIPT_EFFECT or (PERIODIC_)DUMMY auras only work through TrinityCore class scripts,
which never run for a clone; spellinfo.py shows them.

On the Windows install with TSWoW running, `setup.sh` is not needed: build the client tables from the dataset's own
DBCs with `py -I tools/class-dev/build_db.py modules/default/datasets/dataset/dbc_source tools/class-dev/data/wotlk.sqlite`,
export the world tables listed in `setup.sh` from TSWoW's MySQL (`bin/mysql/mysql.exe -h127.0.0.1 -P3310 -uroot -proot`,
database `default.dataset.world.source`) into `data/t_*.tsv`, then run `py -I tools/class-dev/import_world.py tools/class-dev/data`.
