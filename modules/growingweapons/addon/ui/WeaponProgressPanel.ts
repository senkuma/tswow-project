import { isHeldAtCap, isMaxLevel, progressFraction, WeaponMilestone, WeaponState } from "../model/WeaponProgress";
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
// The awakenings section follows the bonuses' last row with the same divider, header and row spacing.
const SECTION_GAP = 4;
const SECTION_HEADER_TOP = BONUS_HEADER_TOP - DIVIDER_TOP;
const SECTION_FIRST_ROW_TOP = BONUS_FIRST_TOP - DIVIDER_TOP;
const AWAKENING_ROW_HEIGHT = 15;
const AWAKENING_ICON_SIZE = 13;
const AWAKENING_ICON_GAP = 4;
// Trims the bevelled border every spell icon has.
const ICON_INSET = 0.07;

function bonusesHeight(bonusCount: number) {
    return BONUS_FIRST_TOP + bonusCount * BONUS_ROW_HEIGHT;
}

function awakeningsHeight(milestoneCount: number) {
    return milestoneCount === 0 ? 0 : SECTION_GAP + SECTION_FIRST_ROW_TOP + milestoneCount * AWAKENING_ROW_HEIGHT;
}

/** The panel's height with a row for each of `bonusCount` bonuses and `milestoneCount` milestones. */
export function panelHeight(bonusCount: number, milestoneCount: number) {
    return bonusesHeight(bonusCount) + awakeningsHeight(milestoneCount) + BOTTOM_PADDING;
}

interface BonusRow {
    total: WoWAPI.FontString;
    next: WoWAPI.FontString;
}

interface AwakeningRow {
    icon: WoWAPI.Texture;
    name: WoWAPI.FontString;
    level: WoWAPI.FontString;
}

/**
 * A weapon's level and experience in retail artifact style: a gold glass
 * badge with the level, the experience bar in artifact power gold, the
 * bonuses with what the next level adds and the milestone passives
 * ("awakenings"), lit once unlocked, over the Monk artifact backdrop.
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
    /** The milestones' section, moved below however many bonus rows the shown weapon has. */
    private readonly awakenings: WoWAPI.Frame;
    private readonly awakeningRows: AwakeningRow[] = [];

    constructor(parent: WoWAPI.Frame) {
        const frame = CreateFrame('Frame', undefined, parent);
        frame.SetSize(PANEL_MIN_WIDTH, panelHeight(0, 0));
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

        this.awakenings = CreateFrame('Frame', undefined, frame);
        const awakeningsDivider = createAtlasTexture(this.awakenings, ATLAS.goldLine, 'ARTWORK');
        awakeningsDivider.SetWidth(DIVIDER_WIDTH);
        awakeningsDivider.SetPoint('TOP', 0, -SECTION_GAP);
        const awakeningsHeader = this.awakenings.CreateFontString(undefined, 'OVERLAY', 'GameFontNormalSmall');
        awakeningsHeader.SetPoint('TOPLEFT', SIDE_MARGIN, -(SECTION_GAP + SECTION_HEADER_TOP));
        awakeningsHeader.SetText('Awakenings');
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
        this.frame.SetHeight(panelHeight(state.bonuses.length, state.milestones.length));
        // Frames cannot be destroyed, so rows are made as needed and kept for later weapons.
        while (this.bonusRows.length < state.bonuses.length) {
            this.bonusRows.push(this.createBonusRow(this.bonusRows.length));
        }
        this.bonusRows.forEach((row, index) => {
            const bonus = state.bonuses[index];
            row.total.SetText(bonus === undefined ? '' : formatBonus(bonus.amount, bonus.label));
            row.next.SetText(bonus === undefined || bonus.next === undefined ? '' : `+${formatNumber(bonus.next - bonus.amount)}`);
        });
        this.updateAwakenings(state);
    }

    private createBonusRow(index: number): BonusRow {
        const top = -(BONUS_FIRST_TOP + index * BONUS_ROW_HEIGHT);
        const next = this.text('GameFontHighlightSmall', 'TOPRIGHT', -SIDE_MARGIN, top);
        setTextColor(next, COLORS.green);
        return { total: this.text('GameFontHighlightSmall', 'TOPLEFT', SIDE_MARGIN, top), next };
    }

    private updateAwakenings(state: WeaponState) {
        const count = state.milestones.length;
        if (count === 0) {
            this.awakenings.Hide();
            return;
        }
        const top = bonusesHeight(state.bonuses.length);
        this.awakenings.ClearAllPoints();
        this.awakenings.SetPoint('TOPLEFT', 0, -top);
        this.awakenings.SetPoint('TOPRIGHT', 0, -top);
        this.awakenings.SetHeight(awakeningsHeight(count));
        this.awakenings.Show();
        while (this.awakeningRows.length < count) {
            this.awakeningRows.push(this.createAwakeningRow(this.awakeningRows.length));
        }
        this.awakeningRows.forEach((row, index) => showAwakening(row, state.milestones[index]));
    }

    /** An icon with the passive's name beside it, and on the right the level that unlocks it. */
    private createAwakeningRow(index: number): AwakeningRow {
        const top = SECTION_GAP + SECTION_FIRST_ROW_TOP + index * AWAKENING_ROW_HEIGHT;
        const icon = this.awakenings.CreateTexture(undefined, 'ARTWORK');
        icon.SetSize(AWAKENING_ICON_SIZE, AWAKENING_ICON_SIZE);
        icon.SetTexCoord(ICON_INSET, 1 - ICON_INSET, ICON_INSET, 1 - ICON_INSET);
        icon.SetPoint('TOPLEFT', SIDE_MARGIN, -top);
        const name = this.awakenings.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightSmall');
        name.SetPoint('LEFT', icon, 'RIGHT', AWAKENING_ICON_GAP, 0);
        const level = this.awakenings.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightSmall');
        level.SetPoint('RIGHT', this.awakenings, 'TOPRIGHT', -SIDE_MARGIN, -(top + AWAKENING_ICON_SIZE / 2));
        return { icon, name, level };
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

/** Fills a row with a milestone, lit once unlocked; hides it when the weapon has fewer milestones than rows. */
function showAwakening(row: AwakeningRow, milestone: WeaponMilestone | undefined) {
    const parts = [row.icon, row.name, row.level];
    if (milestone === undefined) {
        parts.forEach(part => part.Hide());
        return;
    }
    row.icon.SetTexture(milestone.icon);
    row.icon.SetDesaturated(milestone.unlocked ? 0 : 1);
    row.name.SetText(milestone.name);
    row.level.SetText(`Level ${milestone.level}`);
    const color = milestone.unlocked ? COLORS.artifact : COLORS.gray;
    setTextColor(row.name, color);
    setTextColor(row.level, color);
    parts.forEach(part => part.Show());
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
