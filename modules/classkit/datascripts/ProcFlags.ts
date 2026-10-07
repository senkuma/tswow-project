/**
 * TrinityCore's proc flags. TSWoW's SpellProcFlags enum is wrong from 0x8000
 * up (its DONE_PERIODIC is TrinityCore's "done negative magic spell", as the
 * 0x14000 flags of Maelstrom Weapon show), so classkit sets raw masks built
 * from this table instead.
 */
export const PROC_FLAG = {
    KILL: 0x2,
    DONE_MELEE_AUTO_ATTACK: 0x4,
    TAKEN_MELEE_AUTO_ATTACK: 0x8,
    DONE_MELEE_SPELL: 0x10,
    TAKEN_MELEE_SPELL: 0x20,
    DONE_RANGED_AUTO_ATTACK: 0x40,
    TAKEN_RANGED_AUTO_ATTACK: 0x80,
    DONE_RANGED_SPELL: 0x100,
    TAKEN_RANGED_SPELL: 0x200,
    DONE_NO_CLASS_SPELL_POSITIVE: 0x400,
    TAKEN_NO_CLASS_SPELL_POSITIVE: 0x800,
    DONE_NO_CLASS_SPELL_NEGATIVE: 0x1000,
    TAKEN_NO_CLASS_SPELL_NEGATIVE: 0x2000,
    DONE_MAGIC_SPELL_POSITIVE: 0x4000,
    TAKEN_MAGIC_SPELL_POSITIVE: 0x8000,
    DONE_MAGIC_SPELL_NEGATIVE: 0x10000,
    TAKEN_MAGIC_SPELL_NEGATIVE: 0x20000,
    DONE_PERIODIC: 0x40000,
    TAKEN_PERIODIC: 0x80000,
    TAKEN_DAMAGE: 0x100000,
} as const;

export type ProcFlagName = keyof typeof PROC_FLAG;

/** The raw proc mask for `names`. */
export function procMask(names: ProcFlagName[]) {
    return names.reduce((mask, name) => (mask | PROC_FLAG[name]) >>> 0, 0);
}
