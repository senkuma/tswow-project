/** Points a tree needs per tier before the next tier unlocks (WotLK talent rules). */
export const POINTS_PER_TIER = 5;

export type NodeState = 'learned' | 'available' | 'locked';

export interface NodeFacts {
    /** Including points previewed but not yet applied. */
    rank: number;
    maxRank: number;
    /** 1-based, as the talent API reports it. */
    tier: number;
    meetsPrereq: boolean;
    /** Points in the node's tree, previewed ones included. */
    treePoints: number;
    unspentPoints: number;
}

/** Whether the tiers above give the tree enough points for this node's tier. */
export function tierUnlocked(tier: number, treePoints: number) {
    return treePoints >= (tier - 1) * POINTS_PER_TIER;
}

/** Whether one more point can go into the node. */
export function canAddPoint(node: NodeFacts) {
    return node.unspentPoints > 0
        && node.rank < node.maxRank
        && node.meetsPrereq
        && tierUnlocked(node.tier, node.treePoints);
}

/**
 * Retail's three node looks: gold once it has points, green while a point
 * can go in, gray otherwise.
 */
export function nodeState(node: NodeFacts): NodeState {
    if (node.rank > 0) {
        return 'learned';
    }
    return canAddPoint(node) ? 'available' : 'locked';
}

/**
 * The tree whose specialization art fills the window: the one with the most
 * points, the first on ties and when nothing is spent yet.
 */
export function primaryTree(treePoints: number[]) {
    let best = 0;
    treePoints.forEach((points, index) => {
        if (points > treePoints[best]) {
            best = index;
        }
    });
    return best;
}
