import { createClassTrainer } from "classkit";
import { ALL_ABILITIES } from "./abilities/MountainKingAbilities";
import { WARRIOR_CLASS_ID } from "./Constants";
import { MOUNTAIN_KING_CONTEXT } from "./MountainKingClass";

// Kelv Sternhammer, the Ironforge warrior trainer: a dwarf in plate.
const IRONFORGE_WARRIOR_TRAINER = 5113;

export const MOUNTAIN_KING_TRAINER = createClassTrainer(MOUNTAIN_KING_CONTEXT, {
    id: 'mountain-king-trainer',
    name: 'Thane Brannoc Stormhelm',
    subname: 'Mountain King Trainer',
    greeting: 'Steady yer hammer, lad. The mountain doesnae teach the impatient.',
    templateCreature: IRONFORGE_WARRIOR_TRAINER,
    abilities: ALL_ABILITIES,
    spawnBesideTrainersOfClass: WARRIOR_CLASS_ID,
});
