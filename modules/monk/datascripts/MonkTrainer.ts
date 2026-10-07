import { createClassTrainer } from "classkit";
import { MIST_ABILITIES } from "./abilities/MistAbilities";
import { CORE_ABILITIES } from "./abilities/MonkAbilities";
import { PRIEST_CLASS_ID } from "./Constants";
import { MONK_CONTEXT } from "./MonkClass";

// Brother Joshua, a priest trainer in plain robes; the Marauder and Mountain
// King trainers already stand beside the rogue and warrior trainers.
const ROBED_PRIEST_TRAINER = 5489;

export const MONK_TRAINER = createClassTrainer(MONK_CONTEXT, {
    id: 'monk-trainer',
    name: 'Master Hai Shan',
    subname: 'Monk Trainer',
    greeting: 'The tiger strikes, the ox endures, the serpent mends. Which lesson have you come for today?',
    templateCreature: ROBED_PRIEST_TRAINER,
    abilities: [...CORE_ABILITIES, ...MIST_ABILITIES],
    spawnBesideTrainersOfClass: PRIEST_CLASS_ID,
});
