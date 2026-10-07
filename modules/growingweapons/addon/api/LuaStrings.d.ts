/** WoW's global alias of string.match: one value per capture, nothing when the text does not match. */
declare function strmatch(this: void, text: string, pattern: string): LuaMultiReturn<(string | undefined)[]>;
