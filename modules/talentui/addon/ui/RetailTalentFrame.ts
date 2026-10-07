import { readTalentModel, TalentModel, TalentNodeModel } from "../model/TalentModel";
import { primaryTree } from "../model/TalentRules";
import { specBackground } from "./SpecArt";
import { ATLAS, TITLE_BAR_HEIGHT } from "./TalentArt";
import { TalentTreeView, TREE_WIDTH } from "./TalentTreeView";
import { addWindowFrame, createAtlasTexture } from "./WindowFrame";

export const FRAME_NAME = 'TSWoWTalentFrame';

const WIDTH = 900;
const HEIGHT = 690;
const TREE_GAP = 60;
// Below the title bar: a strip for the specialization buttons, then the trees.
const TREES_TOP = TITLE_BAR_HEIGHT + 30;
// The art sits inside the frame's rails.
const CONTENT_INSET = { left: 2, right: 3, bottom: 3 };
const BACKGROUND_ASPECT = 2;
// Darkens the art behind the trees, as retail does, so nodes stay readable.
const BACKGROUND_SHADE = 0.4;

const UPDATE_EVENTS = [
    'PLAYER_TALENT_UPDATE', 'PREVIEW_TALENT_POINTS_CHANGED', 'CHARACTER_POINTS_CHANGED',
    'ACTIVE_TALENT_GROUP_CHANGED',
] as const;

// The 3.3.5 client has no SetShown or SetEnabled.
function setShown(region: WoWAPI.Region, shown: boolean) {
    if (shown) {
        region.Show();
    } else {
        region.Hide();
    }
}

function setEnabled(button: WoWAPI.Button, enabled: boolean) {
    if (enabled) {
        button.Enable();
    } else {
        button.Disable();
    }
}

/** UnitClass is declared as returning an array; it returns several values. */
const unitClass = UnitClass as unknown as (unit: string) => LuaMultiReturn<[string, string]>;

/**
 * The retail talent window: the class's specialization art behind all trees
 * side by side, retail nodes and metal border, and retail's flow of placing
 * points freely and then applying or undoing them all at once.
 */
export class RetailTalentFrame {
    private readonly frame: WoWAPI.Frame;
    private readonly background: WoWAPI.Texture;
    private readonly pointsText: WoWAPI.FontString;
    private readonly applyButton: WoWAPI.Button;
    private readonly undoButton: WoWAPI.Button;
    private readonly groupButtons: WoWAPI.Button[] = [];
    private readonly activateButton: WoWAPI.Button;
    private readonly footerButtons: WoWAPI.Button[] = [];
    private readonly classFile: string;
    private trees: TalentTreeView[] = [];
    private viewedGroup = GetActiveTalentGroup(false, false);
    private model: TalentModel;

    constructor() {
        const [className, classFile] = unitClass('player');
        this.classFile = classFile;

        const frame = CreateFrame('Frame', FRAME_NAME, UIParent);
        frame.SetSize(WIDTH, HEIGHT);
        frame.SetPoint('CENTER');
        frame.SetMovable(true);
        frame.EnableMouse(true);
        frame.RegisterForDrag('LeftButton');
        frame.SetScript('OnDragStart', () => frame.StartMoving());
        frame.SetScript('OnDragStop', () => frame.StopMovingOrSizing());
        frame.Hide();
        // Closes with Escape like Blizzard panels.
        UISpecialFrames.push(FRAME_NAME);

        this.background = frame.CreateTexture(undefined, 'BACKGROUND');
        this.background.SetPoint('TOPLEFT', CONTENT_INSET.left, -TITLE_BAR_HEIGHT);
        this.background.SetPoint('BOTTOMRIGHT', -CONTENT_INSET.right, CONTENT_INSET.bottom);
        // The art is wider than the window; crop its left side, keeping the hero on the right.
        const visible = (WIDTH / (HEIGHT - TITLE_BAR_HEIGHT)) / BACKGROUND_ASPECT;
        this.background.SetTexCoord(1 - visible, 1, 0, 1);
        const shade = frame.CreateTexture(undefined, 'BORDER');
        shade.SetAllPoints(this.background);
        shade.SetTexture(0, 0, 0, BACKGROUND_SHADE);
        addWindowFrame(frame, WIDTH);

        // Text and buttons on the title bar draw above the frame art.
        const titleLayer = CreateFrame('Frame', undefined, frame);
        titleLayer.SetAllPoints();
        titleLayer.SetFrameLevel(frame.GetFrameLevel() + 5);
        const title = titleLayer.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
        title.SetPoint('TOP', 0, -5);
        const color = RAID_CLASS_COLORS[classFile];
        title.SetText(color !== undefined ? `${className} Talents` : 'Talents');
        if (color !== undefined) {
            title.SetTextColor(color.r, color.g, color.b);
        }
        const close = CreateFrame('Button', undefined, titleLayer, 'UIPanelCloseButton');
        close.SetScale(0.75);
        close.SetPoint('TOPRIGHT', 6, 7);

        this.pointsText = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightLarge');
        this.pointsText.SetPoint('BOTTOM', 0, 18);

        this.applyButton = CreateFrame('Button', undefined, frame, 'UIPanelButtonTemplate');
        this.applyButton.SetSize(140, 24);
        this.applyButton.SetPoint('BOTTOMRIGHT', -16, 12);
        this.applyButton.SetText('Apply Changes');
        this.applyButton.SetScript('OnClick', () => LearnPreviewTalents(false));

        this.undoButton = CreateFrame('Button', undefined, frame);
        this.undoButton.SetSize(ATLAS.undo.width * 0.7, ATLAS.undo.height * 0.7);
        this.undoButton.SetPoint('RIGHT', this.applyButton, 'LEFT', -8, 0);
        const undoIcon = createAtlasTexture(this.undoButton, ATLAS.undo, 'ARTWORK');
        undoIcon.SetAllPoints();
        this.undoButton.SetScript('OnClick', () => ResetGroupPreviewTalentPoints(false, this.viewedGroup));
        this.undoButton.SetScript('OnEnter', () => {
            GameTooltip.SetOwner(this.undoButton, 'ANCHOR_TOP');
            GameTooltip.SetText('Undo pending changes');
            GameTooltip.Show();
        });
        this.undoButton.SetScript('OnLeave', () => GameTooltip.Hide());

        this.activateButton = CreateFrame('Button', undefined, frame, 'UIPanelButtonTemplate');
        this.activateButton.SetSize(140, 24);
        this.activateButton.SetPoint('BOTTOMRIGHT', -16, 12);
        this.activateButton.SetText('Activate');
        this.activateButton.SetScript('OnClick', () => SetActiveTalentGroup(this.viewedGroup));

        ['Primary', 'Secondary'].forEach((label, index) => {
            const button = CreateFrame('Button', undefined, frame, 'UIPanelButtonTemplate');
            button.SetSize(86, 20);
            button.SetPoint('TOPLEFT', 14 + index * 90, -TITLE_BAR_HEIGHT - 5);
            button.SetText(label);
            button.SetScript('OnClick', () => {
                this.viewedGroup = index + 1;
                this.refresh();
            });
            this.groupButtons.push(button);
        });

        this.frame = frame;
        this.addFooterButton('Glyphs', () => this.openGlyphs());

        UPDATE_EVENTS.forEach(event => frame.RegisterEvent(event));
        frame.SetScript('OnEvent', () => {
            if (frame.IsShown()) {
                this.refresh();
            }
        });
        this.model = readTalentModel(this.viewedGroup);
    }

    toggle() {
        if (this.frame.IsShown()) {
            this.frame.Hide();
            PlaySound('igCharacterInfoClose');
            return;
        }
        this.viewedGroup = GetActiveTalentGroup(false, false);
        this.refresh();
        this.frame.Show();
        PlaySound('igCharacterInfoOpen');
    }

    /** Adds a button to the bottom left of the window, after the ones already there. */
    addFooterButton(text: string, onClick: () => void) {
        const button = CreateFrame('Button', undefined, this.frame, 'UIPanelButtonTemplate');
        button.SetSize(110, 24);
        button.SetPoint('BOTTOMLEFT', 16 + this.footerButtons.length * 116, 12);
        button.SetText(text);
        button.SetScript('OnClick', onClick);
        this.footerButtons.push(button);
    }

    private refresh() {
        this.model = readTalentModel(this.viewedGroup);
        if (this.trees.length === 0) {
            this.createTrees();
        }
        this.model.trees.forEach((tree, index) => this.trees[index].update(tree));

        this.background.SetTexture(specBackground(this.classFile, primaryTree(this.model.trees.map(tree => tree.points))));
        this.pointsText.SetText(`Talent Points: |cffffd100${this.model.unspentPoints}|r`);

        const active = this.model.isActiveGroup;
        setShown(this.applyButton, active);
        setShown(this.undoButton, active);
        setShown(this.activateButton, !active);
        setEnabled(this.applyButton, this.model.previewPoints > 0);
        setEnabled(this.undoButton, this.model.previewPoints > 0);

        const dualSpec = GetNumTalentGroups(false, false) > 1;
        this.groupButtons.forEach((button, index) => {
            setShown(button, dualSpec);
            if (index + 1 === this.viewedGroup) {
                button.LockHighlight();
            } else {
                button.UnlockHighlight();
            }
        });
    }

    private createTrees() {
        const treesWidth = this.model.trees.length * TREE_WIDTH + (this.model.trees.length - 1) * TREE_GAP;
        const left = (WIDTH - treesWidth) / 2;
        this.trees = this.model.trees.map((tree, index) => {
            const view = new TalentTreeView(this.frame, tree, {
                changePoints: (node, points) => this.changePoints(node, points),
                talentGroup: () => this.viewedGroup,
            });
            view.frame.SetPoint('TOPLEFT', left + index * (TREE_WIDTH + TREE_GAP), -TREES_TOP);
            return view;
        });
    }

    private changePoints(node: TalentNodeModel, points: 1 | -1) {
        // Talents of the inactive specialization can be looked at but not changed.
        if (!this.model.isActiveGroup) {
            return;
        }
        AddPreviewTalentPoints(node.tab, node.index, points, false, this.viewedGroup);
    }

    private openGlyphs() {
        const toggleGlyphs = _G['ToggleGlyphFrame'];
        if (toggleGlyphs !== undefined) {
            toggleGlyphs();
        }
    }
}
