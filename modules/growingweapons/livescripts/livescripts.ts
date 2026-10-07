import { registerWeaponCommand } from "./WeaponCommand";
import { registerWeaponGrowth } from "./WeaponGrowth";

export function Main(events: TSEvents) {
    registerWeaponGrowth(events);
    registerWeaponCommand(events);
}
