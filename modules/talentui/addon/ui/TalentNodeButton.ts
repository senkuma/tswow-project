import { TalentNodeModel } from "../model/TalentModel";
import { NodeState } from "../model/TalentRules";
import { ATLAS, AtlasPiece } from "./TalentArt";
import { createAtlasTexture, setAtlasPiece } from "./WindowFrame";

export const NODE_SIZE = 24;
// The retail node frames leave a margin for their bevel around the icon.
const FRAME_SIZE = NODE_SIZE * 1.32;
const ICON_SIZE = NODE_SIZE + 2;
// Icons have a dark border in the texture; cropping it lets the node frame be the border.
const ICON_CROP = 0.08;
const BADGE_HEIGHT = 10;
const BADGE_PADDING = 2;
const RANK_FONT_SIZE = 10;

const SQUARE_FRAMES: Record<NodeState, AtlasPiece> = {
    learned: ATLAS.squareLearned,
    available: ATLAS.squareAvailable,
    locked: ATLAS.squareLocked,
};
const CIRCLE_FRAMES: Record<NodeState, AtlasPiece> = {
    learned: ATLAS.circleLearned,
    available: ATLAS.circleAvailable,
    locked: ATLAS.circleLocked,
};

const RANK_COLORS: Record<'canAdd' | 'maxed' | 'locked', [number, number, number]> = {
    canAdd: [0.25, 1, 0.25],
    maxed: [1, 0.82, 0],
    locked: [0.65, 0.65, 0.65],
};

/** GameTooltip:SetTalent with the 3.3.5 arguments TSWoW's declarations leave out. */
interface TalentTooltip {
    SetTalent(tab: number, index: number, inspect: boolean, pet: boolean, talentGroup: number, preview: boolean): void;
}

export interface NodeActions {
    /** Adds (+1) or removes (-1) a previewed point. */
    changePoints(node: TalentNodeModel, points: 1 | -1): void;
    talentGroup(): number;
}

/**
 * One talent in retail style: abilities are squares and passives circles,
 * framed gold once learned, green while a point can go in and gray when
 * locked, with the rank in a badge on the corner. Left click previews a
 * point, right click removes one; nothing is learned until changes are applied.
 */
export class TalentNodeButton {
    readonly button: WoWAPI.Button;
    private readonly icon: WoWAPI.Texture;
    private readonly border: WoWAPI.Texture;
    private readonly badge: WoWAPI.Texture;
    private readonly rank: WoWAPI.FontString;
    private node: TalentNodeModel;

    constructor(parent: WoWAPI.Frame, node: TalentNodeModel, actions: NodeActions) {
        this.node = node;
        const button = CreateFrame('Button', undefined, parent);
        button.SetSize(NODE_SIZE, NODE_SIZE);
        button.RegisterForClicks('LeftButtonUp', 'RightButtonUp');

        this.icon = button.CreateTexture(undefined, 'ARTWORK');
        this.icon.SetSize(ICON_SIZE, ICON_SIZE);
        this.icon.SetPoint('CENTER');
        if (node.isAbility) {
            this.icon.SetTexture(node.icon);
            this.icon.SetTexCoord(ICON_CROP, 1 - ICON_CROP, ICON_CROP, 1 - ICON_CROP);
        } else {
            // The 3.3.5 client cannot mask textures; portraits are its only round images.
            SetPortraitToTexture(this.icon, node.icon);
        }

        const frames = node.isAbility ? SQUARE_FRAMES : CIRCLE_FRAMES;
        this.border = createAtlasTexture(button, frames.locked, 'OVERLAY');
        this.border.SetSize(FRAME_SIZE, FRAME_SIZE);
        this.border.SetPoint('CENTER');

        const highlight = button.CreateTexture(undefined, 'HIGHLIGHT');
        highlight.SetTexture('Interface\\Buttons\\ButtonHilight-Square');
        highlight.SetBlendMode('ADD');
        highlight.SetSize(ICON_SIZE, ICON_SIZE);
        highlight.SetPoint('CENTER');

        // The badge sits above the frame on its own level so the frame never covers it.
        const badgeLayer = CreateFrame('Frame', undefined, button);
        badgeLayer.SetAllPoints();
        badgeLayer.SetFrameLevel(button.GetFrameLevel() + 2);
        this.badge = badgeLayer.CreateTexture(undefined, 'BACKGROUND');
        this.badge.SetTexture(0, 0, 0, 0.8);
        this.badge.SetHeight(BADGE_HEIGHT);
        this.badge.SetPoint('BOTTOMRIGHT', button, 'BOTTOMRIGHT', 4, -2);
        this.rank = badgeLayer.CreateFontString(undefined, 'OVERLAY', 'NumberFontNormalSmall');
        const [font, , flags] = this.rank.GetFont();
        this.rank.SetFont(font, RANK_FONT_SIZE, flags);
        this.rank.SetPoint('CENTER', this.badge, 'CENTER', 0, 0);

        button.SetScript('OnClick', (_, mouseButton) =>
            actions.changePoints(this.node, mouseButton === 'RightButton' ? -1 : 1));
        button.SetScript('OnEnter', () => {
            GameTooltip.SetOwner(button, 'ANCHOR_RIGHT');
            (GameTooltip as unknown as TalentTooltip)
                .SetTalent(this.node.tab, this.node.index, false, false, actions.talentGroup(), true);
            GameTooltip.Show();
        });
        button.SetScript('OnLeave', () => GameTooltip.Hide());
        this.button = button;
        this.update(node);
    }

    update(node: TalentNodeModel) {
        this.node = node;
        setAtlasPiece(this.border, (node.isAbility ? SQUARE_FRAMES : CIRCLE_FRAMES)[node.state]);
        const locked = node.state === 'locked';
        this.icon.SetDesaturated(locked ? 1 : 0);
        const shade = locked ? 0.55 : 1;
        this.icon.SetVertexColor(shade, shade, shade);
        this.rank.SetText(`${node.rank}/${node.maxRank}`);
        this.badge.SetWidth(this.rank.GetStringWidth() + BADGE_PADDING * 2);
        const [r, g, b] = RANK_COLORS[node.canAddPoint ? 'canAdd' : node.rank === node.maxRank ? 'maxed' : 'locked'];
        this.rank.SetTextColor(r, g, b);
    }
}
