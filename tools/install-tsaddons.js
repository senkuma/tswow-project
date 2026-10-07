/*
 * Exposes TSWoW's addon build output to the client as a regular AddOn.
 *
 * TSWoW loads module addons by listing them in the dev patch's FrameXML.toc.
 * WarcraftXL's Patch-X.MPQ ships its own FrameXML.toc, which outranks the dev
 * patch, so those entries are never read. This installs Interface/AddOns/TSWoW:
 *   - the shared runtime files TSWoW lists in FrameXML.toc (RequireStub, lualib, ...)
 *   - TSWoW.toc: those, then every module addon's files, named as TSWoW's
 *     build names them, read from the module sources
 *   - TSAddons: a junction to the dev patch's TSAddons folder, so rebuilt
 *     addons reach the client without re-running this script.
 *
 * Re-run after adding, removing or renaming addon source files (the toc lists
 * every file), or after updating TSWoW. The addons themselves still have to be
 * built by TSWoW before the client can load them.
 *
 * Usage: node tools/install-tsaddons.js [clientPath]
 */
const fs = require('fs');
const path = require('path');

const INSTALL_ROOT = path.resolve(__dirname, '..');
// Default dataset settings: dev patch letter A, no locale folder.
const DEV_PATCH = 'patch-A.MPQ';
const ADDON_NAME = 'TSWoW';
const SECTION_BEGIN = '## tsaddon-begin-lib';
const SECTION_END = '## add new modules above here';
const TSADDONS_DIR = 'TSAddons';
const ADDON_ENTRY = 'addon.ts';
const SKIPPED_SOURCE_DIRS = ['build', 'node_modules'];

function readDefaultClientPath() {
    const nodeConf = fs.readFileSync(path.join(INSTALL_ROOT, 'node.conf'), 'utf8');
    const match = nodeConf.match(/^Default\.Client\s*=\s*"(.*)"\s*$/m);
    if (!match) {
        throw new Error('node.conf has no Default.Client entry; pass the client path as an argument');
    }
    return match[1].replace(/\\\\/g, '\\');
}

/** The runtime files TSWoW lists in FrameXML.toc ahead of the module addons, in load order. */
function readRuntimeFiles(frameXmlToc) {
    const lines = fs.readFileSync(frameXmlToc, 'utf8').split(/\r?\n/).map(line => line.trim());
    const begin = lines.indexOf(SECTION_BEGIN);
    const end = lines.indexOf(SECTION_END);
    if (begin === -1 || end < begin) {
        throw new Error(`${frameXmlToc} has no TSWoW section; run "build addon" in TSWoW first`);
    }
    return lines.slice(begin, end)
        .filter(line => line !== '' && !line.startsWith('#') && !line.startsWith(`${TSADDONS_DIR}\\`));
}

/** The TypeScript sources under `dir`, as paths relative to it with forward slashes. */
function listSources(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) {
            return SKIPPED_SOURCE_DIRS.includes(entry.name)
                ? []
                : listSources(path.join(dir, entry.name), `${prefix}${entry.name}/`);
        }
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [`${prefix}${entry.name}`] : [];
    });
}

/**
 * Every module addon's built files in load order. Module files only register
 * themselves, so they all come first; each module's entry file runs its addon
 * and requires the others, so the entries come last.
 */
function moduleAddonFiles() {
    const modulesDir = path.join(INSTALL_ROOT, 'modules');
    const files = [];
    const entries = [];
    for (const module of fs.readdirSync(modulesDir).sort()) {
        const addonDir = path.join(modulesDir, module, 'addon');
        if (!fs.existsSync(path.join(addonDir, ADDON_ENTRY))) {
            continue;
        }
        for (const source of listSources(addonDir)) {
            const built = [TSADDONS_DIR, module, 'addon', ...source.replace(/\.ts$/, '.lua').split('/')].join('\\');
            (source === ADDON_ENTRY ? entries : files).push(built);
        }
    }
    return [...files, ...entries];
}

function ensureJunction(target, linkPath) {
    const existing = fs.lstatSync(linkPath, { throwIfNoEntry: false });
    if (existing !== undefined) {
        if (!existing.isSymbolicLink()) {
            throw new Error(`${linkPath} exists and is not a junction; remove it and re-run`);
        }
        if (path.resolve(fs.readlinkSync(linkPath)) === path.resolve(target)) {
            return;
        }
        fs.unlinkSync(linkPath);
    }
    fs.symlinkSync(target, linkPath, 'junction');
}

function install(clientPath) {
    const frameXml = path.join(clientPath, 'Data', DEV_PATCH, 'Interface', 'FrameXML');
    const addonDir = path.join(clientPath, 'Interface', 'AddOns', ADDON_NAME);
    const runtimeFiles = readRuntimeFiles(path.join(frameXml, 'FrameXML.toc'));
    const files = [...runtimeFiles, ...moduleAddonFiles()];

    fs.mkdirSync(addonDir, { recursive: true });
    for (const file of runtimeFiles) {
        fs.copyFileSync(path.join(frameXml, file), path.join(addonDir, file));
    }
    ensureJunction(path.join(frameXml, TSADDONS_DIR), path.join(addonDir, TSADDONS_DIR));

    const toc = [
        '## Interface: 30300',
        `## Title: ${ADDON_NAME} Addons`,
        '## Notes: Module addons built by TSWoW (generated by tools/install-tsaddons.js)',
        ...files,
    ];
    fs.writeFileSync(path.join(addonDir, `${ADDON_NAME}.toc`), toc.join('\r\n') + '\r\n');
    console.log(`Installed ${files.length} files as AddOn "${ADDON_NAME}" in ${addonDir}`);
}

install(process.argv[2] || readDefaultClientPath());
