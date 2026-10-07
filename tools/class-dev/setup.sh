#!/usr/bin/env bash
# Builds the class development tools' data in tools/class-dev/data (git-ignored):
#   - data/wotlk.sqlite: the real 3.3.5.12340 client tables (Spell, SpellIcon, ItemDisplayInfo, ...)
#     plus this repo's world tables (spell_ranks, spell_bonus_data, spell_proc, item_template, creatures)
#   - data/node_modules: TypeScript 4.7.3 (TSWoW's version) and the TSTL/Lua typings for typecheck.py
#   - data/api_usage.txt: every TSWoW std member this repo already uses
# Needs network access to registry.npmjs.org, github.com and the Ubuntu archive (for MariaDB).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; DATA="$HERE/data"; REPO="$(cd "$HERE/../.." && pwd)"
mkdir -p "$DATA"; cd "$DATA"

if [ ! -x node_modules/.bin/tsc ]; then
    npm init -y >/dev/null && npm install --silent typescript@4.7.3 typescript-to-lua@1.6.2 lua-types@2.11.0
fi

if [ ! -f dbc/Spell.dbc ]; then
    # AzerothCore's client-data release; only the needed entries are range-downloaded from the zip.
    python3 -I "$HERE/zipfetch.py" "https://github.com/wowgaming/client-data/releases/download/v16/data.zip" dbc \
        Spell.dbc SpellIcon.dbc SpellDuration.dbc SpellRange.dbc SpellRadius.dbc SpellCastTimes.dbc ItemDisplayInfo.dbc \
        SkillLine.dbc SkillLineAbility.dbc SpellVisual.dbc Talent.dbc TalentTab.dbc ChrClasses.dbc SpellItemEnchantment.dbc
fi
rm -f wotlk.sqlite && python3 -I "$HERE/build_db.py" dbc wotlk.sqlite

# The world database ships as MySQL files in coredata; a throwaway MariaDB reads its MyISAM tables.
command -v mariadbd >/dev/null || (apt-get update -q && apt-get install -y -q mariadb-server) >/dev/null
SRC="$REPO/coredata/database/default@002edataset@002eworld@002edest"
rm -rf mysql && mariadb-install-db --datadir="$DATA/mysql" --user=root >/dev/null 2>&1
mkdir -p mysql/world && for f in "$SRC"/*.MYD; do b=$(basename "$f" .MYD); cp "$SRC/$b.frm" "$SRC/$b.MYD" "$SRC/$b.MYI" mysql/world/; done
cd mysql   # the socket path must stay short
(mariadbd --no-defaults --datadir="$DATA/mysql" --user=root --socket=./sock --pid-file=./pid --skip-networking --skip-grant-tables >log 2>&1 &)
for i in $(seq 1 30); do [ -S ./sock ] && break; sleep 1; done; sleep 2
Q="mariadb --no-defaults --socket=./sock world -B -N -e"
$Q "select first_spell_id,spell_id,rank from spell_ranks" > ../t_ranks.tsv
$Q "select entry,direct_bonus,dot_bonus,ap_bonus,ap_dot_bonus from spell_bonus_data" > ../t_bonus.tsv
$Q "select SpellId,SchoolMask,SpellFamilyName,SpellFamilyMask0,SpellFamilyMask1,SpellFamilyMask2,ProcFlags,SpellTypeMask,SpellPhaseMask,HitMask,AttributesMask,ProcsPerMinute,Chance,Cooldown,Charges from spell_proc" > ../t_proc.tsv
$Q "select id,spell_id from spell_group" > ../t_group.tsv
$Q "select entry,replace(name,'\t',' '),class,subclass,InventoryType,ItemLevel,RequiredLevel,Quality,displayid,AllowableClass,itemset,stat_type1,stat_value1,stat_type2,stat_value2,stat_type3,stat_value3,stat_type4,stat_value4,stat_type5,stat_value5,stat_type6,stat_value6,armor,dmg_min1,dmg_max1,delay,spellid_1,spelltrigger_1,spellid_2,spelltrigger_2,socketColor_1,socketColor_2,socketColor_3,socketBonus,RequiredSkill from item_template" > ../t_items.tsv
$Q "select entry,replace(name,'\t',' '),replace(subname,'\t',' '),npcflag,modelid1,modelid2,faction,minlevel,maxlevel,unit_class,0 from creature_template" > ../t_creatures.tsv
$Q "select CreatureId,TrainerId from creature_default_trainer" > ../t_cdt.tsv
$Q "select Id,Type,Requirement from trainer" > ../t_trainer.tsv
kill "$(cat pid)" || true
cd "$DATA" && python3 -I "$HERE/import_world.py" "$DATA"

python3 - "$REPO" "$DATA/api_usage.txt" <<'PY'
import re, glob, sys, collections
repo, out_path = sys.argv[1], sys.argv[2]
ex = collections.OrderedDict()
for f in sorted(glob.glob(f'{repo}/modules/*/datascripts/**/*.ts', recursive=True)):
    if '/build/' in f or f.endswith('.d.ts'): continue
    for i, line in enumerate(open(f), 1):
        for m in re.finditer(r'\.([A-Z][A-Za-z0-9_]*)', line):
            ex.setdefault(m.group(1), []).append(f"{f.split('/modules/')[1]}:{i}: {line.strip()[:150]}")
out = ['# TSWoW std API members used by this repo\'s datascripts (proven to exist).', '']
for k in sorted(ex):
    out.append(f'## .{k}  ({len(ex[k])} uses)'); out += ['   ' + e for e in ex[k][:3]]
open(out_path, 'w').write('\n'.join(out))
PY
echo "Ready: python3 -I tools/class-dev/spellinfo.py <id|'Name%'>  |  python3 -I tools/class-dev/typecheck.py all"
