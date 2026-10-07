import { monkOf, sameUnit } from "./ChiResource";
import { forEachSpell } from "./SpellTags";

/**
 * Uplift (datascripts/abilities/MistAbilities.ts) heals the monk and every
 * group member within range who has the monk's Renewing Mist, and cannot be
 * cast while nobody has it.
 */
const UPLIFT = TAG('monk', 'uplift');
const UPLIFT_HEAL = TAG('monk', 'uplift-heal');
const RENEWING_MIST = TAG('monk', 'renewing-mist');

const UPLIFT_RANGE = 40;

export function registerMistHealing(events: TSEvents) {
    forEachSpell(UPLIFT, spellId => {
        events.Spell.OnCheckCast(spellId, (spell, result) => {
            const monk = monkOf(spell.GetCaster());
            if (monk !== undefined && result.get() === SpellCastResult.CAST_OK && upliftTargets(monk).length === 0) {
                result.set(SpellCastResult.FAILED_BAD_TARGETS);
            }
        });
        events.Spell.OnCast(spellId, spell => {
            const monk = monkOf(spell.GetCaster());
            if (monk !== undefined) {
                upliftTargets(monk).forEach(target => monk.CastSpell(target, UPLIFT_HEAL[0], true));
            }
        });
    });
}

/** The monk and their group members in range who carry the monk's Renewing Mist. */
function upliftTargets(monk: TSPlayer): TSPlayer[] {
    const candidates: TSPlayer[] = [monk];
    const group = monk.GetGroup();
    if (group !== undefined) {
        const members = group.GetMembers();
        for (let index = 0; index < members.length; index++) {
            if (!sameUnit(members[index], monk)) {
                candidates.push(members[index]);
            }
        }
    }
    return candidates.filter(member => member.IsAlive()
        && monk.IsWithinDistInMap(member, UPLIFT_RANGE, true)
        && hasRenewingMistFrom(member, monk));
}

function hasRenewingMistFrom(unit: TSUnit, monk: TSPlayer) {
    for (let index = 0; index < RENEWING_MIST.length; index++) {
        if (unit.HasAura(RENEWING_MIST[index], monk.GetGUID())) {
            return true;
        }
    }
    return false;
}
