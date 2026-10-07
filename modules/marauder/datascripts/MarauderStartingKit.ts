import { replaceStartingItem, setStartingActionBar } from "classkit";
import { RANSACK, SAVAGE_STRIKE } from "./abilities/MarauderAbilities";
import { ATTACK_SPELL } from "./Constants";
import { MARAUDER_CONTEXT } from "./MarauderClass";

const WORN_AXE = 37;                  // main hand
const INFERIOR_TOMAHAWK = 2482;       // one-hand, so it fits the off hand
const CRUDE_THROWING_AXE = 25861;

// Replaces the rogue's dagger and throwing knives; Dual Wield is known from the start.
replaceStartingItem(MARAUDER_CONTEXT, 'WEAPON', WORN_AXE, INFERIOR_TOMAHAWK);
replaceStartingItem(MARAUDER_CONTEXT, 'THROWN', CRUDE_THROWING_AXE);
setStartingActionBar(MARAUDER_CONTEXT, [ATTACK_SPELL, SAVAGE_STRIKE.firstRank.ID, RANSACK.firstRank.ID]);
