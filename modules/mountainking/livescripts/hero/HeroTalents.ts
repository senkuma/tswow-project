import { commandWords } from "../Commands";
import {
    CAPSTONE_INDEX, chooseBlocker, chosenTree, HeroPlayerState, HeroTree, heroPoints, KEYSTONE_INDEX,
    learnBlocker, mainTalentTree, NODES_PER_TREE, nodeState, spentPoints,
} from "./HeroRules";

const HERO_COMMAND = 'mkhero';
/** Addon message prefix shared with the mountainking addon. */
const ADDON_PREFIX = 'MKHERO';
// ChatMsg CHAT_MSG_WHISPER: addon whispers reach the client as CHAT_MSG_ADDON.
const CHAT_MSG_WHISPER = 7;
const MOUNTAIN_KING_CLASS = GetID('ChrClasses', 'mountainking', 'mountainking');

// Node spells built and tagged by datascripts/heroes/HeroTrees.ts.
const HERO_TREES: HeroTree[] = [
    { key: 'stormcaller', name: 'Stormcaller', spells: TAG('mountainking', 'hero-stormcaller') },
    { key: 'thane', name: 'Thane of Ironforge', spells: TAG('mountainking', 'hero-thane') },
    { key: 'wildhammer', name: 'Wildhammer', spells: TAG('mountainking', 'hero-wildhammer') },
];

/** Hero trees each specialization may choose from, as in retail (two of three). */
const HERO_TREES_BY_SPEC: { [spec: string]: string[] } = {
    thunder: ['stormcaller', 'wildhammer'],
    hammer: ['stormcaller', 'thane'],
    mountain: ['thane', 'wildhammer'],
};

/**
 * Talent rank spells per tree, tagged by classkit's createTalentTree:
 * index i holds every talent's rank i+1 spell, so knowing one is worth i+1 points.
 */
const TALENT_TREES: { key: string, ranks: TSArray<uint32>[] }[] = [
    {
        key: 'thunder',
        ranks: [
            TAG('mountainking', 'thunder-talent-rank-1'), TAG('mountainking', 'thunder-talent-rank-2'),
            TAG('mountainking', 'thunder-talent-rank-3'), TAG('mountainking', 'thunder-talent-rank-4'),
            TAG('mountainking', 'thunder-talent-rank-5'),
        ],
    },
    {
        key: 'hammer',
        ranks: [
            TAG('mountainking', 'hammer-talent-rank-1'), TAG('mountainking', 'hammer-talent-rank-2'),
            TAG('mountainking', 'hammer-talent-rank-3'), TAG('mountainking', 'hammer-talent-rank-4'),
            TAG('mountainking', 'hammer-talent-rank-5'),
        ],
    },
    {
        key: 'mountain',
        ranks: [
            TAG('mountainking', 'mountain-talent-rank-1'), TAG('mountainking', 'mountain-talent-rank-2'),
            TAG('mountainking', 'mountain-talent-rank-3'), TAG('mountainking', 'mountain-talent-rank-4'),
            TAG('mountainking', 'mountain-talent-rank-5'),
        ],
    },
];

export function registerHeroTalents(events: TSEvents) {
    HERO_TREES.forEach(tree => {
        if (tree.spells.length !== NODES_PER_TREE) {
            console.log(`[mountainking] Hero tree ${tree.key} has ${tree.spells.length} spells, expected ${NODES_PER_TREE}.`);
        }
    });

    events.Player.OnCommand((player, command, found) => {
        const words = commandWords(command.get());
        if (words[0] !== HERO_COMMAND) {
            return;
        }
        // Stops the server from replying "There is no such command".
        found.set(true);
        if (player.GetClass() !== MOUNTAIN_KING_CLASS) {
            player.SendBroadcastMessage('Only Mountain Kings have hero talents.');
            return;
        }
        handleHeroCommand(player, words.slice(1));
    });

    // Hero points come from levels, and talent changes can change which trees are available.
    events.Player.OnLevelChanged(player => sendStateIfMountainKing(player));
    events.Player.OnLogin(player => sendStateIfMountainKing(player));
    events.Player.OnTalentsReset(player => {
        // A respec can change the specialization, so hero talents start over too.
        if (player.GetClass() === MOUNTAIN_KING_CLASS) {
            forgetAllHeroTalents(player);
            sendState(player);
        }
    });
}

function handleHeroCommand(player: TSPlayer, args: string[]) {
    const action = args.length > 0 ? args[0] : 'sync';
    if (action === 'sync') {
        sendState(player);
    } else if (action === 'choose' && args.length > 1) {
        chooseTree(player, args[1]);
    } else if (action === 'learn' && args.length > 2) {
        learnNode(player, args[1], parseNodeIndex(args[2]));
    } else if (action === 'reset') {
        forgetAllHeroTalents(player);
        player.SendBroadcastMessage('Your hero talents have been reset.');
        sendState(player);
    } else {
        player.SendBroadcastMessage(`Usage: .${HERO_COMMAND} [sync | choose <tree> | learn <tree> <node> | reset]`);
    }
}

function parseNodeIndex(text: string): number | undefined {
    const value = parseInt(text);
    // NaN is the only value that differs from itself.
    return value === value ? value : undefined;
}

function chooseTree(player: TSPlayer, treeKey: string) {
    const tree = findTree(treeKey);
    if (tree === undefined) {
        return reject(player, `Unknown hero tree "${treeKey}".`);
    }
    const blocker = chooseBlocker(tree, HERO_TREES, availableTreeKeys(player), playerState(player));
    if (blocker !== undefined) {
        return reject(player, blocker);
    }
    player.LearnSpell(tree.spells[KEYSTONE_INDEX]);
    player.SendBroadcastMessage(`You now follow the path of the ${tree.name}.`);
    sendState(player);
}

function learnNode(player: TSPlayer, treeKey: string, index: number | undefined) {
    const tree = findTree(treeKey);
    if (tree === undefined || index === undefined) {
        return reject(player, 'Unknown hero talent.');
    }
    const blocker = learnBlocker(tree, index, playerState(player));
    if (blocker !== undefined) {
        return reject(player, blocker);
    }
    player.LearnSpell(tree.spells[index]);
    sendState(player);
}

function forgetAllHeroTalents(player: TSPlayer) {
    HERO_TREES.forEach(tree => tree.spells.forEach(spell => {
        if (player.HasSpell(spell)) {
            player.RemoveSpell(spell, false, false);
        }
    }));
}

function reject(player: TSPlayer, reason: string) {
    player.SendBroadcastMessage(reason);
    send(player, `ERR;${reason}`);
}

function findTree(key: string) {
    for (const tree of HERO_TREES) {
        if (tree.key === key) {
            return tree;
        }
    }
    return undefined;
}

function playerState(player: TSPlayer): HeroPlayerState {
    return { level: player.GetLevel(), knows: spell => player.HasSpell(spell) };
}

function specializationOf(player: TSPlayer) {
    const spec = player.GetActiveSpec();
    return mainTalentTree(TALENT_TREES.map(tree => {
        let points = 0;
        tree.ranks.forEach((rankSpells, rankIndex) => rankSpells.forEach(spell => {
            if (player.HasTalent(spell, spec)) {
                points += rankIndex + 1;
            }
        }));
        return { key: tree.key, points };
    }));
}

function availableTreeKeys(player: TSPlayer): string[] {
    const spec = specializationOf(player);
    return spec === undefined ? [] : HERO_TREES_BY_SPEC[spec];
}

function sendStateIfMountainKing(player: TSPlayer) {
    if (player.GetClass() === MOUNTAIN_KING_CLASS) {
        sendState(player);
    }
}

/**
 * Sends the whole hero talent state to the addon. Protocol, one message each:
 *   BEGIN
 *   STATE;<level>;<points>;<spent>;<spec or ->;<chosen tree or ->
 *   TREE;<key>;<name>;<1 if available to the spec>
 *   NODE;<tree key>;<index>;<spell id>;<learned|available|locked>
 *   END
 */
function sendState(player: TSPlayer) {
    const state = playerState(player);
    const chosen = chosenTree(HERO_TREES, state);
    const available = availableTreeKeys(player);
    const spec = specializationOf(player);
    send(player, 'BEGIN');
    send(player, `STATE;${state.level};${heroPoints(state.level)};${chosen === undefined ? 0 : spentPoints(chosen, state)};`
        + `${spec === undefined ? '-' : spec};${chosen === undefined ? '-' : chosen.key}`);
    HERO_TREES.forEach(tree => {
        send(player, `TREE;${tree.key};${tree.name};${available.indexOf(tree.key) === -1 ? 0 : 1}`);
        for (let index = KEYSTONE_INDEX; index <= CAPSTONE_INDEX; index++) {
            send(player, `NODE;${tree.key};${index};${tree.spells[index]};${nodeState(tree, index, state)}`);
        }
    });
    send(player, 'END');
}

function send(player: TSPlayer, message: string) {
    player.SendAddonMessage(ADDON_PREFIX, message, CHAT_MSG_WHISPER, player);
}
