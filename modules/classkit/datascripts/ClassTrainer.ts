import { std } from "wow/wotlk";
import { creatureRow } from "wow/wotlk/sql/creature";
import { FactionTemplateValues } from "wow/wotlk/std/Faction/FactionTemplates";
import { ClassContext } from "./ClassContext";
import { RankedAbility } from "./RankedAbility";

const CLASS_TRAINER_TYPE = 0;
/** Grows with level like WotLK class training: 10 copper at level 1, about 6.4 gold at 80. */
const TRAINING_COST_FACTOR = 10;
// Distance to the right of each existing trainer, close enough to share its floor.
const SPAWN_OFFSET_YARDS = 1.5;

export interface ClassTrainerDefinition {
    id: string;
    name: string;
    subname: string;
    greeting: string;
    /** Creature whose model and NPC flags are copied; its trainer list is not. */
    templateCreature: number;
    abilities: RankedAbility[];
    /** A trainer is spawned beside every existing trainer of this class, starting zones included. */
    spawnBesideTrainersOfClass: number;
}

export function createClassTrainer(context: ClassContext, definition: ClassTrainerDefinition) {
    const trainer = std.CreatureTemplates
        .create(context.module, definition.id, definition.templateCreature)
        .Name.enGB.set(definition.name)
        .Subname.enGB.set(definition.subname)
        .FactionTemplate.set(FactionTemplateValues.NEUTRAL_PASSIVE)
        // The template's SmartAI script and gossip menu only offer training to its own class.
        .AIName.set('')
        .Gossip.set(0)
        .Trainer.modRef(trainerList => {
            trainerList
                .RequirementType.CLASS.set()
                .RequiredClass.set(context.cls.ID)
                .Greeting.enGB.set(definition.greeting);
            definition.abilities.forEach(ability => ability.trainerRanks.forEach(rank => {
                const level = rank.Levels.Spell.get();
                const previousRank = ability.previousRankOf(rank);
                trainerList.Spells.add(rank.ID, TRAINING_COST_FACTOR * level * level, level, 0, 0,
                    previousRank ? [previousRank.ID] : []);
            }));
        });

    trainerSpawnsOfClass(definition.spawnBesideTrainersOfClass).forEach(existing => trainer.Spawns.addMod(
        context.module,
        `${definition.id}-beside-${existing.guid.get()}`,
        besideOf(existing),
        spawn => spawn.PhaseMask.set(existing.phaseMask.get())));

    return trainer;
}

function trainerSpawnsOfClass(classId: number) {
    const trainerLists = new Set(std.SQL.trainer
        .queryAll({ Type: CLASS_TRAINER_TYPE, Requirement: classId })
        .map(trainer => trainer.Id.get()));

    return std.SQL.creature_default_trainer.queryAll({})
        .filter(link => trainerLists.has(link.TrainerId.get()))
        .reduce<creatureRow[]>((spawns, link) =>
            spawns.concat(std.SQL.creature.queryAll({ id: link.CreatureId.get() })), []);
}

function besideOf(spawn: creatureRow) {
    const rightOfFacing = spawn.orientation.get() - Math.PI / 2;
    return {
        map: spawn.map.get(),
        x: spawn.position_x.get() + Math.cos(rightOfFacing) * SPAWN_OFFSET_YARDS,
        y: spawn.position_y.get() + Math.sin(rightOfFacing) * SPAWN_OFFSET_YARDS,
        z: spawn.position_z.get(),
        o: spawn.orientation.get(),
    };
}
