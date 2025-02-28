
import {type TransformOptions} from '@babel/core';
import {System} from 'fake-system';
import * as baseProcessObject from './modules/process';
import * as module_os from './modules/os';
import * as module_util from './modules/util';
import * as module_querystring from './modules/querystring';
import * as module_punycode from 'punycode/';
import * as module_path from './modules/path';
import * as module_buffer from './modules/buffer';
import * as module_fs from './modules/fs';
import WEB_ONLY_GLOBALS from './web_only_globals.json';
import {transpile, type SourceMap} from './transpiler';

export * as fs from './_fs';
export {SourceMap} from './transpiler';


type BaseProcessObject = typeof import ('./modules/process');
interface ProcessObject extends BaseProcessObject {
    argv: string[];
    argv0: string;
    env: {[key: string]: string};
    execArgv: string[];
    execPath: string;
    mainModule: string;
    platform: string;
    version: string;
    versions: {[key: string]: string};
}

export type Person = string | {name: string, email?: string, url?: string};
export interface PackageJSON {
    name?: string;
    version?: string;
    description?: string;
    keywords?: string[];
    homepage?: string;
    bugs?: string | {url?: string, email?: string};
    license?: string;
    author?: Person;
    contributors?: Person[];
    funding?: {type: string, url: string};
    files?: string[];
    exports?: {[entryPoint: string]: string};
    main?: string;
    browser?: string;
    bin?: {[name: string]: string};
    man?: string | string[];
    repository?: string | {type: string, url: string};
    scripts?: {[name: string]: string};
    config?: {[key: string]: string};
    dependancies?: {[name: string]: string};
    devDependancies?: {[name: string]: string};
    peerDependancies?: {[name: string]: string};
    bundleDependancies?: string[];
    optionalDependancies?: {[name: string]: string};
    overrides?: {[name: string]: string};
    engines?: {[engine: string]: string};
    os?: string | string[];
    cpu?: string | string[];
    libc?: string | string[];
    private?: boolean;
    publishConfig?: {[key: string]: string};
    workspaces?: string[];
}

type Transpiler = ((code: string, type: string, options: Options) => {code: string, map: SourceMap}) & {types: string[]};

export interface Options {
    fs?: FileSystem;
    development?: boolean;
    fileExtensions?: {[ext: string]: string};
    transpilers?: Transpiler[];
    assumptions?: {[assumption: string]: boolean};
}


const DEFAULT_FILE_EXTENSIONS = {
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.jsx': 'text/jsx',
    '.ts': 'text/typescript',
    '.d.ts': 'text/typescript-declaration',
    '.tsx': 'text/typescript-jsx',
    '.d.tsx': 'text/typescript-jsx-declaration',
}

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

const DEFAULT_ENV = {
    PATH: '/usr/local/bin:/usr/bin:/bin',
    SHLVL: '1',
    SHELL: '/bin/bash',
    TERM: 'none',
    PS1: '',
    PS2: '> ',
    HISTFILE: '~/.bash_history',
    EDITOR: 'vim',
    VISUAL: 'vim',
    LANG: 'en_US.utf8',
    HOSTNAME: 'fake-node',
    TMPDIR: '/tmp',
};


function defaultTranspiler(code: string, type: string, options: Options, filename?: string): {code: string, map: SourceMap} {
    return transpile(code, {
        filename: filename,
        development: options.development,
        
        assumptions: options.assumptions,
    });
}
defaultTranspiler.types = ['text/javascript', 'application/json', 'text/jsx', 'text/typescript', 'text/typescript-declaration', 'text/typescript-jsx', 'text/typescript-jsx-declaration'];


export class Process {

    fakeNode: FakeNode;

    pid: number;
    priority: number = 0;

    uid: number = 0;
    gid: number = 0;
    groups: number[] = [];
    cwd: string;
    umask: number = 0o6440;

    argv: string[] = [];
    argv0: string = '';
    execArgv: string[] = [];
    execPath: string = '/usr/bin/local/node';

    path: string;
    code?: string;

    constructor(fakeNode: FakeNode, {path = '<anonymous>', code}: {path?: string, code?: string}) {
        this.fakeNode = fakeNode;
        this.pid = fakeNode.nextPid;
        fakeNode.nextPid++;
        fakeNode.processes.set(this.pid, this);
        this.path = path;
        this.cwd = path.split('/').slice(0, -1).join('/');
        this.code = code;
    }

    run(code?: string): unknown {
        code = code ?? this.code ?? this.fakeNode.fs.readFrom(this.path);
        let elt = this.fakeNode.window.document.createElement('script');
        const pathParts = this.path.split('/');
        const dirname = pathParts.slice(0, -1).join('/');
        const filename = pathParts[pathParts.length - 1];
        elt.textContent = `__fakeNode_exports__=(()=>{'use strict';var __dirname=${JSON.stringify(dirname)};var __filename=${JSON.stringify(filename)}};var module={exports:{}};var exports=module.exports;var require=(x)=>__fakeNode__.require(x,${this.pid});var process=__fakeNode__.getProcessObject(${this.pid};${code};return module.exports())()`;
        this.fakeNode.window.document.body.appendChild(elt);
        // @ts-ignore
        return this.fakeNode.window.__fakeNode_exports__;
    }

}


export class FakeNode {

    version: string = '0.3.0';
    versions: {[key: string]: string} = {
        'fake-node': '0.3.0',
        'punycode': '2.3.1',
    };
    options: Options;

    iframe: HTMLIFrameElement;
    window: Window;
    fs: FileSystem;
    modules: Map<string, unknown> = new Map();

    processes: Map<number, Process> = new Map();
    nextPid: number = 3;
    globalEnv: {[key: string]: string} = DEFAULT_ENV;
    errorCallbacks: (Function | undefined)[] = [];
    isBrowser: boolean = IS_BROWSER;

    constructor(options: Options = {}) {
        this.options = options;
        this.iframe = document.createElement('iframe');
        // @ts-ignore
        this.window = this.iframe.contentWindow;
        for (const global of WEB_ONLY_GLOBALS) {
            // @ts-ignore
            delete this.window[global];
        }
        // @ts-ignore
        this.window.global = this.window;
        // @ts-ignore
        this.window.globalThis = this.window;
        // @ts-ignore
        this.window.__fakeNode_exports__ = undefined;
        this.window.addEventListener('error', ({error}) => this.onError(error));
        this.window.addEventListener('unhandledrejection', ({reason}) => reason instanceof Error ? this.onError(reason) : this.onError(new Error(String(reason))));
        this.fs = options.fs ?? new FileSystem();
        for (const [name, module] of BUILTIN_MODULES) {
            this.modules.set(name, module);
            this.modules.set('node:' + name, module);
            this.modules.set('fake-node:' + name, module);
        }
    }

    read(path: string): string {
        return this.fs.readFrom(path);
    }

    write(path: string, data: string): void {
        this.fs.writeTo(path, data);
    }

    exists(path: string): boolean {
        return this.fs.exists(path);
    }

    run(path: string): any {
        return (new Process(this, {path: path})).run();
    }

    eval(code: string): any {
        return (new Process(this, {code, path: '/'})).run();
    }

    async runURL(url: string): Promise<any> {
        this.eval(await (await fetch(url)).text());
    }

    getPID(pid: number): Process {
        const out = this.processes.get(pid);
        if (out === undefined) {
            throw new TypeError(`missing PID: ${pid}`);
        }
        return out;
    }

    getPackageJSON(): PackageJSON {
        return JSON.parse(this.read('package.json'));
    }

    setPackageJSON(data: PackageJSON) {
        this.write('package.json', JSON.stringify(data));
    }

    init() {
        if (!this.exists('package.json')) {
            this.write('package.json', JSON.stringify({}));
        }
    }

    async install(module?: string, source?: string): Promise<void> {
        if (module !== undefined) {
            this.modules.set(module, await import('https://esm.sh/' + module));
        } else {
            const info = this.getPackageJSON();
            if (info.dependancies) {
                for (const name in info.dependancies) {
                    await this.install(name, info.dependancies[name]);
                }
            }
            if (info.devDependancies) {
                for (const name in info.devDependancies) {
                    await this.install(name, info.devDependancies[name]);
                }
            }
        }
    }

    uninstall(module: string): void {
        this.modules.delete(module);
    }

    require(module: string, pid: number): unknown {
        if (module.startsWith('/') || module.startsWith('./') || module.startsWith('../')) {
            const process = this.getPID(pid);
            const path = module_path.resolve(process.cwd, module);
            return process.run(this.fs.readFrom(path));
        } else if (this.modules.has(module)) {
            return this.modules.get(module);
        } else if (module === 'process' || module === 'node:process' || module === 'fake-node:process') {
            return this.getProcessObject(pid);
        } else {
            throw new Error(`cannot find module '${module}'`);
        }
    }

    getProcessObject(pid: number): ProcessObject {
        let out = Object.create(baseProcessObject);
        const process = this.getPID(pid);
        out.argv = process.argv;
        out.argv0 = process.argv0;
        out.env = this.getEnv(pid);
        out.execArgv = process.execArgv;
        out.execPath = process.execPath;
        out.mainModule = '';
        out.platform = this.getPlatform();
        out.version = this.version;
        out.versions = this.versions;
        return out;
    }

    onError(error: Error): void {
        for (const callback of this.errorCallbacks) {
            if (callback !== undefined) {
                callback(error);
            }
        }
    }

    addErrorCallback(callback: Function): number {
        this.errorCallbacks.push(callback);
        return this.errorCallbacks.length - 1;
    }

    removeErrorCallback(callbackID: number): void {
        this.errorCallbacks[callbackID] = undefined;
    }

    getEnv(pid: number): {[key: string]: string} {
        let env = Object.create(this.globalEnv);
        const process = this.processes.get(pid);
        if (process === undefined) {
            throw new TypeError(`invalid PID: ${pid}`);
        }
        env.USER = this.getUserFromUID(process.uid);
        return env;
    }

    getUserFromUID(uid: number | string): string {
        return typeof uid === 'string' ? uid : 'root';
    }

    getUserFromGID(gid: number | string): string {
        return typeof gid === 'string' ? gid : 'root';
    }

    getUIDFromUser(user: string | number): number {
        return typeof user === 'number' ? user : 0;
    }

    getGIDFromGroup(group: string | number): number {
        return typeof group === 'number' ? group : 0;
    }

    getPlatform(): string {
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

}
