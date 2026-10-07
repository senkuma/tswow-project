import { COMMAND_SECTIONS, CommandButton } from "./CommandCatalog";

// A global name lets Escape close the window, through UISpecialFrames.
const FRAME_NAME = 'TSWoWCommandPanel';
const WIDTH = 380;
const PADDING = 20;
const TOP_OFFSET = 34;
const HEADER_HEIGHT = 18;
const SECTION_GAP = 10;
const COLUMNS = 2;
const COLUMN_GAP = 8;
const ROW_GAP = 4;
const BUTTON_HEIGHT = 22;
const BUTTON_WIDTH = (WIDTH - PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;
const AMOUNT_WIDTH = 56;
const AMOUNT_GAP = 8;
const COMMAND_COLOR = '|cff9d9d9d';
const DISABLED_COLOR = '|cffff6060';

// UnitClass returns several values, but its declaration types them as an array.
const unitClass = UnitClass as unknown as (unit: string) => LuaMultiReturn<[string, string, number]>;

/**
 * A window with a button for each command the server's modules add, grouped
 * by module. Buttons type their command into chat, as if typed by hand.
 */
export class CommandPanel {
    private readonly frame: WoWAPI.Frame;

    constructor() {
        const frame = CreateFrame('Frame', FRAME_NAME, UIParent);
        frame.SetPoint('CENTER');
        frame.SetFrameStrata('DIALOG');
        frame.SetBackdrop({
            bgFile: 'Interface\\DialogFrame\\UI-DialogBox-Background',
            edgeFile: 'Interface\\DialogFrame\\UI-DialogBox-Border',
            tile: true,
            tileSize: 32,
            edgeSize: 32,
            insets: { left: 11, right: 12, top: 12, bottom: 11 },
        });
        frame.SetMovable(true);
        frame.EnableMouse(true);
        frame.SetClampedToScreen(true);
        frame.RegisterForDrag('LeftButton');
        frame.SetScript('OnDragStart', () => frame.StartMoving());
        frame.SetScript('OnDragStop', () => frame.StopMovingOrSizing());
        frame.Hide();
        (_G['UISpecialFrames'] as string[]).push(FRAME_NAME);
        this.frame = frame;

        addTitle(frame, 'Commands');
        const close = CreateFrame('Button', undefined, frame, 'UIPanelCloseButton');
        close.SetPoint('TOPRIGHT', -4, -4);

        const [, playerClass] = unitClass('player');
        let top = TOP_OFFSET;
        COMMAND_SECTIONS.forEach(section => {
            const header = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
            header.SetPoint('TOPLEFT', PADDING, -top);
            header.SetText(section.title);
            top += HEADER_HEIGHT;
            section.buttons.forEach((command, index) => {
                const x = PADDING + (index % COLUMNS) * (BUTTON_WIDTH + COLUMN_GAP);
                const y = top + Math.floor(index / COLUMNS) * (BUTTON_HEIGHT + ROW_GAP);
                addCommandButton(frame, command, x, y, playerClass);
            });
            top += Math.ceil(section.buttons.length / COLUMNS) * (BUTTON_HEIGHT + ROW_GAP) + SECTION_GAP;
        });
        frame.SetSize(WIDTH, top + PADDING - SECTION_GAP);
    }

    toggle() {
        if (this.frame.IsShown()) {
            this.frame.Hide();
        } else {
            this.frame.Show();
        }
    }
}

function addTitle(frame: WoWAPI.Frame, text: string) {
    const banner = frame.CreateTexture(undefined, 'ARTWORK');
    banner.SetTexture('Interface\\DialogFrame\\UI-DialogBox-Header');
    banner.SetSize(256, 64);
    banner.SetPoint('TOP', 0, 12);
    const title = frame.CreateFontString(undefined, 'OVERLAY', 'GameFontNormal');
    title.SetPoint('TOP', banner, 'TOP', 0, -14);
    title.SetText(text);
}

function addCommandButton(frame: WoWAPI.Frame, command: CommandButton, x: number, y: number, playerClass: string) {
    const button = CreateFrame('Button', undefined, frame, 'UIPanelButtonTemplate');
    const width = command.amount === undefined ? BUTTON_WIDTH : BUTTON_WIDTH - AMOUNT_WIDTH - AMOUNT_GAP;
    button.SetSize(width, BUTTON_HEIGHT);
    button.SetPoint('TOPLEFT', x, -y);
    button.SetText(command.label);

    const available = command.classes === undefined || command.classes.indexOf(playerClass) >= 0;
    if (!available) {
        button.Disable();
    }
    // Disabled buttons get no mouse events, so a cover over the button shows its tooltip.
    const hoverArea = CreateFrame('Frame', undefined, frame);
    hoverArea.SetAllPoints(button);
    hoverArea.SetFrameLevel(button.GetFrameLevel() + 1);
    hoverArea.EnableMouse(!available);
    const showTooltip = (owner: WoWAPI.Frame) => {
        GameTooltip.SetOwner(owner, 'ANCHOR_RIGHT');
        GameTooltip.AddLine(command.label, 1, 1, 1);
        GameTooltip.AddLine(command.description, 1, 0.82, 0, true);
        GameTooltip.AddLine(`${COMMAND_COLOR}${command.command}${command.amount === undefined ? '' : ' <amount>'}|r`);
        if (!available) {
            GameTooltip.AddLine(`${DISABLED_COLOR}Not available to your class.|r`);
        }
        GameTooltip.Show();
    };
    button.SetScript('OnEnter', () => showTooltip(button));
    button.SetScript('OnLeave', () => GameTooltip.Hide());
    hoverArea.SetScript('OnEnter', () => showTooltip(hoverArea));
    hoverArea.SetScript('OnLeave', () => GameTooltip.Hide());

    const amountBox = command.amount === undefined ? undefined : addAmountBox(frame, button, command.amount.default);
    button.SetScript('OnClick', () => {
        if (command.run !== undefined) {
            command.run();
        } else {
            const amount = amountBox === undefined ? '' : ` ${amountOf(amountBox, command.amount!.default)}`;
            SendChatMessage(`${command.command}${amount}`, 'SAY');
        }
    });
}

function addAmountBox(frame: WoWAPI.Frame, button: WoWAPI.Button, initial: number) {
    const box = CreateFrame('EditBox', undefined, frame, 'InputBoxTemplate');
    box.SetSize(AMOUNT_WIDTH, BUTTON_HEIGHT);
    // The template's border reaches a few pixels left of the box.
    box.SetPoint('LEFT', button, 'RIGHT', AMOUNT_GAP, 0);
    box.SetAutoFocus(false);
    box.SetNumeric();
    box.SetText(`${initial}`);
    box.SetScript('OnEnterPressed', () => box.ClearFocus());
    box.SetScript('OnEscapePressed', () => box.ClearFocus());
    return box;
}

/** The box's whole positive number; an empty or zero box falls back to the default and shows it. */
function amountOf(box: WoWAPI.EditBox, fallback: number) {
    const amount = Number(box.GetText());
    if (amount > 0) {
        return amount;
    }
    box.SetText(`${fallback}`);
    return fallback;
}
