/**
 * Fixes for UI code in the client's third-party patches.
 *
 * WarcraftXL's Patch-X (SharedXML/SharedExtendedMethods.lua) wraps
 * GameTooltip:SetUnitDebuff to read a global AURA_CACHE of reordered debuff
 * indexes, which nothing in this client creates, so every debuff tooltip
 * raised an error. Empty, the wrapper passes indexes through to the client's
 * own SetUnitDebuff.
 */
if (_G['AURA_CACHE'] === undefined) {
    _G['AURA_CACHE'] = {};
}
