import { WeaponState } from "../model/WeaponProgress";
import { showGrownStats } from "./TooltipStats";
import { PANEL_MIN_WIDTH, panelHeight, WeaponProgressPanel } from "./WeaponProgressPanel";

/** The tooltip script hooks, whose declarations in TSWoW's typings match no call. */
interface TooltipHooks {
    HookScript(script: 'OnTooltipSetItem' | 'OnTooltipCleared', handler: () => void): void;
}

/** Tooltips that show items: hovered, linked in chat, and the two comparison tooltips. */
const ITEM_TOOLTIPS = ['GameTooltip', 'ItemRefTooltip', 'ShoppingTooltip1', 'ShoppingTooltip2'];
// Tooltip lines sit 2px apart, and their text 10px in from the tooltip's edges.
const LINE_GAP = 2;
const TOOLTIP_PADDING = 10;
// Room below the panel before the tooltip's bottom edge.
const PANEL_MARGIN = 4;

interface AttachedPanel {
    tooltip: WoWAPI.GameTooltip;
    panel: WeaponProgressPanel;
    /** The growing weapon the panel shows, while it is shown. */
    item?: number;
}

/**
 * Shows the grown stats in the tooltip of every growing weapon the server has
 * reported, and adds its progress panel below them. Tooltips cannot hold
 * frames as lines, so blank lines reserve the panel's height and the panel is
 * laid over them.
 */
export class TooltipProgress {
    private readonly attached: AttachedPanel[] = [];

    constructor(private readonly stateOf: (item: number) => WeaponState | undefined) {
        ITEM_TOOLTIPS.forEach(name => {
            const tooltip: WoWAPI.GameTooltip | undefined = _G[name];
            if (tooltip !== undefined) {
                this.attach(tooltip);
            }
        });
    }

    /** Redraws shown tooltips of the weapon, e.g. after a kill while it is hovered. */
    refresh(state: WeaponState) {
        this.attached
            .filter(entry => entry.item === state.item)
            .forEach(entry => entry.panel.update(state));
    }

    private attach(tooltip: WoWAPI.GameTooltip) {
        const entry: AttachedPanel = { tooltip, panel: new WeaponProgressPanel(tooltip) };
        this.attached.push(entry);
        const hooks = tooltip as unknown as TooltipHooks;
        hooks.HookScript('OnTooltipSetItem', () => this.onSetItem(entry));
        hooks.HookScript('OnTooltipCleared', () => this.clear(entry));
        tooltip.HookScript('OnHide', () => this.clear(entry));
    }

    private onSetItem(entry: AttachedPanel) {
        const [, link] = entry.tooltip.GetItem();
        const item = link === undefined ? undefined : itemIdOf(link);
        // Some items (recipes) set the tooltip's item twice without clearing it.
        if (item === undefined || item === entry.item) {
            return;
        }
        const state = this.stateOf(item);
        if (state === undefined) {
            return;
        }
        showGrownStats(entry.tooltip, state);
        const firstLine = reservePanelSpace(entry.tooltip, panelHeight(state.bonuses.length));
        const frame = entry.panel.frame;
        frame.ClearAllPoints();
        frame.SetPoint('TOPLEFT', firstLine, 'TOPLEFT');
        frame.SetPoint('RIGHT', entry.tooltip, 'RIGHT', -TOOLTIP_PADDING, 0);
        entry.panel.show(state);
        entry.item = item;
    }

    private clear(entry: AttachedPanel) {
        if (entry.item !== undefined) {
            entry.panel.hide();
            entry.tooltip.SetMinimumWidth(0);
            entry.item = undefined;
        }
    }
}

function itemIdOf(link: string) {
    const [id] = strmatch(link, 'item:(%d+)');
    return id === undefined ? undefined : Number(id);
}

/** Adds blank lines as tall as the panel and widens the tooltip to fit it; returns the first line. */
function reservePanelSpace(tooltip: WoWAPI.GameTooltip, height: number): WoWAPI.FontString {
    const firstLine = tooltip.NumLines() + 1;
    tooltip.AddLine(' ');
    const anchor: WoWAPI.FontString = _G[`${tooltip.GetName()}TextLeft${firstLine}`];
    const [, fontHeight] = anchor.GetFont();
    const lines = Math.ceil((height + PANEL_MARGIN) / (fontHeight + LINE_GAP));
    for (let line = 1; line < lines; line++) {
        tooltip.AddLine(' ');
    }
    tooltip.SetMinimumWidth(PANEL_MIN_WIDTH + TOOLTIP_PADDING * 2);
    tooltip.Show();
    return anchor;
}
