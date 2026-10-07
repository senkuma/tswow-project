"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createLevelEnchantment = createLevelEnchantment;
var _wotlk = require("wow/wotlk");
/**
 * Name of every level enchantment. The client prints it in the weapon's
 * tooltip, and the addon removes that line by this name (the addon's
 * model/TooltipLines.ts holds the same string).
 */ const LEVEL_ENCHANTMENT_NAME = 'Awakened Power (Level %d)';
// An enchantment has three effects; a spell it casts while equipped holds three more.
const ENCHANTMENT_EFFECTS = 3;
const SPELL_EFFECTS = 3;
// Cruelty (rank 1), a passive self aura; the equip spells keep its passive setup and replace its effects.
const PASSIVE_SPELL_TEMPLATE = 12320;
// The enchantment stat effect's names for the ratings (ItemModType values).
const ENCHANTMENT_RATING_STATS = {
    CRIT_RATING: 'CRIT_RATING',
    HASTE_RATING: 'HASTE',
    HIT_RATING: 'HIT_RATING'
};
// SPELL_AURA_MOD_RATING takes a mask of CombatRating bits (TSWoW's helper writes an index instead).
// Rating from items counts for melee, ranged and spells alike.
const RATING_MASKS = {
    HIT_RATING: 1 << 5 | 1 << 6 | 1 << 7,
    CRIT_RATING: 1 << 8 | 1 << 9 | 1 << 10,
    HASTE_RATING: 1 << 17 | 1 << 18 | 1 << 19
};
function createLevelEnchantment(mod, id, level, bonuses, amounts) {
    const name = LEVEL_ENCHANTMENT_NAME.replace('%d', `${level}`);
    const enchantment = _wotlk.std.Enchantments.create(mod, id).Name.enGB.set(name);
    let effectIndex = 0;
    const stats = [];
    bonuses.forEach((bonus, index)=>{
        if (bonus === 'WEAPON_DAMAGE') {
            enchantment.Effects.get(effectIndex++).Type.DAMAGE.set().MinDamage.set(amounts[index]).MaxDamage.set(amounts[index]);
        } else {
            stats.push({
                stat: bonus,
                amount: amounts[index]
            });
        }
    });
    const { direct , spellGroups  } = packStats(stats, ENCHANTMENT_EFFECTS - effectIndex);
    direct.forEach(({ stat , amount  })=>{
        enchantment.Effects.get(effectIndex++).Type.STAT.set().Stat.set(enchantmentStat(stat)).MinStat.set(amount).MaxStat.set(amount);
    });
    spellGroups.forEach((group, groupIndex)=>{
        const spell = createEquipSpell(mod, `${id}-aura-${groupIndex + 1}`, name, group);
        const effect = enchantment.Effects.get(effectIndex++);
        // The equipped buff's spell is the effect's argument.
        effect.Type.BUFF_EQUIPPED.set();
        effect.Arg.set(spell.ID);
    });
    return enchantment.ID;
}
/** Splits stats between direct enchantment effects and three-aura spells, using as few spells as fit. */ function packStats(stats, freeEffects) {
    // Each spell takes one effect and holds three stats: two more than a direct effect.
    const spells = Math.max(0, Math.ceil((stats.length - freeEffects) / (SPELL_EFFECTS - 1)));
    const directCount = freeEffects - spells;
    if (directCount < 0) {
        throw new Error(`A growing weapon can grow at most ${freeEffects * SPELL_EFFECTS} stats beside its damage.`);
    }
    const spellGroups = [];
    for(let start = directCount; start < stats.length; start += SPELL_EFFECTS){
        spellGroups.push(stats.slice(start, start + SPELL_EFFECTS));
    }
    return {
        direct: stats.slice(0, directCount),
        spellGroups
    };
}
function createEquipSpell(mod, id, name, stats) {
    const spell = _wotlk.std.Spells.create(mod, id, PASSIVE_SPELL_TEMPLATE).Name.enGB.set(name).Description.enGB.set('').Family.set(0).ClassMask.set(0, 0, 0).Effects.clearAll();
    // Cruelty requires a melee weapon; these auras come from the weapon itself.
    spell.row.EquippedItemClass.set(-1).EquippedItemSubclass.set(0);
    stats.forEach(({ stat , amount  }, index)=>{
        const effect = spell.Effects.get(index).Type.APPLY_AURA.set().ImplicitTargetA.set('UNIT_CASTER');
        if (isRating(stat)) {
            effect.Aura.MOD_RATING.set();
            effect.MiscValueA.set(RATING_MASKS[stat]);
        } else {
            effect.Aura.MOD_STAT.set().Stat.set(stat);
        }
        effect.PointsBase.set(amount);
    });
    return spell;
}
function isRating(stat) {
    return stat in RATING_MASKS;
}
function enchantmentStat(stat) {
    return isRating(stat) ? ENCHANTMENT_RATING_STATS[stat] : stat;
}

//# sourceMappingURL=LevelEnchantment.js.map