import { replaceStartingItem, setStartingActionBar } from "classkit";
import { ASPECT_OF_GRAVITY } from "./abilities/Aspects";
import { VOID_STRIKE } from "./abilities/GravityAbilities";
import { ATTACK_SPELL } from "./Constants";
import { VOID_KNIGHT_CONTEXT } from "./VoidKnightClass";

// Same stats as the two-handers warriors of some races start with.
const WORN_GREATSWORD = 49778;

// Void Knights fight two-handed from the start: the warrior's one-handers,
// shield and throwing weapons go.
replaceStartingItem(VOID_KNIGHT_CONTEXT, 'WEAPON');
replaceStartingItem(VOID_KNIGHT_CONTEXT, 'SHIELD');
replaceStartingItem(VOID_KNIGHT_CONTEXT, 'THROWN');
replaceStartingItem(VOID_KNIGHT_CONTEXT, 'TWOHAND', WORN_GREATSWORD);
setStartingActionBar(VOID_KNIGHT_CONTEXT, [ATTACK_SPELL, VOID_STRIKE.firstRank.ID, ASPECT_OF_GRAVITY.firstRank.ID]);
