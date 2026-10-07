import { std } from "wow/wotlk";
import { FactionTemplateValues } from "wow/wotlk/std/Faction/FactionTemplates";
import { creatureRow } from "wow/wotlk/sql/creature";
import { BATTLE_MAGE } from "./BattleMageClass";
import { ALL_ABILITIES } from "./abilities/BattleMageAbilities";
import { MODULE_NAME } from "./Constants";

// Jennea Cannon, the Stormwind mage trainer, used as the creature template.
// Creature cloning does not copy her trainer list, so this trainer starts empty.
const MAGE_TRAINER_CREATURE = 5497;
const MAGE_CLASS_ID = 8;
const CLASS_TRAINER_TYPE = 0;
const TRAINING_COST_FACTOR = 10;
// Distance to the right of each mage trainer, close enough to share its floor.
const SPAWN_OFFSET_YARDS = 1.5;

export const BATTLE_MAGE_TRAINER = std.CreatureTemplates
    .create(MODULE_NAME, 'battle-mage-trainer', MAGE_TRAINER_CREATURE)
    .Name.enGB.set('Magus Aldric Vane')
    .Subname.enGB.set('Battle Mage Trainer')
    .FactionTemplate.set(FactionTemplateValues.NEUTRAL_PASSIVE)
    // The cloned SmartAI script and gossip menu belong to the original
    // mage trainer and only offer training to mages.
    .AIName.set('')
    .Gossip.set(0)
    .Trainer.modRef(trainer => {
        trainer
            .RequirementType.CLASS.set()
            .RequiredClass.set(BATTLE_MAGE.ID)
            .Greeting.enGB.set('Steel and spell, Battle Mage. Let us see what you have learned.');
        ALL_ABILITIES.forEach(ability => ability.trainerRanks.forEach(rank => {
            const level = rank.Levels.Spell.get();
            const previousRank = ability.ranks[ability.ranks.indexOf(rank) - 1];
            trainer.Spells.add(rank.ID, trainingCostCopper(level), level, 0, 0,
                previousRank ? [previousRank.ID] : []);
        }));
    });

mageTrainerSpawns().forEach(mageTrainer => BATTLE_MAGE_TRAINER.Spawns.addMod(
    MODULE_NAME,
    `trainer-beside-${mageTrainer.guid.get()}`,
    besideOf(mageTrainer),
    spawn => spawn.PhaseMask.set(mageTrainer.phaseMask.get())));

/** Every spawned creature that trains mages, starting zones included. */
function mageTrainerSpawns() {
    const mageTrainerLists = new Set(std.SQL.trainer
        .queryAll({ Type: CLASS_TRAINER_TYPE, Requirement: MAGE_CLASS_ID })
        .map(trainer => trainer.Id.get()));

    return std.SQL.creature_default_trainer.queryAll({})
        .filter(link => mageTrainerLists.has(link.TrainerId.get()))
        .reduce<creatureRow[]>((spawns, link) =>
            spawns.concat(std.SQL.creature.queryAll({ id: link.CreatureId.get() })), []);
}

/** Grows with level like WotLK class training: 10 copper at level 1, about 6.4 gold at 80. */
function trainingCostCopper(level: number) {
    return TRAINING_COST_FACTOR * level * level;
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
