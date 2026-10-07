import { createClassTrainer } from "classkit";
import { ALL_ABILITIES } from "./abilities/MarauderAbilities";
import { ROGUE_CLASS_ID } from "./Constants";
import { MARAUDER_CONTEXT } from "./MarauderClass";

// Ormok, the Orgrimmar rogue trainer: a scarred troll in leathers.
const ORGRIMMAR_ROGUE_TRAINER = 3328;

export const MARAUDER_TRAINER = createClassTrainer(MARAUDER_CONTEXT, {
    id: 'marauder-trainer',
    name: 'Kraz\'jin Bloodhook',
    subname: 'Marauder Trainer',
    greeting: 'Everything you take, you earn wit\' blood. Now, what you be wantin\' to learn?',
    templateCreature: ORGRIMMAR_ROGUE_TRAINER,
    abilities: ALL_ABILITIES,
    spawnBesideTrainersOfClass: ROGUE_CLASS_ID,
});
