import { registerGearCommand } from "./GearCommand";

export function Main(events: TSEvents) {
    registerGearCommand(events);
}
