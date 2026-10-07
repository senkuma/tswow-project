import { Class } from "wow/wotlk/std/Class/Class";
import { LUAXML } from "wow/wotlk/luaxml/LUAXML";

const HIDDEN_CLASSES_TABLE = 'CLASSKIT_HIDDEN_CLASSES';

/**
 * Wraps the glue screen's class enumeration: hidden classes get no button,
 * and if a hidden class ends up selected (the client keeps or picks a class
 * when the screen opens and when the race changes), the first visible class
 * the race can be is selected instead.
 */
const HIDE_CLASSES_HOOK = `
local classkitEnumerateClasses = CharacterCreateEnumerateClasses
function CharacterCreateEnumerateClasses(...)
    classkitEnumerateClasses(...)
    local hidden = ${HIDDEN_CLASSES_TABLE} or {}
    local firstVisible
    for index = 1, select("#", ...) / 3 do
        if hidden[strupper(select(index * 3 - 1, ...))] then
            _G["CharacterCreateClassButton"..index]:Hide()
        elseif not firstVisible and IsRaceClassValid(GetSelectedRace(), index) then
            firstVisible = index
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
 * class's module and remove the call to offer the class again; when doing so,
 * check `UI.ButtonPos` of classes placed in the freed button slots.
 */
export function hideFromCharacterCreation(cls: Class) {
    const file = LUAXML.file('Interface/GlueXML/CharacterCreate.lua');
    const lastLine = file.lines.length - 1;
    if (!processState[HOOK_INSTALLED]) {
        processState[HOOK_INSTALLED] = true;
        file.after(lastLine, HIDE_CLASSES_HOOK);
    }
    file.after(lastLine, `${HIDDEN_CLASSES_TABLE} = ${HIDDEN_CLASSES_TABLE} or {}; `
        + `${HIDDEN_CLASSES_TABLE}["${cls.Filename.toUpperCase()}"] = true`);
}
