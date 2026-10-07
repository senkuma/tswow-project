import { registerWeaponCommand } from "./WeaponCommand";
import { registerWeaponGrowth } from "./WeaponGrowth";
import { registerWeaponMilestones } from "./WeaponMilestones";

export function Main(events: TSEvents) {
    registerWeaponGrowth(events);
    registerWeaponMilestones(events);
    registerWeaponCommand(events);
}
