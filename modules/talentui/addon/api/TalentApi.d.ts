/**
 * 3.3.5 talent API, which TSWoW's WoW declarations do not cover. Flags the
 * client returns as 1 or nil are typed as `1 | undefined`.
 */

declare function GetNumTalentTabs(inspect?: boolean, pet?: boolean): number;

/** name, icon, points spent, background, preview points spent */
declare function GetTalentTabInfo(
    tab: number, inspect?: boolean, pet?: boolean, talentGroup?: number,
): LuaMultiReturn<[string, string, number, string, number]>;

declare function GetNumTalents(tab: number, inspect?: boolean, pet?: boolean): number;

/**
 * name, icon, tier, column, rank, max rank, isExceptional (teaches an
 * ability), meetsPrereq, preview rank, meetsPreviewPrereq
 */
declare function GetTalentInfo(
    tab: number, index: number, inspect?: boolean, pet?: boolean, talentGroup?: number,
): LuaMultiReturn<[string, string, number, number, number, number, 1 | undefined, 1 | undefined, number,
    1 | undefined]>;

/** tier and column of the required talent, then whether it is learnable (and preview learnable). */
declare function GetTalentPrereqs(
    tab: number, index: number, inspect?: boolean, pet?: boolean, talentGroup?: number,
): LuaMultiReturn<[number | undefined, number | undefined]>;

declare function GetUnspentTalentPoints(inspect?: boolean, pet?: boolean, talentGroup?: number): number;
declare function GetGroupPreviewTalentPointsSpent(pet?: boolean, talentGroup?: number): number;
declare function AddPreviewTalentPoints(tab: number, index: number, points: number, pet?: boolean,
    talentGroup?: number): void;
declare function ResetGroupPreviewTalentPoints(pet?: boolean, talentGroup?: number): void;
declare function LearnPreviewTalents(pet?: boolean): void;

declare function GetActiveTalentGroup(inspect?: boolean, pet?: boolean): number;
declare function GetNumTalentGroups(inspect?: boolean, pet?: boolean): number;
declare function SetActiveTalentGroup(talentGroup: number): void;

/** Class colors by class file name; custom classes may be missing. */
declare const RAID_CLASS_COLORS: { [classFile: string]: { r: number; g: number; b: number } | undefined };

/** A talent's chat link: "|cff4e96f7|Htalent:<talent id>:<rank>|h[name]|h|r". */
declare function GetTalentLink(tab: number, index: number, inspect?: boolean, pet?: boolean,
    talentGroup?: number): string | undefined;
