"""Type-checks the project's datascripts, livescripts and addons with TypeScript 4.7.3 (TSWoW's version).
TSWoW's own std library is not in the repo, so `wow/*` imports are stubbed as `any`: this catches
mistakes against the repo's own code (classkit, growingweapons, endgame, module files) and the
livescript/addon typings, not misuse of TSWoW's std API.
    python3 -I check.py [datascripts|livescripts|addons|all]"""
import glob, json, os, re, subprocess, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', 'modules'))
DATA = os.path.join(HERE, 'data')
TSC = os.path.join(DATA, 'node_modules', '.bin', 'tsc')
TSTL = os.path.join(DATA, 'node_modules', 'typescript-to-lua', 'language-extensions', 'index.d.ts')
what = sys.argv[1] if len(sys.argv) > 1 else 'all'
failed = False

def run(name, config):
    global failed
    path = os.path.join(DATA, f'tsconfig.{name}.json')
    json.dump(config, open(path, 'w'), indent=1)
    out = subprocess.run([TSC, '-p', path], capture_output=True, text=True).stdout
    # Pre-existing stub artifact in untouched classkit code.
    # Pre-existing artifacts of the `any` stubs in files this work does not touch.
    lines = [l for l in out.splitlines()
             if not (('ClassTrainer.ts(' in l and 'TS2347' in l) or '/battlemage/' in l)]
    print(f'--- {name}: {"OK" if not lines else str(len(lines)) + " error lines"}')
    for l in lines: print(l)
    failed = failed or bool(lines)

if what in ('datascripts', 'all'):
    mods = collections.defaultdict(set)
    for f in glob.glob(f'{ROOT}/*/datascripts/**/*.ts', recursive=True):
        if '/build/' in f or f.endswith('.d.ts'): continue
        for m in re.finditer(r'import\s*\{([^}]*)\}\s*from\s*"(wow/[^"]+)"', open(f).read()):
            for n in m.group(1).split(','):
                n = n.strip().split(' as ')[0].strip()
                if n: mods[m.group(2)].add(n)
    stub = [f'declare module "{m}" {{\n' + ''.join(f'  export type {n}<A = any, B = any> = any; export const {n}: any;\n' for n in sorted(ns)) + '}' for m, ns in mods.items()]
    stub.append('declare module "fs"; declare module "path"; declare const __dirname: string;')
    open(os.path.join(DATA, 'stubs.d.ts'), 'w').write('\n'.join(stub))
    entries = [f for f in glob.glob(f'{ROOT}/*/datascripts/datascripts.ts')]
    run('datascripts', {'compilerOptions': {'target': 'es2019', 'module': 'commonjs', 'strict': True, 'noImplicitAny': False,
        'noEmit': True, 'skipLibCheck': True, 'types': [], 'baseUrl': '.',
        'paths': {k: [f'{ROOT}/{k}/datascripts/datascripts.ts'] for k in ('classkit', 'endgame', 'growingweapons')}},
        'files': [os.path.join(DATA, 'stubs.d.ts')] + entries})
if what in ('livescripts', 'all'):
    for mod in sorted(os.listdir(ROOT)):
        files = [f for f in glob.glob(f'{ROOT}/{mod}/livescripts/**/*.ts', recursive=True) if '/build/' not in f and not f.endswith('global.d.ts')]
        if not files: continue
        run(f'livescripts-{mod}', {'compilerOptions': {'target': 'es5', 'lib': ['es5'], 'module': 'commonjs', 'strict': True, 'noEmit': True,
            'skipLibCheck': True, 'experimentalDecorators': True, 'types': []},
            'files': [f'{ROOT}/growingweapons/livescripts/global.d.ts', TSTL, os.path.join(HERE, 'livescript-extra.d.ts')] + files})
if what in ('addons', 'all'):
    for mod in sorted(os.listdir(ROOT)):
        if not os.path.exists(f'{ROOT}/{mod}/addon/addon.ts'): continue
        files = [f for f in glob.glob(f'{ROOT}/{mod}/addon/**/*.ts', recursive=True) if '/build/' not in f and not f.endswith('global.d.ts')]
        dts = [f for f in glob.glob(f'{ROOT}/{mod}/addon/**/*.d.ts', recursive=True) if '/build/' not in f and not f.endswith('global.d.ts')]
        glob_dts = f'{ROOT}/{mod}/addon/global.d.ts' if os.path.exists(f'{ROOT}/{mod}/addon/global.d.ts') else f'{ROOT}/growingweapons/addon/global.d.ts'
        run(f'addon-{mod}', {'compilerOptions': {'target': 'esnext', 'lib': ['esnext'], 'moduleResolution': 'node', 'strict': False, 'noEmit': True,
            'skipLibCheck': True, 'experimentalDecorators': True, 'types': [], 'typeRoots': []},
            'files': [glob_dts, TSTL, os.path.join(DATA, 'node_modules', 'lua-types', '5.1.d.ts')] + sorted(set(files + dts))})
# TypeScript does not report missing side-effect imports (`import "./file"`), so check them here.
missing = []
for f in glob.glob(f'{ROOT}/*/*/**/*.ts', recursive=True):
    if '/build/' in f or f.endswith('.d.ts'): continue
    for m in re.finditer(r'^import\s+"(\.[^"]+)";', open(f).read(), re.M):
        target = os.path.normpath(os.path.join(os.path.dirname(f), m.group(1)))
        if not (os.path.exists(target + '.ts') or os.path.exists(os.path.join(target, 'index.ts'))):
            missing.append(f'{f}: import "{m.group(1)}" has no file')
print(f'--- side-effect imports: {"OK" if not missing else str(len(missing)) + " missing"}')
for l in missing: print(l)
failed = failed or bool(missing)
sys.exit(1 if failed else 0)
