/** A Details combat segment: actor containers 1-4 (damage, healing, energy, misc). */
export interface DetailsCombat {
    [container: number]: { _ActorTable?: DetailsActor[] } | undefined;
}

export interface DetailsActor {
    /** A retail specialization id, which Details looks up in class_specs_coords. */
    spec?: number;
}

/** The parts of Details' global object (_detalhes) this addon reads and fills in. */
export interface Details {
    class_colors?: { [className: string]: number[] };
    class_coords?: { [key: string]: number[] };
    class_specs_coords?: { [specId: number]: number[] };
    cached_specs?: { [guid: string]: number };
    tabela_vigente?: DetailsCombat;
    tabela_overall?: DetailsCombat;
    tabela_historico?: { tabelas?: DetailsCombat[] };
}
