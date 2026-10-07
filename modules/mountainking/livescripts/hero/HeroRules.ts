/**
 * Hero talent rules, free of server APIs so they can be tested on their own.
 *
 * A tree's node spells are listed keystone first, then six rows of two nodes,
 * then the capstone; the row kinds mirror HERO_TREE_ROW_KINDS in the classkit
 * datascript module, which builds and tags the spells in that order.
 */
export type RowKind = 'pair' | 'choice';
export const ROW_KINDS: RowKind[] = ['pair', 'choice', 'pair', 'choice', 'pair', 'choice'];
export const NODES_PER_TREE = 2 + ROW_KINDS.length * 2;
export const KEYSTONE_INDEX = 0;
export const CAPSTONE_INDEX = NODES_PER_TREE - 1;

export const FIRST_HERO_LEVEL = 71;
export const MAX_HERO_POINTS = 10;

export interface HeroTree {
    key: string;
    name: string;
    /** Node spells in tag order; see the file comment. */
    spells: number[];
}

export type NodeState = 'learned' | 'available' | 'locked';

/** What the rules need to know about a player. */
export interface HeroPlayerState {
    level: number;
    knows(spell: number): boolean;
}

/** One hero point per level from 71, ten at 80. */
export function heroPoints(level: number) {
    return Math.max(0, Math.min(MAX_HERO_POINTS, level - FIRST_HERO_LEVEL + 1));
}

export function rowOfNode(index: number) {
    return Math.floor((index - 1) / 2);
}

/** The tree whose keystone the player knows; at most one can be chosen. */
export function chosenTree(trees: HeroTree[], player: HeroPlayerState): HeroTree | undefined {
    for (const tree of trees) {
        if (player.knows(tree.spells[KEYSTONE_INDEX])) {
            return tree;
        }
    }
    return undefined;
}

/** Points spent in a tree; the keystone is free. */
export function spentPoints(tree: HeroTree, player: HeroPlayerState) {
    let spent = 0;
    for (let index = 1; index < NODES_PER_TREE; index++) {
        if (player.knows(tree.spells[index])) {
            spent++;
        }
    }
    return spent;
}

function rowComplete(tree: HeroTree, row: number, player: HeroPlayerState) {
    const left = player.knows(tree.spells[1 + row * 2]);
    const right = player.knows(tree.spells[2 + row * 2]);
    return ROW_KINDS[row] === 'pair' ? left && right : left || right;
}

/** Why a node cannot be learned, or undefined when it can. */
export function learnBlocker(tree: HeroTree, index: number, player: HeroPlayerState): string | undefined {
    if (index <= KEYSTONE_INDEX || index > CAPSTONE_INDEX) {
        return 'That is not a node you can spend points on.';
    }
    if (!player.knows(tree.spells[KEYSTONE_INDEX])) {
        return `Choose ${tree.name} as your hero tree first.`;
    }
    if (player.knows(tree.spells[index])) {
        return 'You already know that talent.';
    }
    if (spentPoints(tree, player) >= heroPoints(player.level)) {
        return 'You have no hero points left. You earn one per level from 71 to 80.';
    }
    const row = index === CAPSTONE_INDEX ? ROW_KINDS.length : rowOfNode(index);
    for (let previous = 0; previous < row; previous++) {
        if (!rowComplete(tree, previous, player)) {
            return 'Complete the rows above first.';
        }
    }
    if (index !== CAPSTONE_INDEX && ROW_KINDS[row] === 'choice') {
        const other = index % 2 === 1 ? index + 1 : index - 1;
        if (player.knows(tree.spells[other])) {
            return 'You already chose the other talent in that row.';
        }
    }
    return undefined;
}

export function nodeState(tree: HeroTree, index: number, player: HeroPlayerState): NodeState {
    if (player.knows(tree.spells[index])) {
        return 'learned';
    }
    return learnBlocker(tree, index, player) === undefined ? 'available' : 'locked';
}

/** Why a tree cannot be chosen, or undefined when it can. */
export function chooseBlocker(
    tree: HeroTree,
    trees: HeroTree[],
    availableKeys: string[],
    player: HeroPlayerState,
): string | undefined {
    if (player.level < FIRST_HERO_LEVEL) {
        return `Hero talents unlock at level ${FIRST_HERO_LEVEL}.`;
    }
    const current = chosenTree(trees, player);
    if (current !== undefined) {
        return `You already follow ${current.name}. Reset your hero talents to choose again.`;
    }
    if (availableKeys.indexOf(tree.key) === -1) {
        return `${tree.name} is not available to your specialization.`;
    }
    return undefined;
}

/**
 * The player's specialization: the talent tree with the most points, or
 * undefined without a clear leader (no points, or a tie for first).
 */
export function mainTalentTree(pointsByTree: { key: string, points: number }[]): string | undefined {
    let best: string | undefined;
    let bestPoints = 0;
    let tied = false;
    for (const tree of pointsByTree) {
        if (tree.points > bestPoints) {
            best = tree.key;
            bestPoints = tree.points;
            tied = false;
        } else if (tree.points === bestPoints && tree.points > 0) {
            tied = true;
        }
    }
    return tied ? undefined : best;
}
