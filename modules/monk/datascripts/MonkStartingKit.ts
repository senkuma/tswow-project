import { createClassItem, replaceStartingItem, setStartingActionBar } from "classkit";
import { JAB, STANCE_OF_THE_FIERCE_TIGER, TIGER_PALM } from "./abilities/MonkAbilities";
import { ATTACK_SPELL } from "./Constants";
import { MONK_CONTEXT } from "./MonkClass";

// Players get no fist weapons before level 10, so the monk's first pair is
// the rogue's Worn Dagger made into a fist weapon with a brass knuckle look.
const WORN_DAGGER = 2092;
const BRASS_KNUCKLES_DISPLAY = 26592;

const INITIATES_KNUCKLES = createClassItem(MONK_CONTEXT, {
    id: 'initiates-knuckles',
    parent: WORN_DAGGER,
    name: 'Initiate\'s Knuckles',
    display: BRASS_KNUCKLES_DISPLAY,
}).Class.FIST_WEAPON.set();

// One for each hand, replacing the rogue's dagger; monks throw nothing.
replaceStartingItem(MONK_CONTEXT, 'WEAPON', INITIATES_KNUCKLES.ID, INITIATES_KNUCKLES.ID);
replaceStartingItem(MONK_CONTEXT, 'THROWN');
setStartingActionBar(MONK_CONTEXT, [
    ATTACK_SPELL, JAB.firstRank.ID, TIGER_PALM.firstRank.ID, STANCE_OF_THE_FIERCE_TIGER.firstRank.ID,
]);
