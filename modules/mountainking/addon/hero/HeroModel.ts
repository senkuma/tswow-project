/**
 * Client-side copy of the hero talent state, rebuilt from the server's addon
 * messages (see sendState in livescripts/hero/HeroTalents.ts). Free of WoW
 * APIs so the protocol can be tested on its own.
 */
export type NodeState = 'learned' | 'available' | 'locked';

export interface HeroNodeModel {
    index: number;
    spellId: number;
    state: NodeState;
}

export interface HeroTreeModel {
    key: string;
    name: string;
    /** Whether the player's specialization may choose this tree. */
    available: boolean;
    nodes: HeroNodeModel[];
}

export interface HeroModel {
    level: number;
    points: number;
    spent: number;
    spec?: string;
    chosenTree?: string;
    trees: HeroTreeModel[];
}

export type MessageResult = 'complete' | 'error' | 'partial' | 'ignored';

export class HeroModelBuilder {
    /** The last complete state received; undefined until the first sync. */
    current: HeroModel | undefined;
    lastError: string | undefined;
    private pending: HeroModel | undefined;

    apply(message: string): MessageResult {
        const fields = message.split(';');
        switch (fields[0]) {
            case 'BEGIN':
                this.pending = { level: 0, points: 0, spent: 0, trees: [] };
                return 'partial';
            case 'STATE':
                if (this.pending === undefined) return 'ignored';
                this.pending.level = toNumber(fields[1]);
                this.pending.points = toNumber(fields[2]);
                this.pending.spent = toNumber(fields[3]);
                this.pending.spec = optional(fields[4]);
                this.pending.chosenTree = optional(fields[5]);
                return 'partial';
            case 'TREE':
                if (this.pending === undefined) return 'ignored';
                this.pending.trees.push({ key: fields[1], name: fields[2], available: fields[3] === '1', nodes: [] });
                return 'partial';
            case 'NODE': {
                const tree = this.pending === undefined ? undefined : findTree(this.pending, fields[1]);
                if (tree === undefined) return 'ignored';
                tree.nodes.push({ index: toNumber(fields[2]), spellId: toNumber(fields[3]), state: fields[4] as NodeState });
                return 'partial';
            }
            case 'END':
                if (this.pending === undefined) return 'ignored';
                this.current = this.pending;
                this.pending = undefined;
                this.lastError = undefined;
                return 'complete';
            case 'ERR':
                this.lastError = fields.slice(1).join(';');
                return 'error';
            default:
                return 'ignored';
        }
    }
}

export function findTree(model: HeroModel, key: string): HeroTreeModel | undefined {
    for (const tree of model.trees) {
        if (tree.key === key) {
            return tree;
        }
    }
    return undefined;
}

export function findNode(tree: HeroTreeModel, index: number): HeroNodeModel | undefined {
    for (const node of tree.nodes) {
        if (node.index === index) {
            return node;
        }
    }
    return undefined;
}

function toNumber(text: string) {
    const value = parseInt(text);
    // NaN is the only value that differs from itself.
    return value === value ? value : 0;
}

function optional(text: string) {
    return text === undefined || text === '-' ? undefined : text;
}
