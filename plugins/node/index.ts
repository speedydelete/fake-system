
import {System, type Process} from 'fake-system'
import {type BashProcess} from 'fake-system/bash';
import command from 'fake-system/bash_command'
import * as baseProcessObject from './modules/process';
import * as module_os from './modules/os';
import * as module_util from './modules/util';
import * as module_querystring from './modules/querystring';
import * as module_punycode from 'punycode/';
import * as module_path from './modules/path';
import * as module_buffer from './modules/buffer';
import * as module_fs from './modules/fs';
import {transpiler, REASONABLE_ASSUMPTIONS, type SourceMap} from './transpiler';
import WEB_ONLY_GLOBALS from './web_only_globals.json';


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

type Transpiler = ((system: NodeSystem, code: string, type: string, filename: string) => {code: string, map: SourceMap}) & {types: string[]};

export interface Options {
    development?: boolean;
    fileExtensions?: {[ext: string]: string};
    transpilers?: Transpiler[];
    assumptions?: {[assumption: string]: boolean};
}

export interface NodeSystem extends System {
    node: {
        window: Window;
        modules: Map<string, unknown>;
        errorCallbacks: (Function | undefined)[];
        isBrowser: boolean;
        require(module: string, process: Process): unknown;
        getProcessObject(process: Process): ProcessObject;
        development: boolean;
        fileExtensions: {[ext: string]: string};
        transpilers: Map<string, Transpiler>;
        assumptions: {[assumption: string]: boolean};
    };
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

const BUILTIN_MODULES: [string, any][] = [
    ['os', module_os],
    ['util', module_util],
    ['querystring', module_querystring],
    ['punycode', module_punycode],
    ['path', module_path],
    ['buffer', module_buffer],
    ['fs', module_fs],
];


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


function run(system: NodeSystem, process: Process, code: string, filename: string) {
    let type: string | undefined = undefined;
    for (let ext in system.node.fileExtensions) {
        if (filename.endsWith(ext)) {
            type = system.node.fileExtensions[ext];
        }
    }
    if (type === undefined) {
        throw new TypeError(`no file extension found matching ${type}`);
    }
    let transpiler = system.node.transpilers.get(type);
    if (transpiler === undefined) {
        throw new TypeError(`no transpiler found matching ${type}`);
    }
    ({code} = transpiler(system, code, type, filename));
    let elt = system.node.window.document.createElement('script');
    elt.textContent = `__fakeNode_exports__=(()=>{'use strict';var __dirname=${JSON.stringify(process.cwd)};var __filename=${JSON.stringify(filename)}};var module={exports:{}};var exports=module.exports;var __fakeNode_process__=__fakeNode_system__.processes[${process.pid}];var require=(x)=>__fakeNode_system__.node.require(x,__fakeNode_process__);var process=__fakeNode_system__.node.getProcessObject(__fakeNode_process__);${code};return module.exports())()`;
    system.node.window.document.body.appendChild(elt);
    // @ts-ignore
    return system.node.window.__fakeNode_exports__;
}

let node = command('node', ' Node.js is a set of libraries for JavaScript which allows it to be used outside of the browser. It is primarily focused on creating simple, easy to build network clients and servers.')
    .argument('file')
    .func(({args, system, process}) => {
        let code = system.fs.read(args.file);
        run(system as NodeSystem, process, code, args.file);
    });


export default function plugin<T extends System>(this: T, options: Options): T & NodeSystem {
    this.fs.addDevice('/usr/bin/node', {executor: node});
    let window = document.createElement('iframe').contentWindow as Window;
    for (const global of WEB_ONLY_GLOBALS) {
        // @ts-ignore
        delete this.window[global];
    }
    // @ts-ignore
    window.global = window;
    // @ts-ignore
    window.__fakeNode_exports__ = undefined;
    // @ts-ignore
    window.__fakeNode_system__ = this;
    let transpilerList = [transpiler, ...(options.transpilers ?? [])]
    let transpilers = new Map<string, Transpiler>();
    // @ts-ignore
    for (let transpiler of transpilerList.toReversed()) {
        for (let type of transpiler.types) {
            transpilers.set(type, transpiler);
        }
    }
    return Object.assign(this, {
        node: {
            window,
            modules: new Map(BUILTIN_MODULES),
            errorCallbacks: [],
            isBrowser: IS_BROWSER,
            require: fakeRequire.bind(this as unknown as NodeSystem),
            getProcessObject: getProcessObject.bind(this),
            development: options.development ?? false,
            fileExtensions: {...(options.fileExtensions ?? {}), ...DEFAULT_FILE_EXTENSIONS},
            transpilers,
            assumptions: options.assumptions ?? REASONABLE_ASSUMPTIONS,
        },
    });
}
plugin.id = 'node';
plugin.requires = ['bash'];
