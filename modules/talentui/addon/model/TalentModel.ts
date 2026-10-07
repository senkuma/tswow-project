import { teachesAbility } from "./TalentAbility";
import { canAddPoint, NodeState, nodeState } from "./TalentRules";

export interface TalentNodeModel {
    tab: number;
    index: number;
    name: string;
    icon: string;
    tier: number;
    column: number;
    rank: number;
    maxRank: number;
    /** Teaches an ability: retail draws those as squares, passives as circles. */
    isAbility: boolean;
    state: NodeState;
    canAddPoint: boolean;
    /** Tier and column of the talent this one requires, if any. */
    prereq?: { tier: number; column: number };
}

export interface TalentTreeModel {
    tab: number;
    name: string;
    icon: string;
    /** Applied and previewed points. */
    points: number;
    nodes: TalentNodeModel[];
}

export interface TalentModel {
    talentGroup: number;
    isActiveGroup: boolean;
    unspentPoints: number;
    previewPoints: number;
    trees: TalentTreeModel[];
}

/** Reads the player's talents for `talentGroup`, previewed points included, from the client. */
export function readTalentModel(talentGroup: number): TalentModel {
    const previewPoints = GetGroupPreviewTalentPointsSpent(false, talentGroup);
    const unspentPoints = GetUnspentTalentPoints(false, false, talentGroup) - previewPoints;
    const trees: TalentTreeModel[] = [];
    for (let tab = 1; tab <= GetNumTalentTabs(false, false); ++tab) {
        trees.push(readTree(tab, talentGroup, unspentPoints));
    }
    return {
        talentGroup,
        isActiveGroup: talentGroup === GetActiveTalentGroup(false, false),
        unspentPoints,
        previewPoints,
        trees,
    };
}

function readTree(tab: number, talentGroup: number, unspentPoints: number): TalentTreeModel {
    const [name, icon, pointsSpent, , previewPointsSpent] = GetTalentTabInfo(tab, false, false, talentGroup);
    const points = pointsSpent + previewPointsSpent;
    const nodes: TalentNodeModel[] = [];
    for (let index = 1; index <= GetNumTalents(tab, false, false); ++index) {
        const [talentName, talentIcon, tier, column, , maxRank, isExceptional, , previewRank, meetsPreviewPrereq]
            = GetTalentInfo(tab, index, false, false, talentGroup);
        const facts = {
            rank: previewRank,
            maxRank,
            tier,
            meetsPrereq: meetsPreviewPrereq !== undefined,
            treePoints: points,
            unspentPoints,
        };
        const [prereqTier, prereqColumn] = GetTalentPrereqs(tab, index, false, false, talentGroup);
        nodes.push({
            tab,
            index,
            name: talentName,
            icon: talentIcon,
            tier,
            column,
            rank: previewRank,
            maxRank,
            isAbility: isExceptional !== undefined || teachesAbility(tab, index),
            state: nodeState(facts),
            canAddPoint: canAddPoint(facts),
            prereq: prereqTier !== undefined && prereqColumn !== undefined
                ? { tier: prereqTier, column: prereqColumn }
                : undefined,
        });
    }
    return { tab, name, icon, points, nodes };
}
