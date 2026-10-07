import { replaceStartingItem, setStartingActionBar } from "classkit";
import { RESTORATIVE_DRAUGHT, TOXIC_VIAL } from "./abilities/PlagueDoctorAbilities";
import { ATTACK_SPELL } from "./Constants";
import { PLAGUE_DOCTOR_CONTEXT } from "./PlagueDoctorClass";

// The mage's starting staff: a doctor's walking cane.
const BENT_STAFF = 35;

// Druids start with a one-handed mace or a two-handed staff depending on race.
replaceStartingItem(PLAGUE_DOCTOR_CONTEXT, 'WEAPON');
replaceStartingItem(PLAGUE_DOCTOR_CONTEXT, 'TWOHAND', BENT_STAFF);
setStartingActionBar(PLAGUE_DOCTOR_CONTEXT, [
    ATTACK_SPELL, TOXIC_VIAL.firstRank.ID, RESTORATIVE_DRAUGHT.firstRank.ID,
]);
