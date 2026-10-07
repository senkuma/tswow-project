import { Details, DetailsCombat } from "./DetailsTypes";

/** DetailsFramework's specialization helpers (global DetailsFramework). */
interface DetailsFramework {
    GetSpecializationInfo(this: void, index: number): number | undefined;
}

const ACTOR_CONTAINERS = [1, 2, 3, 4];

/**
 * DetailsFramework maps a class's talent tree to a retail specialization id,
 * and answers 0 for classes it has no ids for (the custom ones) or players
 * with no talents. Details stores that 0 as the player's specialization and
 * then fails looking up its icon; nothing makes it fall back to the class
 * icon, which an unknown specialization does.
 */
export function wrapSpecializationInfo(framework: DetailsFramework) {
    const getSpecializationInfo = framework.GetSpecializationInfo;
    framework.GetSpecializationInfo = index => {
        const specId = getSpecializationInfo(index);
        return specId === 0 ? undefined : specId;
    };
}

/** Clears specializations without an icon from saved combats and the spec cache, so Details shows class icons. */
export function forgetUnknownSpecs(details: Details) {
    const icons = details.class_specs_coords;
    if (icons === undefined) {
        return;
    }
    const combats: (DetailsCombat | undefined)[] = [details.tabela_vigente, details.tabela_overall];
    (details.tabela_historico?.tabelas ?? []).forEach(combat => combats.push(combat));
    combats.forEach(combat => ACTOR_CONTAINERS.forEach(index => {
        (combat?.[index]?._ActorTable ?? []).forEach(actor => {
            if (actor.spec !== undefined && icons[actor.spec] === undefined) {
                actor.spec = undefined;
            }
        });
    }));
    const cached = details.cached_specs ?? {};
    Object.keys(cached).forEach(guid => {
        if (icons[cached[guid]] === undefined) {
            delete cached[guid];
        }
    });
}
