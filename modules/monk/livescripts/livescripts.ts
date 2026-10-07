import { registerChiAbilities } from "./ChiAbilities";
import { registerGearCommand } from "./GearCommand";
import { registerMistHealing } from "./MistHealing";
import { registerPersonalChi } from "./PersonalChi";
import { registerSoothingMist } from "./SoothingMist";

export function Main(events: TSEvents) {
    registerGearCommand(events);
    registerPersonalChi(events);
    registerChiAbilities(events);
    registerMistHealing(events);
    registerSoothingMist(events);
}
