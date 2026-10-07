import { std } from "wow/wotlk";
import { Spell } from "wow/wotlk/std/Spell/Spell";
import { ClassContext } from "./ClassContext";
import { createPassiveSpell, PassiveSpellDefinition } from "./TalentBuilder";

/**
 * Retail-style hero talent trees, which the 3.3.5 client has no concept of.
 * Datascripts create the node spells; a livescript enforces the rules and an
 * addon draws the tree. This file only builds and tags the spells.
 *
 * Every tree has the same shape: a keystone granted when the tree is chosen,
 * six rows of two nodes, and a capstone. In a 'pair' row the player learns
 * both nodes, in a 'choice' row one of the two, so a full tree costs exactly
 * the 10 hero points earned from level 71 to 80.
 */
export const HERO_TREE_ROW_KINDS = ['pair', 'choice', 'pair', 'choice', 'pair', 'choice'] as const;

export interface HeroNode extends PassiveSpellDefinition {
    /** Unique within the tree; part of the spell's generated id. */
    id: string;
}

type HeroRow = [HeroNode, HeroNode];

export interface HeroTreeDefinition {
    id: string;
    keystone: HeroNode;
    /** One entry per {@link HERO_TREE_ROW_KINDS} row. */
    rows: [HeroRow, HeroRow, HeroRow, HeroRow, HeroRow, HeroRow];
    capstone: HeroNode;
}

/** Tag under which a tree's node spells are listed: keystone, rows left to right, capstone. */
export function heroTreeTag(treeId: string) {
    return `hero-${treeId}`;
}

export function createHeroTree(context: ClassContext, definition: HeroTreeDefinition): Spell[] {
    const nodes = [definition.keystone, ...([] as HeroNode[]).concat(...definition.rows), definition.capstone];
    const ids = new Set(nodes.map(node => node.id));
    if (ids.size !== nodes.length) {
        throw new Error(`Hero tree ${definition.id} has duplicate node ids`);
    }
    const spells = nodes.map(node => createPassiveSpell(context, `hero-${definition.id}-${node.id}`, node));
    spells.forEach(spell => std.Tags.add(context.module, heroTreeTag(definition.id), spell.ID));
    return spells;
}
