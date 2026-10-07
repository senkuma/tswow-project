import { registerGearCommand } from "./GearCommand";
import { registerHeroTalents } from "./hero/HeroTalents";

export function Main(events: TSEvents) {
    registerGearCommand(events);
    registerHeroTalents(events);
}
