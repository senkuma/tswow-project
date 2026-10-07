import { CHI_ART, CHI_TEXTURE, ChiPiece } from "./ChiArt";
import { registerEvents } from "./Events";

// Chi is the monk's combo points, which cap at five.
const MAX_CHI = 5;
const SLOT_GAP = 2;
// Under the player frame's health and energy bars, where the death knight's runes sit.
const OFFSET_X = 52;
const OFFSET_Y = 32;
const FLASH_SECONDS = 0.45;

// Target changes are left out: Chi stays the monk's, and the server moves it to their new target.
const CHI_EVENTS = ['UNIT_COMBO_POINTS', 'PLAYER_ENTERING_WORLD'];
// The vehicle UI replaces the player frame, and with it the player's Chi.
const VEHICLE_EVENTS = ['UNIT_ENTERED_VEHICLE', 'UNIT_EXITED_VEHICLE'];

declare function UnitHasVehicleUI(this: void, unit: string): boolean;

interface ChiSlot {
    active: WoWAPI.Texture;
    orb: WoWAPI.Texture;
    flash: WoWAPI.Texture;
    /** Seconds since the slot filled while its flash fades; undefined once faded. */
    flashTime?: number;
}

/**
 * The retail Monk Chi bar: five gold slots under the player frame, each
 * holding a jade orb per point of the monk's Chi, flashing as it fills.
 */
export class ChiBar {
    private readonly frame: WoWAPI.Frame;
    private readonly slots: ChiSlot[] = [];
    private lit = 0;
    private readonly changeListeners: (() => void)[] = [];

    constructor() {
        const width = MAX_CHI * CHI_ART.slot.width + (MAX_CHI - 1) * SLOT_GAP;
        const frame = CreateFrame('Frame', undefined, PlayerFrame);
        frame.SetSize(width, CHI_ART.slot.height);
        frame.SetPoint('TOP', PlayerFrame, 'BOTTOM', OFFSET_X, OFFSET_Y);
        for (let index = 0; index < MAX_CHI; index++) {
            this.slots.push(createSlot(frame, index * (CHI_ART.slot.width + SLOT_GAP)));
        }
        registerEvents(frame, [...CHI_EVENTS, ...VEHICLE_EVENTS]);
        frame.SetScript('OnEvent', (_, event) => {
            if (CHI_EVENTS.indexOf(event as string) >= 0) {
                this.showChi();
            } else {
                this.updateVisibility();
            }
        });
        frame.SetScript('OnUpdate', (_, elapsed) => this.fadeFlashes(elapsed));
        this.frame = frame;
        this.updateVisibility();
        this.showChi();
    }

    /** The monk's Chi, as last reported by the server. */
    get chi() {
        return this.lit;
    }

    /** Calls `listener` whenever the monk's Chi changes. */
    onChange(listener: () => void) {
        this.changeListeners.push(listener);
    }

    private updateVisibility() {
        if (UnitHasVehicleUI('player')) {
            this.frame.Hide();
        } else {
            this.frame.Show();
        }
    }

    /**
     * The server reports combo points as they change and when it moves them,
     * always onto the monk's enemy target or the monk, so one of them holds the Chi.
     */
    private showChi() {
        const chi = Math.max(GetComboPoints('player', 'target'), GetComboPoints('player', 'player'));
        this.slots.forEach((slot, index) => {
            const filled = index < chi;
            setShown(slot.active, filled);
            setShown(slot.orb, filled);
            if (filled && index >= this.lit) {
                slot.flashTime = 0;
                slot.flash.SetAlpha(1);
                slot.flash.Show();
            }
        });
        const changed = chi !== this.lit;
        this.lit = chi;
        if (changed) {
            this.changeListeners.forEach(listener => listener());
        }
    }

    private fadeFlashes(elapsed: number) {
        this.slots.forEach(slot => {
            if (slot.flashTime === undefined) {
                return;
            }
            slot.flashTime += elapsed;
            if (slot.flashTime >= FLASH_SECONDS) {
                slot.flashTime = undefined;
                slot.flash.Hide();
            } else {
                slot.flash.SetAlpha(1 - slot.flashTime / FLASH_SECONDS);
            }
        });
    }
}

function createSlot(frame: WoWAPI.Frame, x: number): ChiSlot {
    const slot = chiTexture(frame, CHI_ART.slot, 'BACKGROUND');
    slot.SetPoint('LEFT', x, 0);
    const active = chiTexture(frame, CHI_ART.slotActive, 'BORDER');
    active.SetPoint('CENTER', slot, 'CENTER');
    const orb = chiTexture(frame, CHI_ART.orb, 'ARTWORK');
    orb.SetPoint('CENTER', slot, 'CENTER');
    const flash = chiTexture(frame, CHI_ART.flash, 'OVERLAY');
    flash.SetPoint('CENTER', slot, 'CENTER');
    flash.SetBlendMode('ADD');
    active.Hide();
    orb.Hide();
    flash.Hide();
    return { active, orb, flash };
}

function chiTexture(frame: WoWAPI.Frame, piece: ChiPiece, layer: WoWAPI.Layer) {
    const texture = frame.CreateTexture(undefined, layer);
    texture.SetTexture(CHI_TEXTURE);
    texture.SetTexCoord(piece.left, piece.right, piece.top, piece.bottom);
    texture.SetSize(piece.width, piece.height);
    return texture;
}

function setShown(region: WoWAPI.Texture, shown: boolean) {
    if (shown) {
        region.Show();
    } else {
        region.Hide();
    }
}
