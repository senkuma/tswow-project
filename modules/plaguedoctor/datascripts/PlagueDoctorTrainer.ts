import { createClassTrainer } from "classkit";
import { ALL_ABILITIES } from "./abilities/PlagueDoctorAbilities";
import { HUNTER_CLASS_ID, WARLOCK_CLASS_ID } from "./Constants";
import { PLAGUE_DOCTOR_CONTEXT } from "./PlagueDoctorClass";

// Jennea Cannon, the Stormwind mage trainer: a robed scholar.
const ROBED_MAGE_TRAINER = 5497;

// The other custom classes' trainers stand beside the priest, rogue, warrior and
// mage trainers. Hunter and warlock trainers together reach every race's
// starting zone, so every Plague Doctor finds a trainer where they begin.
export const PLAGUE_DOCTOR_TRAINER = createClassTrainer(PLAGUE_DOCTOR_CONTEXT, {
    id: 'plague-doctor-trainer',
    name: 'Doctor Ezra Morrow',
    subname: 'Plague Doctor Trainer',
    greeting: 'Every poison is a cure in the right dose, and every cure a poison in the wrong one.'
        + '  Which lesson will it be?',
    templateCreature: ROBED_MAGE_TRAINER,
    abilities: ALL_ABILITIES,
    spawnBesideTrainersOfClass: [HUNTER_CLASS_ID, WARLOCK_CLASS_ID],
});
