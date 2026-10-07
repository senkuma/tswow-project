import { GROWING_WEAPONS } from "./GrowingWeaponData";
import { forEachEquippedWeapon, growingWeaponOf, WEAPON_SLOTS } from "./OwnedWeapons";
import { progressOf } from "./ProgressStore";

/**
 * Milestone passives are auras put on the wielder of a growing weapon that
 * has reached their level, for as long as it stays equipped. Passive auras
 * are not saved with the character and survive death, so they only change on
 * login, when a weapon levels and when equipment changes.
 */

// Every milestone spell, so that ones no equipped weapon grants any more come off.
const MILESTONE_SPELLS: number[] = [];
GROWING_WEAPONS.forEach(weapon => weapon.milestones.forEach(({ spell }) => {
    if (MILESTONE_SPELLS.indexOf(spell) < 0) {
        MILESTONE_SPELLS.push(spell);
    }
}));

export function registerWeaponMilestones(events: TSEvents) {
    // Any weapon equipped can be replacing a growing one.
    events.Item.OnEquip((_, player, slot) => {
        if (WEAPON_SLOTS.indexOf(slot) >= 0) {
            refreshMilestonesSoon(player);
        }
    });
    events.Item.OnUnequip((item, player) => {
        if (growingWeaponOf(item) !== undefined) {
            refreshMilestonesSoon(player);
        }
    });
}

/** Adds the milestone passives the player's equipped growing weapons have unlocked, and removes all others. */
export function refreshMilestones(player: TSPlayer) {
    const earned: number[] = [];
    forEachEquippedWeapon(player, (item, weapon) => {
        const level = progressOf(item).level;
        weapon.milestones
            .filter(milestone => milestone.level <= level)
            .forEach(({ spell }) => earned.push(spell));
    });
    MILESTONE_SPELLS.forEach(spell => {
        const isEarned = earned.indexOf(spell) >= 0;
        const hasAura = player.HasAura(spell);
        if (isEarned && !hasAura) {
            player.AddAura(spell, player);
        } else if (!isEarned && hasAura) {
            player.RemoveAura(spell);
        }
    });
}

/**
 * The equipment events fire while the item is still moving (OnUnequip even
 * before the move is allowed), so the refresh waits for the next update, when
 * the equipment is final.
 */
function refreshMilestonesSoon(player: TSPlayer) {
    player.AddTimer(0, owner => {
        const wielder = owner.ToPlayer();
        if (wielder !== undefined) {
            refreshMilestones(wielder);
        }
    });
}
