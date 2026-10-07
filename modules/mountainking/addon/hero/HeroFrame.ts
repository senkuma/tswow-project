import { findNode, findTree, HeroModel, HeroModelBuilder, HeroTreeModel, NodeState } from "./HeroModel";

/** Addon message prefix shared with livescripts/hero/HeroTalents.ts. */
const ADDON_PREFIX = 'MKHERO';
const NODE_SIZE = 36;
const ROW_HEIGHT = 50;
const ROW_COUNT = 6;
const CAPSTONE_INDEX = 13;
// Choice rows (pick one of two), matching HERO_TREE_ROW_KINDS in classkit.
const CHOICE_ROWS = [1, 3, 5];

const BORDER_COLORS: Record<NodeState, [number, number, number]> = {
    learned: [1, 0.82, 0],
    available: [0.2, 1, 0.2],
    locked: [0.4, 0.4, 0.4],
};

/** Hero talent requests go to the server as hidden `.mkhero` chat commands. */
function sendCommand(command: string) {
    SendChatMessage(`.mkhero ${command}`, 'SAY');
}

export class HeroFrame {
    private readonly model = new HeroModelBuilder();
    private readonly frame: WoWAPI.Frame;
    private readonly header: WoWAPI.FontString;
    private readonly error: WoWAPI.FontString;
    private content: WoWAPI.Frame;

    constructor() {
        const frame = CreateFrame('Frame', 'MountainKingHeroFrame', UIParent);
        frame.SetSize(420, 520);
        frame.SetPoint('CENTER');
        // Opens from the talent window, so it must draw above it.
        frame.SetFrameStrata('DIALOG');
        frame.SetBackdrop({
            bgFile: 'Interface\\DialogFrame\\UI-DialogBox-Background',
            edgeFile: 'Interface\\DialogFrame\\UI-DialogBox-Border',
            tile: true, tileSize: 32, edgeSize: 32,
            insets: { left: 11, right: 12, top: 12, bottom: 11 },
        });
        frame.SetMovable(true);
        frame.EnableMouse(true);
        frame.RegisterForDrag('LeftButton');
        frame.SetScript('OnDragStart', () => frame.StartMoving());
        frame.SetScript('OnDragStop', () => frame.StopMovingOrSizing());
        frame.Hide();
        // Closes with Escape like Blizzard panels.
        (UISpecialFrames as string[]).push('MountainKingHeroFrame');

        const title = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontNormalLarge');
        title.SetPoint('TOP', 0, -18);
        title.SetText('Hero Talents');
        CreateFrame('Button', undefined, frame, 'UIPanelCloseButton').SetPoint('TOPRIGHT', -6, -6);

        this.header = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlight');
        this.header.SetPoint('TOP', 0, -44);
        this.error = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontRedSmall');
        this.error.SetPoint('BOTTOM', 0, 46);

        const reset = CreateFrame('Button', undefined, frame, 'UIPanelButtonTemplate');
        reset.SetSize(120, 22);
        reset.SetPoint('BOTTOM', 0, 18);
        reset.SetText('Reset');
        reset.SetScript('OnClick', () => sendCommand('reset'));

        this.frame = frame;
        this.content = CreateFrame('Frame', undefined, frame);
        frame.RegisterEvent('CHAT_MSG_ADDON');
        frame.SetScript('OnEvent', (_, event, prefix, message) => {
            if (event === 'CHAT_MSG_ADDON' && prefix === ADDON_PREFIX) {
                this.onMessage(message as string);
            }
        });
    }

    toggle() {
        if (this.frame.IsShown()) {
            this.frame.Hide();
        } else {
            this.frame.Show();
            sendCommand('sync');
        }
    }

    private onMessage(message: string) {
        const result = this.model.apply(message);
        if (result === 'complete' || result === 'error') {
            this.render();
        }
    }

    private render() {
        this.error.SetText(this.model.lastError ?? '');
        const model = this.model.current;
        if (model === undefined) {
            return;
        }
        this.header.SetText(`Specialization: ${model.spec ?? 'none'}    Hero points: ${model.points - model.spent} / ${model.points}`);
        // Frames cannot be destroyed in the WoW API, so each render replaces the content frame.
        this.content.Hide();
        const content = CreateFrame('Frame', undefined, this.frame);
        content.SetAllPoints();
        this.content = content;
        const chosen = model.chosenTree === undefined ? undefined : findTree(model, model.chosenTree);
        if (chosen === undefined) {
            this.renderChoices(content, model);
        } else {
            this.renderTree(content, chosen);
        }
    }

    /** Before a tree is chosen: one card per hero tree, showing its keystone. */
    private renderChoices(parent: WoWAPI.Frame, model: HeroModel) {
        model.trees.forEach((tree, column) => {
            const x = (column - (model.trees.length - 1) / 2) * 130;
            const keystone = findNode(tree, 0);
            if (keystone !== undefined) {
                this.nodeButton(parent, keystone.spellId, tree.available ? 'available' : 'locked', x, -120, () => {});
            }
            const name = parent.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
            name.SetPoint('TOP', x, -165);
            name.SetText(tree.name);
            const choose = CreateFrame('Button', undefined, parent, 'UIPanelButtonTemplate');
            choose.SetSize(100, 22);
            choose.SetPoint('TOP', x, -190);
            choose.SetText(tree.available ? 'Choose' : 'Unavailable');
            if (tree.available) {
                choose.SetScript('OnClick', () => sendCommand(`choose ${tree.key}`));
            } else {
                choose.Disable();
            }
        });
    }

    /** A chosen tree: keystone, six rows of two nodes, capstone. */
    private renderTree(parent: WoWAPI.Frame, tree: HeroTreeModel) {
        const name = parent.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
        name.SetPoint('TOP', 0, -64);
        name.SetText(tree.name);
        tree.nodes.forEach(node => {
            let x = 0;
            let y = -90;
            if (node.index === CAPSTONE_INDEX) {
                y -= (ROW_COUNT + 1) * ROW_HEIGHT;
            } else if (node.index > 0) {
                const row = Math.floor((node.index - 1) / 2);
                x = node.index % 2 === 1 ? -50 : 50;
                y -= (row + 1) * ROW_HEIGHT;
                if (node.index % 2 === 0 && CHOICE_ROWS.indexOf(row) !== -1) {
                    const or = parent.CreateFontString(undefined, 'OVERLAY', 'GameFontDisableSmall');
                    or.SetPoint('TOP', 0, y - 12);
                    or.SetText('or');
                }
            }
            this.nodeButton(parent, node.spellId, node.state, x, y, () => {
                if (node.state === 'available') {
                    sendCommand(`learn ${tree.key} ${node.index}`);
                }
            });
        });
    }

    private nodeButton(parent: WoWAPI.Frame, spellId: number, state: NodeState, x: number, y: number, onClick: () => void) {
        const button = CreateFrame('Button', undefined, parent);
        button.SetSize(NODE_SIZE, NODE_SIZE);
        button.SetPoint('TOP', x, y);
        const icon = button.CreateTexture(undefined, 'ARTWORK');
        icon.SetAllPoints();
        // Destructured: indexing a multi-return call would read the first value (the name).
        const [, , texture] = GetSpellInfo(spellId);
        icon.SetTexture(texture);
        icon.SetDesaturated(state === 'locked' ? 1 : 0);
        const border = button.CreateTexture(undefined, 'OVERLAY');
        border.SetTexture('Interface\\Buttons\\UI-ActionButton-Border');
        border.SetBlendMode('ADD');
        border.SetSize(NODE_SIZE * 1.8, NODE_SIZE * 1.8);
        border.SetPoint('CENTER');
        const [r, g, b] = BORDER_COLORS[state];
        border.SetVertexColor(r, g, b);
        button.SetScript('OnEnter', () => {
            GameTooltip.SetOwner(button, 'ANCHOR_RIGHT');
            GameTooltip.SetHyperlink(`spell:${spellId}`);
            GameTooltip.Show();
        });
        button.SetScript('OnLeave', () => GameTooltip.Hide());
        button.SetScript('OnClick', onClick);
    }
}
