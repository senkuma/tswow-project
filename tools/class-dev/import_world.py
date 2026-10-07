import sqlite3, sys, csv
S = sys.argv[1]
db = sqlite3.connect(f'{S}/wotlk.sqlite')  # S = tools/class-dev/data
c = db.cursor()
tables = {
 'spell_ranks': ('t_ranks.tsv', 'first_spell_id int, spell_id int, rank int'),
 'spell_bonus_data': ('t_bonus.tsv', 'entry int, direct_bonus real, dot_bonus real, ap_bonus real, ap_dot_bonus real'),
 'spell_proc': ('t_proc.tsv', 'SpellId int, SchoolMask int, SpellFamilyName int, SpellFamilyMask0 int, SpellFamilyMask1 int, SpellFamilyMask2 int, ProcFlags int, SpellTypeMask int, SpellPhaseMask int, HitMask int, AttributesMask int, ProcsPerMinute real, Chance real, Cooldown int, Charges int'),
 'spell_group': ('t_group.tsv', 'id int, spell_id int'),
 'item': ('t_items.tsv', 'entry int, name text, class int, subclass int, inventoryType int, itemLevel int, requiredLevel int, quality int, displayid int, allowableClass int, itemset int, st1 int, sv1 int, st2 int, sv2 int, st3 int, sv3 int, st4 int, sv4 int, st5 int, sv5 int, st6 int, sv6 int, armor int, dmgMin real, dmgMax real, delay int, spell1 int, trigger1 int, spell2 int, trigger2 int, socket1 int, socket2 int, socket3 int, socketBonus int, requiredSkill int'),
 'creature': ('t_creatures.tsv', 'entry int, name text, subname text, npcflag int, model1 int, model2 int, faction int, minlevel int, maxlevel int, unit_class int, unused int'),
 'creature_default_trainer': ('t_cdt.tsv', 'CreatureId int, TrainerId int'),
 'trainer': ('t_trainer.tsv', 'Id int, Type int, Requirement int'),
}
for t, (f, cols) in tables.items():
    c.execute(f'drop table if exists {t}'); c.execute(f'create table {t}({cols})')
    n = len(cols.split(','))
    rows = [r[:n] + [None] * (n - len(r)) for r in csv.reader(open(f'{S}/{f}', encoding='utf8', errors='replace'), delimiter='\t', quoting=csv.QUOTE_NONE)]
    c.executemany(f'insert into {t} values({",".join("?" * n)})', rows)
c.execute('create index if not exists ranks_first on spell_ranks(first_spell_id)')
c.execute('create index if not exists item_name on item(name)')
db.commit(); print('ok')
