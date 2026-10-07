import { isHeldAtCap, isMaxLevel, progressFraction, WeaponState } from "../model/WeaponProgress";
import { createAtlasTexture, createShade, cropAtlasWidth } from "./AtlasTexture";
import { COLORS, formatBonus, formatNumber, setTextColor } from "./Format";
import { ATLAS, BACKDROP_TEXTURE } from "./WeaponArt";

/** The narrowest the panel can be; it stretches to the width it is anchored to. */
export const PANEL_MIN_WIDTH = ATLAS.bamboo.width;
const BADGE_LEFT = 6;
const BADGE_TOP = 14;
const LEVEL_FONT_SIZE = 17;
const CONTENT_LEFT = 58;
const BAR_LEFT = 60;
const BAR_TOP = 37;
const BAR_FONT_SIZE = 9;
const STATUS_TOP = 51;
const DIVIDER_TOP = 67;
const DIVIDER_WIDTH = 228;
const BONUS_HEADER_TOP = 73;
const BONUS_FIRST_TOP = 87;
const BONUS_ROW_HEIGHT = 13;
const BOTTOM_PADDING = 2;
const SIDE_MARGIN = 10;
const BACKDROP_SHADE: [number, number, number] = [0.6, 0.7, 0.65];

/** The panel's height with a row for each of `bonusCount` bonuses. */
export function panelHeight(bonusCount: number) {
    return BONUS_FIRST_TOP + bonusCount * BONUS_ROW_HEIGHT + BOTTOM_PADDING;
}

interface BonusRow {
    total: WoWAPI.FontString;
    next: WoWAPI.FontString;
}

/**
 * A weapon's level and experience in retail artifact style: a gold glass
 * badge with the level, the experience bar in artifact power gold, and the
 * bonuses with what the next level adds, over the Monk artifact backdrop.
 */
export class WeaponProgressPanel {
    readonly frame: WoWAPI.Frame;
    private readonly level: WoWAPI.FontString;
    private readonly levelRange: WoWAPI.FontString;
    private readonly barFill: WoWAPI.Texture;
    private readonly barText: WoWAPI.FontString;
    private readonly status: WoWAPI.FontString;
    private readonly nextHeader: WoWAPI.FontString;
    private readonly bonusRows: BonusRow[] = [];

    constructor(parent: WoWAPI.Frame) {
        const frame = CreateFrame('Frame', undefined, parent);
        frame.SetSize(PANEL_MIN_WIDTH, panelHeight(0));
        frame.Hide();
        this.frame = frame;
        addBackground(frame);

        const badge = createAtlasTexture(frame, ATLAS.badge, 'ARTWORK');
        badge.SetPoint('TOPLEFT', BADGE_LEFT, -BADGE_TOP);
        this.level = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightLarge');
        const [font] = this.level.GetFont();
        this.level.SetFont(font, LEVEL_FONT_SIZE, 'OUTLINE');
        this.level.SetPoint('CENTER', badge, 'CENTER', 0, 1);

        const title = this.text('GameFontNormal', 'TOPLEFT', CONTENT_LEFT, -17);
        title.SetText('Weapon Level');
        this.levelRange = this.text('GameFontHighlightSmall', 'TOPRIGHT', -8, -18);

        // Layers order the bar's parts, as 3.3.5 cannot order textures within a layer:
        // backdrop and shade below, then the track, the fill, and a child frame for the bar frame and text.
        const track = createAtlasTexture(frame, ATLAS.barTrack, 'ARTWORK');
        track.SetPoint('TOPLEFT', BAR_LEFT, -BAR_TOP);
        this.barFill = createAtlasTexture(frame, ATLAS.barFill, 'OVERLAY');
        this.barFill.SetPoint('TOPLEFT', track, 'TOPLEFT');
        const barOverlay = CreateFrame('Frame', undefined, frame);
        barOverlay.SetAllPoints();
        const barFrame = createAtlasTexture(barOverlay, ATLAS.barFrame, 'ARTWORK');
        barFrame.SetPoint('CENTER', track, 'CENTER');
        this.barText = barOverlay.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightSmall');
        const [barFont] = this.barText.GetFont();
        this.barText.SetFont(barFont, BAR_FONT_SIZE, 'OUTLINE');
        this.barText.SetPoint('CENTER', track, 'CENTER', 0, 0);

        this.status = this.text('GameFontNormalSmall', 'TOPLEFT', CONTENT_LEFT, -STATUS_TOP);

        const divider = createAtlasTexture(frame, ATLAS.goldLine, 'ARTWORK');
        divider.SetWidth(DIVIDER_WIDTH);
        divider.SetPoint('TOP', 0, -DIVIDER_TOP);
        const bonusHeader = this.text('GameFontNormalSmall', 'TOPLEFT', SIDE_MARGIN, -BONUS_HEADER_TOP);
        bonusHeader.SetText('Bonuses');
        this.nextHeader = this.text('GameFontNormalSmall', 'TOPRIGHT', -SIDE_MARGIN, -BONUS_HEADER_TOP);
        this.nextHeader.SetText('Next level');
        setTextColor(this.nextHeader, COLORS.gray);
    }

    show(state: WeaponState) {
        this.update(state);
        this.frame.Show();
    }

    hide() {
        this.frame.Hide();
    }

    update(state: WeaponState) {
        const maxed = isMaxLevel(state);
        this.level.SetText(`${state.level}`);
        this.levelRange.SetText(`${state.level} / ${state.maxLevel}`);
        this.updateBar(state);
        this.updateStatus(state);
        if (maxed) {
            this.nextHeader.Hide();
        } else {
            this.nextHeader.Show();
        }
        this.frame.SetHeight(panelHeight(state.bonuses.length));
        // Frames cannot be destroyed, so rows are made as needed and kept for later weapons.
        while (this.bonusRows.length < state.bonuses.length) {
            this.bonusRows.push(this.createBonusRow(this.bonusRows.length));
        }
        this.bonusRows.forEach((row, index) => {
            const bonus = state.bonuses[index];
            row.total.SetText(bonus === undefined ? '' : formatBonus(bonus.amount, bonus.label));
            row.next.SetText(bonus === undefined || bonus.next === undefined ? '' : `+${formatNumber(bonus.next - bonus.amount)}`);
        });
    }

    private createBonusRow(index: number): BonusRow {
        const top = -(BONUS_FIRST_TOP + index * BONUS_ROW_HEIGHT);
        const next = this.text('GameFontHighlightSmall', 'TOPRIGHT', -SIDE_MARGIN, top);
        setTextColor(next, COLORS.green);
        return { total: this.text('GameFontHighlightSmall', 'TOPLEFT', SIDE_MARGIN, top), next };
    }

    private updateBar(state: WeaponState) {
        const fraction = progressFraction(state);
        // A zero-width texture would stretch to its anchors, so an empty bar hides the fill.
        if (fraction > 0) {
            cropAtlasWidth(this.barFill, ATLAS.barFill, fraction);
            this.barFill.Show();
        } else {
            this.barFill.Hide();
        }
        this.barText.SetText(isMaxLevel(state)
            ? 'Max Level'
            : `${formatNumber(state.experience)} / ${formatNumber(state.experienceToNext)}`);
    }

    private updateStatus(state: WeaponState) {
        if (isMaxLevel(state)) {
            this.status.SetText('Fully awakened');
            setTextColor(this.status, COLORS.artifact);
        } else if (isHeldAtCap(state)) {
            this.status.SetText(`Grows again at character level ${state.cap + 1}`);
            setTextColor(this.status, COLORS.orange);
        } else {
            this.status.SetText(`${Math.floor(progressFraction(state) * 100)}% toward level ${state.level + 1}`);
            setTextColor(this.status, COLORS.gray);
        }
    }

    private text(template: string, point: WoWAPI.Point, x: number, y: number) {
        const text = this.frame.CreateFontString(undefined, 'OVERLAY', template);
        text.SetPoint(point, x, y);
        return text;
    }
}

/** The bamboo rod on top and the dragon relief behind, darkened toward the bottom where the bonuses are. */
function addBackground(frame: WoWAPI.Frame) {
    const bambooHalf = ATLAS.bamboo.height / 2;
    const backdrop = frame.CreateTexture(undefined, 'BACKGROUND');
    backdrop.SetTexture(BACKDROP_TEXTURE);
    const [r, g, b] = BACKDROP_SHADE;
    backdrop.SetVertexColor(r, g, b);
    backdrop.SetPoint('TOPLEFT', 0, -bambooHalf);
    backdrop.SetPoint('BOTTOMRIGHT');
    const shade = createShade(frame, 'BORDER', 'VERTICAL', 0.8, 0.25);
    shade.SetAllPoints(backdrop);
    const bamboo = createAtlasTexture(frame, ATLAS.bamboo, 'ARTWORK');
    bamboo.SetPoint('TOPLEFT');
    bamboo.SetPoint('TOPRIGHT');
}
