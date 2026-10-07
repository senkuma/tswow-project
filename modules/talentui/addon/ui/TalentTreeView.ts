import { TalentNodeModel, TalentTreeModel } from "../model/TalentModel";
import { NODE_SIZE, NodeActions, TalentNodeButton } from "./TalentNodeButton";

const COLUMN_SPACING = 48;
const ROW_SPACING = 40;
const COLUMNS = 4;
const TIERS = 11;
export const TREE_WIDTH = (COLUMNS - 1) * COLUMN_SPACING + NODE_SIZE;
export const TREE_HEIGHT = (TIERS - 1) * ROW_SPACING + NODE_SIZE;
const HEADER_HEIGHT = 44;
const HEADER_ICON_SIZE = 24;

const LINE_WIDTH = 2;
const LINE_SHADOW_WIDTH = 5;
const LINE_LEARNED: [number, number, number] = [1, 0.82, 0];
const LINE_LOCKED: [number, number, number] = [0.35, 0.35, 0.35];

type Point = [number, number];
type NodeCenter = (tier: number, column: number) => Point;

/**
 * How far to shift a tree's nodes right so the columns it uses sit centered
 * in the grid. WotLK trees use all four columns; trees built with classkit
 * use three, which would otherwise hug the grid's left edge.
 */
export function columnCenteringOffset(columns: number[]) {
    if (columns.length === 0) {
        return 0;
    }
    const first = Math.min(...columns);
    const last = Math.max(...columns);
    return ((COLUMNS - 1) - (last - first)) * COLUMN_SPACING / 2 - (first - 1) * COLUMN_SPACING;
}

/** Node centers relative to the tree's top left corner, shifted by `offsetX`. */
function nodeCenters(offsetX: number): NodeCenter {
    return (tier, column) =>
        [offsetX + (column - 1) * COLUMN_SPACING + NODE_SIZE / 2, -((tier - 1) * ROW_SPACING + NODE_SIZE / 2)];
}

/** A straight connection segment: a dark shadow under a colored core. */
class LineSegment {
    private readonly core: WoWAPI.Texture;

    constructor(parent: WoWAPI.Frame, from: Point, to: Point) {
        const shadow = this.segment(parent, from, to, LINE_SHADOW_WIDTH, 'BACKGROUND');
        shadow.SetTexture(0, 0, 0, 0.8);
        this.core = this.segment(parent, from, to, LINE_WIDTH, 'BORDER');
    }

    setLearned(learned: boolean) {
        const [r, g, b] = learned ? LINE_LEARNED : LINE_LOCKED;
        this.core.SetTexture(r, g, b, 1);
    }

    private segment(parent: WoWAPI.Frame, [x1, y1]: Point, [x2, y2]: Point,
        width: number, layer: WoWAPI.Layer) {
        const texture = parent.CreateTexture(undefined, layer);
        const half = width / 2;
        texture.SetPoint('TOPLEFT', Math.min(x1, x2) - half, Math.max(y1, y2) + half);
        texture.SetPoint('BOTTOMRIGHT', parent, 'TOPLEFT', Math.max(x1, x2) + half, Math.min(y1, y2) - half);
        return texture;
    }
}

/** A requirement arrow: straight when the talents share a row or column, otherwise across then down. */
class Connection {
    private readonly segments: LineSegment[];

    constructor(parent: WoWAPI.Frame, node: TalentNodeModel, prereq: { tier: number; column: number },
        center: NodeCenter) {
        const from = center(prereq.tier, prereq.column);
        const to = center(node.tier, node.column);
        const corner: Point = [to[0], from[1]];
        this.segments = from[0] === to[0] || from[1] === to[1]
            ? [new LineSegment(parent, from, to)]
            : [new LineSegment(parent, from, corner), new LineSegment(parent, corner, to)];
    }

    setLearned(learned: boolean) {
        this.segments.forEach(segment => segment.setLearned(learned));
    }
}

/**
 * One talent tree: a header with the tree's icon, name and points, and the
 * nodes on their tier and column grid joined by requirement lines.
 */
export class TalentTreeView {
    readonly frame: WoWAPI.Frame;
    private readonly title: WoWAPI.FontString;
    private readonly treeName: string;
    private readonly nodes: TalentNodeButton[] = [];
    private readonly connections: { connection: Connection; prereq: { tier: number; column: number } }[] = [];

    constructor(parent: WoWAPI.Frame, tree: TalentTreeModel, actions: NodeActions) {
        const frame = CreateFrame('Frame', undefined, parent);
        frame.SetSize(TREE_WIDTH, TREE_HEIGHT + HEADER_HEIGHT);

        // Header centered over the tree: round spec icon, then name and points.
        this.title = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontNormalLarge');
        this.title.SetPoint('TOP', HEADER_ICON_SIZE / 2, -4);
        const icon = frame.CreateTexture(undefined, 'ARTWORK');
        icon.SetSize(HEADER_ICON_SIZE, HEADER_ICON_SIZE);
        icon.SetPoint('RIGHT', this.title, 'LEFT', -6, 0);
        SetPortraitToTexture(icon, tree.icon);
        this.treeName = tree.name;

        const grid = CreateFrame('Frame', undefined, frame);
        grid.SetPoint('TOPLEFT', 0, -HEADER_HEIGHT);
        grid.SetSize(TREE_WIDTH, TREE_HEIGHT);
        const center = nodeCenters(columnCenteringOffset(tree.nodes.map(node => node.column)));
        tree.nodes.forEach(node => {
            if (node.prereq !== undefined) {
                this.connections.push({
                    connection: new Connection(grid, node, node.prereq, center),
                    prereq: node.prereq,
                });
            }
        });
        tree.nodes.forEach(node => {
            const view = new TalentNodeButton(grid, node, actions);
            const [x, y] = center(node.tier, node.column);
            view.button.SetPoint('CENTER', grid, 'TOPLEFT', x, y);
            this.nodes.push(view);
        });

        this.frame = frame;
        this.update(tree);
    }

    update(tree: TalentTreeModel) {
        this.title.SetText(`${this.treeName}  |cffffffff${tree.points}|r`);
        tree.nodes.forEach((node, index) => this.nodes[index].update(node));
        this.connections.forEach(({ connection, prereq }) => {
            const source = tree.nodes.find(node => node.tier === prereq.tier && node.column === prereq.column);
            connection.setLearned(source !== undefined && source.rank === source.maxRank);
        });
    }
}
