import { addClassesToDetails, addColorStrings } from "./ClassTables";
import { Details } from "./DetailsTypes";
import { forgetUnknownSpecs, wrapSpecializationInfo } from "./Specializations";

/**
 * Makes the Details! damage meter work with this server's custom classes:
 * Details keeps its own tables of class colors, icons and specializations,
 * and a class missing from them is a Lua error.
 */
const DETAILS_ADDON = 'Details';

/** Details copies its class tables from the profile, after loading its combats, whenever it applies one. */
function fitToProfile(details: Details) {
    addClassesToDetails(details);
    forgetUnknownSpecs(details);
}

function patchDetails(details: Details) {
    wrapSpecializationInfo(_G['DetailsFramework']);
    fitToProfile(details);
    hooksecurefunc(details, 'ApplyProfile', () => fitToProfile(details));
}

addColorStrings();
// Details usually loads first (addons load alphabetically), but may not be installed or enabled.
const loadedDetails: Details | undefined = _G['_detalhes'];
if (loadedDetails !== undefined) {
    patchDetails(loadedDetails);
} else {
    const watcher = CreateFrame('Frame');
    watcher.RegisterEvent('ADDON_LOADED');
    watcher.SetScript('OnEvent', (_, __, addonName) => {
        const details: Details | undefined = _G['_detalhes'];
        if (addonName === DETAILS_ADDON && details !== undefined) {
            watcher.UnregisterAllEvents();
            patchDetails(details);
        }
    });
}
