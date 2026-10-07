import { replaceStartingItem, setStartingActionBar } from "classkit";
import { HAMMER_BLOW } from "./abilities/MountainKingAbilities";
import { ATTACK_SPELL } from "./Constants";
import { MOUNTAIN_KING_CONTEXT } from "./MountainKingClass";

// Same stats as the Worn Battleaxe dwarven warriors start with.
const BATTLEWORN_HAMMER_ITEM = 2361;

replaceStartingItem(MOUNTAIN_KING_CONTEXT, 'TWOHAND', BATTLEWORN_HAMMER_ITEM);
setStartingActionBar(MOUNTAIN_KING_CONTEXT, [ATTACK_SPELL, HAMMER_BLOW.firstRank.ID]);
