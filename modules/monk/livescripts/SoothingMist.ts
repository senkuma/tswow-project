import { gainChi, monkOf } from "./ChiResource";
import { containsSpell, forEachSpell } from "./SpellTags";

/**
 * Soothing Mist (datascripts/abilities/MistAbilities.ts):
 * - Every second of the channel has a chance to generate Chi.
 * - Surging Mist and Enveloping Mist are woven into the channel. TrinityCore
 *   interrupts a channel whenever another spell is cast, so once the heal is
 *   out the channel is resumed on its target for the time it had left.
 */
const SOOTHING_MIST = TAG('monk', 'soothing-mist');
const WEAVES = TAG('monk', 'soothing-mist-weave');
const RESUME = TAG('monk', 'soothing-mist-resume');

const SOOTHING_MIST_CHI_CHANCE = 0.3;
/** Less than one tick of healing left is not worth a new channel. */
const MIN_RESUMED_MS = 1000;

interface InterruptedChannel {
    spellId: number;
    target: TSGUID;
    elapsedMs: number;
    remainingMs: number;
}

/** By monk: the channel their heal will interrupt, from the heal's cast check to its cast. */
const channelsBeingWoven: { [monkGuid: number]: InterruptedChannel | undefined } = {};

export function registerSoothingMist(events: TSEvents) {
    forEachSpell(SOOTHING_MIST, spellId => events.Spell.OnTick(spellId, effect => {
        const monk = monkOf(effect.GetCaster());
        if (monk !== undefined && Math.random() < SOOTHING_MIST_CHI_CHANCE) {
            gainChi(monk, 1);
        }
    }));

    forEachSpell(WEAVES, spellId => {
        events.Spell.OnCheckCast(spellId, (spell, result) => {
            const monk = monkOf(spell.GetCaster());
            if (monk !== undefined) {
                channelsBeingWoven[monk.GetGUIDLow()] = result.get() === SpellCastResult.CAST_OK
                    ? channeledSoothingMist(monk)
                    : undefined;
            }
        });
        events.Spell.OnCast(spellId, spell => {
            const monk = monkOf(spell.GetCaster());
            if (monk === undefined) {
                return;
            }
            const channel = channelsBeingWoven[monk.GetGUIDLow()];
            channelsBeingWoven[monk.GetGUIDLow()] = undefined;
            if (channel !== undefined && channel.remainingMs >= MIN_RESUMED_MS) {
                // The heal is still the monk's current spell until it finishes.
                monk.AddTimer(0, owner => {
                    const player = owner.ToPlayer();
                    if (player !== undefined) {
                        resumeChannel(player, channel);
                    }
                });
            }
        });
    });
}

function channeledSoothingMist(monk: TSPlayer): InterruptedChannel | undefined {
    const channel = monk.GetCurrentSpell(CurrentSpellTypes.CHANNELED);
    if (channel === undefined || !containsSpell(SOOTHING_MIST, channel.GetEntry())) {
        return undefined;
    }
    const targetObject = channel.GetTarget();
    const target = targetObject.IsNull() ? undefined : targetObject.ToUnit();
    const aura = target === undefined ? undefined : target.GetAura(channel.GetEntry(), monk.GetGUID());
    if (target === undefined || aura === undefined) {
        return undefined;
    }
    return {
        spellId: channel.GetEntry(),
        target: target.GetGUID(),
        elapsedMs: aura.GetMaxDuration() - aura.GetDuration(),
        remainingMs: aura.GetDuration(),
    };
}

function resumeChannel(monk: TSPlayer, channel: InterruptedChannel) {
    const target = monk.GetUnit(channel.target);
    // Whatever the monk started since takes precedence.
    if (target === undefined || !target.IsAlive() || monk.IsCasting()) {
        return;
    }
    monk.CastCustomSpell(monk, RESUME[0], true, -channel.elapsedMs);
    monk.CastSpell(target, channel.spellId, true);
    monk.RemoveAura(RESUME[0]);
}
