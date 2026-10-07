/** Frame:RegisterEvent for events TSWoW's declarations leave out, such as UNIT_COMBO_POINTS. */
interface AnyEventFrame {
    RegisterEvent(event: string): void;
}

export function registerEvents(frame: WoWAPI.Frame, events: string[]) {
    events.forEach(event => (frame as unknown as AnyEventFrame).RegisterEvent(event));
}
