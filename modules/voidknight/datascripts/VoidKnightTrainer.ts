import { createClassTrainer } from "classkit";
import { ALL_ABILITIES } from "./abilities/AllAbilities";
import { PALADIN_CLASS_ID, WARRIOR_CLASS_ID } from "./Constants";
import { VOID_KNIGHT_CONTEXT } from "./VoidKnightClass";

// Lord Thorval, a death knight trainer of Acherus in dark runed plate.
const ACHERUS_TRAINER = 28472;

// Warrior trainers reach every race's starting zone but the blood elves', whose
// paladin trainers fill the gap. The Mountain King's trainers already stand to
// the right of warrior trainers, so these stand to the left.
export const VOID_KNIGHT_TRAINER = createClassTrainer(VOID_KNIGHT_CONTEXT, {
    id: 'void-knight-trainer',
    name: 'Vaelin Starhollow',
    subname: 'Void Knight Trainer',
    greeting: 'Between one star and the next lies an emptiness that remembers everything.'
        + '  Learn to hold it, and it will hold for you.',
    templateCreature: ACHERUS_TRAINER,
    abilities: ALL_ABILITIES,
    spawnBesideTrainersOfClass: [WARRIOR_CLASS_ID, PALADIN_CLASS_ID],
    spawnSide: 'left',
});
