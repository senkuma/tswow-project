/**
 * Spell family bits of every Plague Doctor spell. A bit identifies one spell
 * (or rank chain) to talents, so bits are never shared or reused.
 */
export const FAMILY_BIT = {
    // Baseline abilities: Pestilence
    TOXIC_VIAL: 0,
    BLIGHT_INJECTION: 1,
    CONTAGION: 2,
    MIASMA: 3,
    PARALYTIC_TOXIN: 4,
    LEECH_THERAPY: 5,
    // Baseline abilities: Remedy and Alchemy
    RESTORATIVE_DRAUGHT: 6,
    HERBAL_TONIC: 7,
    RESTORATIVE_INJECTION: 8,
    PURIFYING_ANTIDOTE: 9,
    SMELLING_SALTS: 10,
    DISTILL_ESSENCE: 11,
    // Talent abilities
    PLAGUE_SWARM: 12,
    CHOKING_GAS: 13,
    BLACK_DEATH: 14,
    ALCHEMISTS_FIRE: 15,
    MERCURIAL_WARD: 16,
    PHILOSOPHERS_DRAUGHT: 17,
    ADRENAL_INJECTION: 18,
    HEALING_VAPORS: 19,
    PANACEA: 20,
    // Effects triggered by other spells
    FESTERING_BLIGHT: 21,
} as const;
