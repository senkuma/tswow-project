import { gainChi, isEnemy, monkOf, moveChi, spendChi } from "./ChiResource";
import { containsSpell, forEachSpell } from "./SpellTags";

/**
 * Mists of Pandaria Chi costs and gains, which WotLK spells cannot express:
 * spenders cost a fixed amount of Chi (they no longer require or consume
 * combo points), heals generate Chi though they hit no enemy to put combo
 * points on, and builders bring the Chi onto their target first, as combo
 * points added to another unit would replace it. Spell ids come from the
 * tags datascripts/abilities/Chi.ts writes; keep the tag names in step with it.
 */
const CHI_COSTS: { spells: TSArray<uint32>, chi: number }[] = [
    { spells: TAG('monk', 'chi-cost-1'), chi: 1 },
    { spells: TAG('monk', 'chi-cost-2'), chi: 2 },
    { spells: TAG('monk', 'chi-cost-3'), chi: 3 },
];
const BUILDERS = TAG('monk', 'chi-builder');
const GENERATES_ONE_CHI = TAG('monk', 'chi-gain-1');
const TIGER_STANCE_BONUS = TAG('monk', 'chi-gain-tiger-stance');
const STANCE_OF_THE_FIERCE_TIGER = TAG('monk', 'stance-of-the-fierce-tiger');
const BLACKOUT_KICK = TAG('monk', 'blackout-kick');
const COMBO_BREAKER = TAG('monk', 'combo-breaker');
const TOUCH_OF_DEATH = TAG('monk', 'touch-of-death');

// Touch of Death kills creatures with less health than the monk's maximum, and players at 10% or less.
const TOUCH_OF_DEATH_PLAYER_HEALTH_PCT = 10;

export function registerChiAbilities(events: TSEvents) {
    CHI_COSTS.forEach(({ spells, chi }) => forEachSpell(spells, spellId => {
        events.Spell.OnCheckCast(spellId, (spell, result) => {
            const monk = monkOf(spell.GetCaster());
            if (monk === undefined || result.get() !== SpellCastResult.CAST_OK) {
                return;
            }
            if (!isFree(monk, spellId) && monk.GetComboPoints() < chi) {
                result.set(SpellCastResult.FAILED_NO_COMBO_POINTS);
            } else if (containsSpell(TOUCH_OF_DEATH, spellId) && !touchOfDeathCanKill(monk, spell.GetTarget())) {
                result.set(SpellCastResult.FAILED_BAD_TARGETS);
            }
        });
        events.Spell.OnCast(spellId, spell => {
            const monk = monkOf(spell.GetCaster());
            if (monk === undefined) {
                return;
            }
            if (isFree(monk, spellId)) {
                monk.RemoveAura(COMBO_BREAKER[0]);
            } else {
                spendChi(monk, chi);
            }
        });
    }));

    // OnCast runs before the builder's effects add its combo points.
    forEachSpell(BUILDERS, spellId => events.Spell.OnCast(spellId, spell => {
        const monk = monkOf(spell.GetCaster());
        const target = spell.GetTarget().ToUnit();
        if (monk !== undefined && target !== undefined && isEnemy(monk, target)) {
            moveChi(monk, target);
        }
    }));

    forEachSpell(GENERATES_ONE_CHI, spellId => events.Spell.OnCast(spellId, spell => {
        const monk = monkOf(spell.GetCaster());
        if (monk === undefined) {
            return;
        }
        const stanceBonus = containsSpell(TIGER_STANCE_BONUS, spellId) && monk.HasAura(STANCE_OF_THE_FIERCE_TIGER[0]);
        gainChi(monk, stanceBonus ? 2 : 1);
    }));
}

/** Combo Breaker makes the next Blackout Kick free. */
function isFree(monk: TSPlayer, spellId: number) {
    return containsSpell(BLACKOUT_KICK, spellId) && monk.HasAura(COMBO_BREAKER[0]);
}

function touchOfDeathCanKill(monk: TSPlayer, targetObject: TSObject) {
    const target = targetObject.ToUnit();
    if (target === undefined) {
        return false;
    }
    return target.IsPlayer()
        ? target.GetHealthPct() <= TOUCH_OF_DEATH_PLAYER_HEALTH_PCT
        : target.GetHealth() <= monk.GetMaxHealth();
}
