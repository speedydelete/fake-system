
/// <reference path="../in_node.d.ts" />

export function abort(): void {
    __fakeNode__.window.close();
}

export const allowedNodeEnvironmentFlags = new Set<never>();

export const arch = 'fake';

export const channel = undefined;

export function chdir(path: string): void {
    __fakeNode_process__.cwd = path;
}

export const config = {};

export const connected = undefined;

export function constrainedMemory(): number {
    return 0;
}

export function availableMemory(): number {
    throw new TypeError('process.availableMemory is not available in fake-node');
}

export function cpuUsage(previousValue?: {user: number, system: number}): {user: number, system: number} {
    throw new TypeError('process.cpuUsage is not available in fake-node');
}

export function cwd(): string {
    return __fakeNode_process__.cwd;
}

export let debugPort = -1;

export const disconnect = undefined;

export function dlopen(module: object, filename: string, flags: any /* typeof os.constants.dlopen[keyof typeof os.constants.dlopen] = os.constants.dlopen.RTLD_LAZY */): void {
    throw new TypeError('process.dlopen is not supported in fake-node');
}

export function emitWarning(warning: string | Error, type_or_options: string | {type?: string, code?: string, ctor?: Function, detail?: string}, code?: string, ctor: Function = emitWarning, detail?: string): void {
    throw new TypeError('process.emitWarning is not supported in fake-node');
}

export function exit(code: number = 0): void {
    window.console.log('Exit code', code);
    window.close();
}

export let exitCode = 0;

export const features = {
    cached_builtins: true,
    debug: false,
    inspector: false,
    ipv6: true,
    require_module: true,
    tls: false,
    tls_alpn: false,
    tls_ocsp: false,
    tls_sni: false,
    typescript: false,
    uv: false,
};

export const finalization = {

    register(ref: object, callback: (ref: object, event: string) => void): void {
        throw new TypeError('process.finalization is not supported in fake-node');
    },

    registerBeforeExit(ref: object, callback: (ref: object, event: string) => void): void {
        throw new TypeError('process.finalization is not supported in fake-node');
    },

    unregister(ref: object): void {
        throw new TypeError('process.finalization is not supported in fake-node');
    },

};

export function getActiveResourcesInfo(): string[] {
    return [];
}

export function getBuiltinModule(id: string): any {
    return __fakeNode_process__.fakeNode.modules.get(id);
}

export function getegid(): number {
    return __fakeNode_process__.gid;
}

export function geteuid(): number {
    return __fakeNode_process__.uid;
}

export function getgid(): number {
    return __fakeNode_process__.gid;
}

export function getgroups(): number[] {
    return [__fakeNode_process__.gid].concat(__fakeNode_process__.groups);
}

export function getuid(): number {
    return __fakeNode_process__.uid;
}

let errorCallback: null | number = null;

export function hasUncaughtExecptionCaptureCallback(): boolean {
    return errorCallback !== null;
}

export function hrtime(time?: [number, number]): [number, number] {
    let value = window.performance.now();
    if (time !== undefined) {
        value -= time[0] + time[1] / 1000000;
    }
    return [Math.floor(value), (value - Math.floor(value) * 1000000)];
}

hrtime.bigint = function(): bigint {
    return BigInt(window.performance.now());
}

export function initgroups(user: string | number, extraGroup: string | number): void {
    throw new TypeError('process.initgroups is not supported in fake-node');
}

export function kill(pid: number, signal: string | number): void {
    throw new TypeError('process.kill is not supported in fake-node');
}

export function loadEnvFile(path: string = './.env'): void {
    throw new TypeError('process.loadEnvFile is not supported in fake-node');
}

export function memoryUsage(): {rss: number, heapTotal: number, heapUsed: number, external: number, arrayBuffers: number} {
    throw new TypeError('process.memoryUsage is not supported in fake-node');
}

memoryUsage.rss = function(): number {
    throw new TypeError('process.memoryUsage.rss is not supported in fake-node');
}

export function nextTick(callback: Function, ...args: any[]): void {
    window.setTimeout(callback, 0, ...args);
}

export const noDeprecation = false;

export const permission = {

    has(scope: string, reference?: string): void {
        throw new TypeError('process.permission.has is not supported in fake-node');
    }

};

export function ref(maybeRefable: any): void {
    throw new TypeError('process.ref is not supported in fake-node');
}

export const pid = 1;

export const ppid = 1;

export const release = {
    name: 'fake-node',
    sourceUrl: '', // todo: add something here
    headersUrl: '',
    lts: 'Hydrogen',
};

export function setegid(id: string | number): void {
    __fakeNode_process__.gid = __fakeNode__.getGIDFromGroup(id);
}

export function seteuid(id: string | number): void {
    __fakeNode_process__.uid = __fakeNode__.getUIDFromUser(id);
}

export function setgid(id: string | number): void {
    __fakeNode_process__.gid = __fakeNode__.getGIDFromGroup(id);
}

export function setgroups(groups: (string | number)[]): void {
    __fakeNode_process__.groups = groups.map(__fakeNode__.getGIDFromGroup);
}

export function setuid(id: string | number): void {
    __fakeNode_process__.uid = __fakeNode__.getUIDFromUser(id);
}

export function setSourceMapsEnabledVal(val: boolean): void {
    throw new TypeError('process.setSourceMapsEnabledVal is not supported in fake-node');
}

export function setUncaughtExceptionCaptureCallback(func: Function | null): void {
    if (errorCallback !== null) {
        __fakeNode__.removeErrorCallback(errorCallback);
    }
    if (func !== null) {
        errorCallback = __fakeNode__.addErrorCallback(func);
    }
}

export const sourceMapsEnabled = false;

export const stderr = undefined; // todo: put stuff here

export const stdin = undefined;

export const stdout = undefined;

export let throwDeprecation = false;

export let title = ''; // todo: put something here

export const traceDeprecation = false;

export function umask(): number;
export function umask(mask: number): void;
export function umask(mask?: number): number | void {
    if (mask === undefined) {
        return __fakeNode_process__.umask;
    } else {
        __fakeNode_process__.umask = mask;
    }
}

export function unref(maybeRefable: any): void {
    throw new TypeError('process.unref is not supported in fake-node');
}

export function uptime(): number {
    return __fakeNode_process__.fakeNode.window.performance.now() / 1000;
}
