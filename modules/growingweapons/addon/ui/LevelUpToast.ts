import { WeaponLevelUp } from "../model/WeaponProgress";
import { createAtlasTexture, createShade } from "./AtlasTexture";
import { COLORS, formatBonus, setTextColor } from "./Format";
import { ATLAS } from "./WeaponArt";

const WIDTH = 440;
const HEIGHT = 74;
const TOP_OFFSET = -170;
const LINE_WIDTH = 400;
const GLOW_WIDTH = 260;
const TITLE_FONT_SIZE = 26;
const BAND_ALPHA = 0.75;
const LEVEL_UP_SOUND = 'Sound\\Interface\\LevelUp.wav';

const FADE_IN_SECONDS = 0.3;
const HOLD_SECONDS = 4;
const FADE_OUT_SECONDS = 1.2;

/**
 * The retail level-up banner for a weapon: a dark band between two gold
 * lines with a green glow rising from the bottom one, the weapon's name, its
 * new level and what the level added. A newer level up replaces a shown one.
 */
export class LevelUpToast {
    private readonly frame: WoWAPI.Frame;
    private readonly weaponName: WoWAPI.FontString;
    private readonly title: WoWAPI.FontString;
    private readonly gains: WoWAPI.FontString;
    private elapsed = 0;

    constructor() {
        const frame = CreateFrame('Frame', undefined, UIParent);
        frame.SetSize(WIDTH, HEIGHT);
        frame.SetPoint('TOP', 0, TOP_OFFSET);
        frame.SetFrameStrata('HIGH');
        frame.Hide();
        this.frame = frame;
        addBanner(frame);

        this.weaponName = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
        this.weaponName.SetPoint('TOP', 0, -10);
        setTextColor(this.weaponName, COLORS.artifact);
        this.title = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightLarge');
        const [font] = this.title.GetFont();
        this.title.SetFont(font, TITLE_FONT_SIZE, 'OUTLINE');
        this.title.SetPoint('TOP', this.weaponName, 'BOTTOM', 0, -4);
        this.gains = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontHighlightSmall');
        this.gains.SetPoint('TOP', this.title, 'BOTTOM', 0, -4);
        setTextColor(this.gains, COLORS.green);

        frame.SetScript('OnUpdate', (_, elapsed) => this.animate(elapsed));
    }

    show(levelUp: WeaponLevelUp) {
        const [name] = GetItemInfo(levelUp.item);
        this.weaponName.SetText(name ?? 'Your weapon');
        this.title.SetText(`Level ${levelUp.level}`);
        this.gains.SetText(levelUp.gains
            .filter(gain => gain.amount > 0)
            .map(gain => formatBonus(gain.amount, gain.label))
            .join('   '));
        this.elapsed = 0;
        this.frame.SetAlpha(0);
        this.frame.Show();
        PlaySoundFile(LEVEL_UP_SOUND);
    }

    private animate(elapsed: number) {
        this.elapsed += elapsed;
        const fadeOutStart = FADE_IN_SECONDS + HOLD_SECONDS;
        if (this.elapsed < FADE_IN_SECONDS) {
            this.frame.SetAlpha(this.elapsed / FADE_IN_SECONDS);
        } else if (this.elapsed < fadeOutStart) {
            this.frame.SetAlpha(1);
        } else if (this.elapsed < fadeOutStart + FADE_OUT_SECONDS) {
            this.frame.SetAlpha(1 - (this.elapsed - fadeOutStart) / FADE_OUT_SECONDS);
        } else {
            this.frame.Hide();
        }
    }
}

function addBanner(frame: WoWAPI.Frame) {
    // The band fades out to both sides from the middle.
    const left = createShade(frame, 'BACKGROUND', 'HORIZONTAL', 0, BAND_ALPHA);
    left.SetPoint('TOPLEFT');
    left.SetPoint('BOTTOMRIGHT', frame, 'BOTTOM');
    const right = createShade(frame, 'BACKGROUND', 'HORIZONTAL', BAND_ALPHA, 0);
    right.SetPoint('TOPLEFT', frame, 'TOP');
    right.SetPoint('BOTTOMRIGHT');

    const glow = createAtlasTexture(frame, ATLAS.glow, 'BORDER');
    glow.SetSize(GLOW_WIDTH, HEIGHT);
    glow.SetBlendMode('ADD');
    glow.SetPoint('BOTTOM');

    const top = createAtlasTexture(frame, ATLAS.goldLine, 'ARTWORK');
    top.SetWidth(LINE_WIDTH);
    top.SetPoint('TOP');
    const bottom = createAtlasTexture(frame, ATLAS.goldLine, 'ARTWORK');
    bottom.SetWidth(LINE_WIDTH);
    bottom.SetPoint('BOTTOM');
}
