import { Class } from "wow/wotlk/std/Class/Class";
import { LUAXML } from "wow/wotlk/luaxml/LUAXML";
import { BaseClassName } from "./ClassCombatFormulas";

const HIDDEN_CLASSES_TABLE = 'CLASSKIT_HIDDEN_CLASSES';

/**
 * Wraps the glue screen's class enumeration: hidden classes get no button,
 * the visible buttons move up into the first button slots so hidden classes
 * leave no gaps, and if a hidden class ends up selected (the client keeps or
 * picks a class when the screen opens and when the race changes), the first
 * visible class the race can be is selected instead.
 *
 * Slots are the buttons' own anchors, read once before any button is moved.
 */
const HIDE_CLASSES_HOOK = `
local classkitEnumerateClasses = CharacterCreateEnumerateClasses
local classkitButtonSlots
function CharacterCreateEnumerateClasses(...)
    classkitEnumerateClasses(...)
    local hidden = ${HIDDEN_CLASSES_TABLE} or {}
    local count = select("#", ...) / 3
    if not classkitButtonSlots then
        classkitButtonSlots = {}
        for index = 1, count do
            local button = _G["CharacterCreateClassButton"..index]
            local point, relativeTo, relativePoint, x, y = button:GetPoint(1)
            classkitButtonSlots[index] = {
                point = point, relativeTo = relativeTo or button:GetParent(),
                relativePoint = relativePoint, x = x, y = y,
            }
        end
    end
    local firstVisible
    local nextSlot = 1
    for index = 1, count do
        local button = _G["CharacterCreateClassButton"..index]
        if hidden[strupper(select(index * 3 - 1, ...))] then
            button:Hide()
        else
            local slot = classkitButtonSlots[nextSlot]
            if slot and slot.point then
                button:ClearAllPoints()
                button:SetPoint(slot.point, slot.relativeTo, slot.relativePoint, slot.x, slot.y)
            end
            nextSlot = nextSlot + 1
            if not firstVisible and IsRaceClassValid(GetSelectedRace(), index) then
                firstVisible = index
            end
        end
    end
    local _, selectedFile = GetSelectedClass()
    if selectedFile and hidden[strupper(selectedFile)] and firstVisible then
        SetSelectedClass(firstVisible)
    end
end`;

// Every module that hides a class shares the hook; datascript modules can
// load classkit more than once, so the flag lives on the process.
const HOOK_INSTALLED = Symbol.for('classkit.hidden-classes-hook');
const processState = globalThis as unknown as Record<symbol, boolean>;

/**
 * Removes a class from the character creation screen without touching the
 * class itself, so existing characters keep working. Call it from the
 * class's module and remove the call to offer the class again. The remaining
 * classes fill the freed button slots in class order.
 */
export function hideFromCharacterCreation(cls: Class) {
    hideClassFile(cls.Filename);
}

/** Client file names of the Blizzard classes, as the glue screen reports them. */
const BASE_CLASS_FILES: Record<BaseClassName, string> = {
    WARRIOR: 'WARRIOR',
    PALADIN: 'PALADIN',
    HUNTER: 'HUNTER',
    ROGUE: 'ROGUE',
    PRIEST: 'PRIEST',
    DEATH_KNIGHT: 'DEATHKNIGHT',
    SHAMAN: 'SHAMAN',
    MAGE: 'MAGE',
    WARLOCK: 'WARLOCK',
    DRUID: 'DRUID',
};

/** Hides the given Blizzard classes; see {@link hideFromCharacterCreation}. */
export function hideBaseClassesFromCharacterCreation(classes: BaseClassName[]) {
    classes.forEach(name => hideClassFile(BASE_CLASS_FILES[name]));
}

function hideClassFile(classFile: string) {
    const file = LUAXML.file('Interface/GlueXML/CharacterCreate.lua');
    const lastLine = file.lines.length - 1;
    if (!processState[HOOK_INSTALLED]) {
        processState[HOOK_INSTALLED] = true;
        file.after(lastLine, HIDE_CLASSES_HOOK);
    }
    file.after(lastLine, `${HIDDEN_CLASSES_TABLE} = ${HIDDEN_CLASSES_TABLE} or {}; `
        + `${HIDDEN_CLASSES_TABLE}["${classFile.toUpperCase()}"] = true`);
}
