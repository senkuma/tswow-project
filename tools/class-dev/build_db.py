"""Builds wotlk.sqlite from 3.3.5.12340 DBC files."""
import sqlite3, struct, sys, os
D = sys.argv[1]; OUT = sys.argv[2]

def load(name):
    raw = open(os.path.join(D, name), 'rb').read()
    assert raw[:4] == b'WDBC', name
    n, f, rs, ss = struct.unpack_from('<4I', raw, 4)
    recs = raw[20:20 + n * rs]; strings = raw[20 + n * rs:]
    def s(off):
        end = strings.index(b'\0', off); return strings[off:end].decode('utf8', 'replace')
    rows = []
    for i in range(n):
        u = struct.unpack_from(f'<{f}I', recs, i * rs)
        fl = struct.unpack_from(f'<{f}f', recs, i * rs)
        i32 = struct.unpack_from(f'<{f}i', recs, i * rs)
        rows.append((u, fl, i32, s))
    return rows

db = sqlite3.connect(OUT); c = db.cursor()
c.execute('''create table spell(id integer primary key, name text, rank text, description text, tooltip text,
 category int, dispel int, mechanic int, attr int, attrEx int, attrEx2 int, attrEx3 int, attrEx4 int, attrEx5 int, attrEx6 int, attrEx7 int,
 targets int, casterAuraState int, targetAuraState int, castTimeIndex int, recoveryTime int, categoryRecoveryTime int,
 interruptFlags int, auraInterruptFlags int, channelInterruptFlags int, procFlags int, procChance int, procCharges int,
 maxLevel int, baseLevel int, spellLevel int, durationIndex int, powerType int, manaCost int, manaPerSecond int, rangeIndex int, speed real,
 stackAmount int, equippedItemClass int, equippedItemSubClassMask int, equippedItemInvTypeMask int,
 eff0 int, eff1 int, eff2 int, die0 int, die1 int, die2 int, ppl0 real, ppl1 real, ppl2 real, bp0 int, bp1 int, bp2 int,
 mech0 int, mech1 int, mech2 int, tA0 int, tA1 int, tA2 int, tB0 int, tB1 int, tB2 int, radius0 int, radius1 int, radius2 int,
 aura0 int, aura1 int, aura2 int, amp0 int, amp1 int, amp2 int, multVal0 real, multVal1 real, multVal2 real,
 chain0 int, chain1 int, chain2 int, misc0 int, misc1 int, misc2 int, miscB0 int, miscB1 int, miscB2 int,
 trigger0 int, trigger1 int, trigger2 int, visual0 int, visual1 int, iconId int, manaCostPct int, startRecoveryCategory int, startRecoveryTime int,
 family int, familyFlags0 int, familyFlags1 int, familyFlags2 int, maxTargets int, dmgClass int, preventionType int,
 schoolMask int, runeCostId int, missileId int)''')
for u, fl, i32, s in load('Spell.dbc'):
    c.execute('insert into spell values(' + ','.join('?' * 102) + ')', (
        u[0], s(u[136]), s(u[153]), s(u[170]), s(u[187]),
        u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9], u[10], u[11],
        u[16], u[20], u[21], u[28], u[29], u[30], u[31], u[32], u[33], u[34], u[35], u[36],
        u[37], u[38], u[39], u[40], i32[41], u[42], u[44], u[46], fl[47],
        u[49], i32[68], i32[69], i32[70],
        u[71], u[72], u[73], i32[74], i32[75], i32[76], fl[77], fl[78], fl[79], i32[80], i32[81], i32[82],
        u[83], u[84], u[85], u[86], u[87], u[88], u[89], u[90], u[91], u[92], u[93], u[94],
        u[95], u[96], u[97], i32[98], i32[99], i32[100], fl[101], fl[102], fl[103],
        u[104], u[105], u[106], i32[110], i32[111], i32[112], i32[113], i32[114], i32[115],
        u[116], u[117], u[118], u[131], u[132], u[133], u[204], u[205], u[206],
        u[208], u[209], u[210], u[211], u[212], u[213], u[214], u[225], u[226], u[227]))
c.execute('create table icon(id integer primary key, path text)')
c.executemany('insert into icon values(?,?)', [(u[0], s(u[1]).split('\\')[-1]) for u, fl, i32, s in load('SpellIcon.dbc')])
c.execute('create table duration(id integer primary key, ms int, perLevel int, maxMs int)')
c.executemany('insert into duration values(?,?,?,?)', [(u[0], i32[1], i32[2], i32[3]) for u, fl, i32, s in load('SpellDuration.dbc')])
c.execute('create table range(id integer primary key, minHostile real, minFriend real, maxHostile real, maxFriend real, flags int, name text)')
c.executemany('insert into range values(?,?,?,?,?,?,?)', [(u[0], fl[1], fl[2], fl[3], fl[4], u[5], s(u[6])) for u, fl, i32, s in load('SpellRange.dbc')])
c.execute('create table radius(id integer primary key, yards real, perLevel real, maxYards real)')
c.executemany('insert into radius values(?,?,?,?)', [(u[0], fl[1], fl[2], fl[3]) for u, fl, i32, s in load('SpellRadius.dbc')])
c.execute('create table casttime(id integer primary key, ms int, perLevel int, minMs int)')
c.executemany('insert into casttime values(?,?,?,?)', [(u[0], i32[1], i32[2], i32[3]) for u, fl, i32, s in load('SpellCastTimes.dbc')])
c.execute('create table itemdisplay(id integer primary key, model0 text, model1 text, tex0 text, tex1 text, icon text)')
c.executemany('insert into itemdisplay values(?,?,?,?,?,?)', [(u[0], s(u[1]), s(u[2]), s(u[3]), s(u[4]), s(u[5])) for u, fl, i32, s in load('ItemDisplayInfo.dbc')])
c.execute('create table skillline(id integer primary key, category int, name text)')
c.executemany('insert into skillline values(?,?,?)', [(u[0], i32[1], s(u[3])) for u, fl, i32, s in load('SkillLine.dbc')])
c.execute('create table skilllineability(id integer primary key, skill int, spell int, raceMask int, classMask int, minSkill int, supercededBy int, acquireMethod int)')
c.executemany('insert into skilllineability values(?,?,?,?,?,?,?,?)', [(u[0], u[1], u[2], u[3], u[4], u[7], u[8], u[9]) for u, fl, i32, s in load('SkillLineAbility.dbc')])
c.execute('create table talenttab(id integer primary key, name text, classMask int, tabPage int, background text)')
c.executemany('insert into talenttab values(?,?,?,?,?)', [(u[0], s(u[1]), u[20], u[22], s(u[23])) for u, fl, i32, s in load('TalentTab.dbc')])
c.execute('create table talent(id integer primary key, tab int, row int, col int, rank1 int, rank2 int, rank3 int, rank4 int, rank5 int)')
c.executemany('insert into talent values(?,?,?,?,?,?,?,?,?)', [(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8]) for u, fl, i32, s in load('Talent.dbc')])
c.execute('create table enchant(id integer primary key, type0 int, type1 int, type2 int, amount0 int, amount1 int, amount2 int, arg0 int, arg1 int, arg2 int, name text)')
c.executemany('insert into enchant values(?,?,?,?,?,?,?,?,?,?,?)', [(u[0], u[2], u[3], u[4], i32[5], i32[6], i32[7], u[11], u[12], u[13], s(u[14])) for u, fl, i32, s in load('SpellItemEnchantment.dbc')])
c.execute('create index spell_name on spell(name)')
db.commit()
print(c.execute('select count(*) from spell').fetchone(), c.execute("select id,name,rank,eff0,aura0,bp0,tA0,iconId from spell where id in (6343,5176,17)").fetchall())
print(c.execute("select s.id,s.name,i.path from spell s join icon i on i.id=s.iconId where s.id in (6343,5176)").fetchall())
print(c.execute("select * from enchant where type0=5 and arg0=45 limit 3").fetchall())
