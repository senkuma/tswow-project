const ICON = 'Interface\\Icons\\INV_Misc_Book_11';
const SIZE = 31;
// Bottom left of the minimap, clear of the default buttons; degrees counterclockwise from the right.
const ANGLE = 225;
const RADIUS = 80;

/** A round button on the minimap's edge, laid out like Blizzard's tracking button. */
export function createMinimapButton(tooltip: string, onClick: () => void) {
    const button = CreateFrame('Button', undefined, Minimap);
    button.SetSize(SIZE, SIZE);
    button.SetFrameStrata('MEDIUM');
    button.SetFrameLevel(8);
    const radians = ANGLE * Math.PI / 180;
    button.SetPoint('CENTER', Minimap, 'CENTER', RADIUS * Math.cos(radians), RADIUS * Math.sin(radians));
    button.SetHighlightTexture('Interface\\Minimap\\UI-Minimap-ZoomButton-Highlight');

    const background = button.CreateTexture(undefined, 'BACKGROUND');
    background.SetTexture('Interface\\Minimap\\UI-Minimap-Background');
    background.SetSize(20, 20);
    background.SetPoint('TOPLEFT', 7, -5);
    const icon = button.CreateTexture(undefined, 'ARTWORK');
    icon.SetTexture(ICON);
    icon.SetSize(17, 17);
    icon.SetPoint('TOPLEFT', 7, -6);
    const border = button.CreateTexture(undefined, 'OVERLAY');
    border.SetTexture('Interface\\Minimap\\MiniMap-TrackingBorder');
    border.SetSize(53, 53);
    border.SetPoint('TOPLEFT');

    button.SetScript('OnClick', onClick);
    button.SetScript('OnEnter', () => {
        GameTooltip.SetOwner(button, 'ANCHOR_LEFT');
        GameTooltip.AddLine(tooltip, 1, 1, 1);
        GameTooltip.Show();
    });
    button.SetScript('OnLeave', () => GameTooltip.Hide());
    return button;
}
