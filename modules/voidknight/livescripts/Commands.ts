/** Lowercased words of a chat command, without the "." or "!" prefix. */
export function commandWords(text: string): string[] {
    let rest = text.trim().toLowerCase();
    // startsWith is ES2015 and has no Lua translation under the ES5 target livescripts use.
    while (rest.substring(0, 1) === '.' || rest.substring(0, 1) === '!') {
        rest = rest.substring(1);
    }
    const words: string[] = [];
    while (rest.length > 0) {
        const space = rest.indexOf(' ');
        const word = space === -1 ? rest : rest.substring(0, space);
        if (word.length > 0) {
            words.push(word);
        }
        rest = space === -1 ? '' : rest.substring(space + 1);
    }
    return words;
}
