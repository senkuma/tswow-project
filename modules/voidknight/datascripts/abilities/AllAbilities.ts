import { RankedAbility } from "classkit";
import { ASPECTS } from "./Aspects";
import { BULWARK_ABILITIES } from "./BulwarkAbilities";
import { GRAVITY_ABILITIES } from "./GravityAbilities";
import { RIFT_ABILITIES } from "./RiftAbilities";

/** Every ability a Void Knight can learn; the trainer sells all ranks not learned elsewhere. */
export const ALL_ABILITIES: RankedAbility[] = [
    ...GRAVITY_ABILITIES, ...RIFT_ABILITIES, ...BULWARK_ABILITIES, ...ASPECTS,
];
