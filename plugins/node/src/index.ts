
import {System, type Process} from 'fake-system'
import {type BashProcess} from 'fake-system/bash';
import {command, CommandError} from 'fake-system/bash_command'
import * as baseProcessObject from './modules/process';
import * as module_os from './modules/os';
import * as module_util from './modules/util';
import * as module_querystring from './modules/querystring';
import * as module_punycode from 'punycode/';
import * as module_path from './modules/path';
import * as module_buffer from './modules/buffer';
import * as module_fs from './modules/fs';
import {type SourceMap, type Options as TranspilerOptions} from './transpiler';
import {WEB_ONLY_GLOBALS, NON_DELETABLE_WEB_ONLY_GLOBALS} from './web_only_globals.json';
import NODE_ONLY_GLOBALS from './node_only_globals.json';


type BaseProcessObject = typeof import ('./modules/process');
export interface ProcessObject extends BaseProcessObject {
    argv: string[];
    readonly argv0: string;
    env: {[key: string]: string};
    execArgv: string[];
    execPath: string;
    mainModule: string;
    platform: string;
    version: string;
    versions: {[key: string]: string};
}

type Transpiler = ((system: NodeSystem, code: string, type: string, filename: string) => string | Promise<string>) & {types: string[]};

export interface Options {
    development?: boolean;
    fileExtensions?: {[ext: string]: string};
    transpilers?: Transpiler[];
    assumptions?: {[assumption: string]: boolean};
}

export interface NodeSystem extends System {
    node: {
        modules: Map<string, unknown>;
        errorCallbacks: (Function | undefined)[];
        isBrowser: boolean;
        require(module: string, process: Process): unknown;
        getProcessObject(process: Process): ProcessObject;
        development: boolean;
        fileExtensions: {[ext: string]: string};
        transpilers: Map<string, Transpiler>;
        assumptions: {[assumption: string]: boolean};
        globals: {[key: string]: unknown},
    } & ({IS_BROWSER: false} | {IS_BROWSER: true, window: Window});
}


const DEFAULT_FILE_EXTENSIONS = {
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.jsx': 'text/javascript-jsx',
    '.ts': 'text/typescript',
    '.d.ts': 'text/typescript-declaration',
    '.tsx': 'text/typescript-jsx',
    '.d.tsx': 'text/typescript-jsx-declaration',
};

const IS_BROWSER = (('window' in globalThis && window === globalThis && 'document' in window && 'navigator' in window && 'window' in window && window.window === window) || ('self' in globalThis && self === globalThis && typeof self.postMessage === 'function' && 'self' in self && self.self === self));

const IS_MODERN = 'Symbol' in globalThis && 'fetch' in globalThis && 'Promise' in globalThis && 'assign' in Object;

const BUILTIN_MODULES: [string, any][] = [
    ['os', module_os],
    ['util', module_util],
    ['querystring', module_querystring],
    ['punycode', module_punycode],
    ['path', module_path],
    ['buffer', module_buffer],
    ['fs', module_fs],
];

const REASONABLE_ASSUMPTIONS = {
    arrayLikeIsIterable: true,
    constantSuper: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    noIncompleteNsImportDetection: true,
    noNewArrows: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    pureGetters: true,
    skipForOfIteratorClosing: true,
};


let transpile: ((code: string, options?: TranspilerOptions) => {code: string, map: SourceMap}) | null = null;
async function transpiler(system: NodeSystem, code: string, type: string, filename: string): Promise<string> {
    if (IS_MODERN && type === 'text/javascript') {
        return code;
    } else if (type === 'application/json') {
        return 'module.exports = ' + code;
    } else {
        if (transpile === null) {
            transpile = (await import('./transpiler.js')).transpile;
        }
        let jsx = false;
        let ts = false;
        let dts = false;
        if (type === 'text/javascript-jsx') {
            jsx = true;
        } else if (type === 'text/typescript') {
            ts = true;
        } else if (type === 'text/typescript-declaration') {
            ts = true;
            dts = true;
        } else if (type === 'text/typescript-jsx') {
            jsx = true;
            ts = true;
        } else if (type === 'text/typescript-jsx-declaration') {
            jsx = true;
            ts = true;
        }
        return transpile(code, {
            filename,
            development: system.node.development,
            jsx,
            ts,
            dts,
            assumptions: system.node.assumptions,
        }).code;
    }
}
transpiler.types = ['text/javascript', 'application/json', 'text/javascript-jsx', 'text/typescript', 'text/typescript-declaration', 'text/typescript-jsx', 'text/typescript-jsx-declaration'];


function getPlatform(): string {
    const data = navigator.userAgent.slice('Mozilla/5.0 ('.length, navigator.userAgent.indexOf(')'));
    if (data.includes('Windows')) {
        return 'win32';
    } else if (data.includes('Linux')) {
        return 'linux';
    } else if (data.includes('Mac')) {
        return 'darwin';
    } else {
        return 'unknown';
    }
}

function getProcessObject(process: BashProcess): ProcessObject {
    let out = Object.create(baseProcessObject);
    out.argv = process.argv;
    Object.defineProperty(out, 'argv0', {value: process.argv[0], configurable: false, writable: false});
    out.env = process.env;
    out.execArgv = [];
    out.execPath = process.argv[0];
    out.mainModule = '';
    out.platform = getPlatform();
    out.version = '0.1.0';
    out.versions = {};
    return out;
}

function fakeRequire(this: NodeSystem, module: string, process: Process): unknown {
    if (module.startsWith('/') || module.startsWith('./') || module.startsWith('../')) {
        const path = module_path.resolve(process.cwd, module);
        return this.fs.read(path);
    } else if (this.node.modules.has(module)) {
        return this.node.modules.get(module);
    } else if (module === 'process' || module === 'node:process') {
        return this.node.getProcessObject(process);
    } else {
        throw new Error(`cannot find module '${module}'`);
    }
}

export {fakeRequire as require};


async function run(system: NodeSystem, process: Process, code: string, filename: string) {
    let type: string | undefined = undefined;
    for (let ext in system.node.fileExtensions) {
        if (filename.endsWith(ext)) {
            type = system.node.fileExtensions[ext];
        }
    }
    if (type === undefined) {
        throw new CommandError(`no file extension found matching ${type}`);
    }
    let transpiler = system.node.transpilers.get(type);
    if (transpiler === undefined) {
        throw new CommandError(`no transpiler found matching ${type}`);
    }
    let newCode = transpiler(system, code, type, filename);
    if (newCode instanceof Promise) {
        code = await newCode;
    } else {
        code = newCode;
    }
    code = `(()=>{'use strict';var __dirname=${JSON.stringify(process.cwd)};var __filename=${JSON.stringify(filename)};var module={exports:{}};var exports=module.exports;var __fakeNode_process__=__fakeNode_system__.processes[${process.pid}];var require=(x)=>__fakeNode_system__.node.require(x,__fakeNode_process__);var process=__fakeNode_system__.node.getProcessObject(__fakeNode_process__);${code};return module.exports;})()`;
    // @ts-ignore
    globalThis.__fakeNode_process__ = process;
    if (system.node.IS_BROWSER) {
        let elt = system.node.window.document.createElement('script');
        elt.textContent = `with(__fakeNode_system__.node.globals){__fakeNode_exports__=${code};};`;
        system.node.window.document.body.appendChild(elt);
        // @ts-ignore
        return system.node.window.__fakeNode_exports__;
    } else {
        return (new Function('__fakeNode_system__', '__fakeNode_process__', `with(__fakeNode_system__.node.globals){return ${code};}`))(system, process);
    }
}

let node = command('node', ' Node.js is a set of libraries for JavaScript which allows it to be used outside of the browser. It is primarily focused on creating simple, easy to build network clients and servers.')
    .argument('file')
    .func(({args, system, process}) => {
        let code = system.fs.read(args.file);
        run(system as NodeSystem, process, code, args.file);
    });


export default function plugin<T extends System>(this: T, options: Options = {}): T & NodeSystem {
    this.fs.addDevice('/usr/bin/node', {executor: node});
    let transpilerList = [transpiler, ...(options.transpilers ?? [])]
    let transpilers = new Map<string, Transpiler>();
    for (let transpiler of transpilerList.toReversed()) {
        for (let type of transpiler.types) {
            transpilers.set(type, transpiler);
        }
    }
    let out: any = {
        IS_BROWSER,
        modules: new Map(BUILTIN_MODULES),
        errorCallbacks: [],
        isBrowser: IS_BROWSER,
        require: fakeRequire.bind(this as unknown as NodeSystem),
        getProcessObject: getProcessObject.bind(this),
        development: options.development ?? false,
        fileExtensions: {...(options.fileExtensions ?? {}), ...DEFAULT_FILE_EXTENSIONS},
        transpilers,
        assumptions: options.assumptions ?? REASONABLE_ASSUMPTIONS,
    }
    // @ts-ignore
    globalThis.__fakeNode_system__ = this;
    if (IS_BROWSER) {
        let iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.style.display = 'none';
        out.window = iframe.contentWindow as Window;
        out.window.global = window;
        out.window.__fakeNode_system__ = this;
        for (const global of WEB_ONLY_GLOBALS) {
            if (global in out.window) {
                delete out.window[global];
            }
        }
    }
    let toDelete = IS_BROWSER ? NON_DELETABLE_WEB_ONLY_GLOBALS : NODE_ONLY_GLOBALS;
    out.globals = Object.create(null, Object.fromEntries(toDelete.map(property => [property, {get() {throw new ReferenceError(`${property} is not defined`);}}])));
    return Object.assign(this, {node: out as NodeSystem['node']});
}
plugin.id = 'node';
plugin.requires = ['bash'];
