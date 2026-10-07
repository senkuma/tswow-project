import { std } from "wow/wotlk";
import { ItemTemplate } from "wow/wotlk/std/Item/ItemTemplate";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext } from "./ClassContext";

export interface ClassItemDefinition {
    id: string;
    /** Existing item whose slot, armor, damage and stats are kept. */
    parent: number;
    name: string;
    /** ItemDisplayInfo entry to use instead of the parent's look. */
    display?: number;
    /** Flavor text shown in yellow at the bottom of the tooltip. */
    description?: string;
}

/** A bind-on-pickup item only the class can use, outside any item set until one claims it. */
export function createClassItem(context: ClassContext, definition: ClassItemDefinition): ItemTemplate {
    const item = std.Items.create(context.module, definition.id, definition.parent)
        .Name.enGB.set(definition.name)
        .ClassMask.set(context.cls.Mask)
        .Bonding.BINDS_ON_PICKUP.set()
        // Tier parents still point at their original set.
        .ItemSet.set(0);
    if (definition.display !== undefined) {
        // Written to both item_template and the client's Item.dbc.
        item.DisplayInfo.set(definition.display);
    }
    if (definition.description !== undefined) {
        item.Description.enGB.set(definition.description);
    }
    return item;
}

/** Multipliers for each part of an item's power; 1 leaves that part unchanged. */
export interface ItemPowerScaling {
    stats: number;
    weaponDamage: number;
    /** Armor's damage reduction is a hardcoded formula, so scaling it shifts mitigation toward the cap. */
    armor: number;
    blockValue: number;
}

/** Scales an item's stats, weapon damage, armor and block value; speed, sockets and requirements are kept. */
export function scaleItemPower(item: ItemTemplate, scaling: ItemPowerScaling) {
    const scaled = (value: number, factor: number) => Math.round(value * factor);
    for (let i = 0; i < item.Stats.length; ++i) {
        const stat = item.Stats.get(i);
        if (!stat.isClear()) {
            stat.Value.set(scaled(stat.Value.get(), scaling.stats));
        }
    }
    for (let i = 0; i < item.Damage.length; ++i) {
        const damage = item.Damage.get(i);
        if (!damage.isClear()) {
            damage.Min.set(scaled(damage.Min.get(), scaling.weaponDamage));
            damage.Max.set(scaled(damage.Max.get(), scaling.weaponDamage));
        }
    }
    item.Armor.set(scaled(item.Armor.get(), scaling.armor))
        .BonusArmor.set(scaled(item.BonusArmor.get(), scaling.armor))
        .Block.set(scaled(item.Block.get(), scaling.blockValue));
    return item;
}

export interface ItemSetBonus {
    pieces: number;
    spell: Spell;
}

export interface ClassItemSetDefinition {
    id: string;
    name: string;
    items: ItemTemplate[];
    bonuses: ItemSetBonus[];
}

export function createClassItemSet(context: ClassContext, definition: ClassItemSetDefinition) {
    const itemSet = std.ItemSet.create(context.module, definition.id)
        .Name.enGB.set(definition.name);
    // Also points each item's own itemset field at this set.
    definition.items.forEach(item => itemSet.Items.addId(item.ID));
    definition.bonuses.forEach(bonus => itemSet.Spells.add(bonus.spell.ID, bonus.pieces));
    return itemSet;
}
