
/// <reference path="../in_node.d.ts" />
import {type BashProcess} from 'fake-system/bash';
import {emitWarning} from './process';

export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array;

export type Callback = (error: Error | null, value: unknown) => void;

function shouldBeCloneable(value: unknown): boolean {
    return value?.constructor === Object || value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || Array.isArray(value) || value instanceof ArrayBuffer || value instanceof Boolean || value instanceof DataView || value instanceof Date || value instanceof Error || value instanceof Map || value instanceof Number || value instanceof RegExp || value instanceof Set || value instanceof String || value instanceof Object.getPrototypeOf(Uint8Array) || value instanceof AudioData || value instanceof Blob || value instanceof CryptoKey || value instanceof DOMException || value instanceof DOMMatrix || value instanceof DOMMatrixReadOnly || value instanceof DOMPoint || value instanceof DOMPointReadOnly || value instanceof DOMQuad || value instanceof DOMRect || value instanceof DOMRectReadOnly || value instanceof EncodedAudioChunk || value instanceof EncodedVideoChunk || value instanceof File || value instanceof FileList || value instanceof FileSystemDirectoryHandle || value instanceof FileSystemFileHandle || value instanceof FileSystemHandle || value instanceof ImageBitmap || value instanceof ImageData || value instanceof RTCCertificate || value instanceof RTCEncodedAudioFrame || value instanceof RTCEncodedVideoFrame || value instanceof VideoFrame || value instanceof WebTransportError;
}

export function callbackify(original: (...args: any[]) => Promise<any>): (...args: [...any[], Callback]) => void {
    return function(...args: [...any[], Callback]): void {
        const callback = args[args.length - 1];
        original(...args.slice(0, -1)).then((value: any) => callback(null, value)).catch((reason) => callback(reason instanceof Error ? 
        reason : new Error(reason), null));
    };
}

export function debuglog(section: string, callback: (message: string) => void = console.log): ((message: string) => void) & {enabled: boolean} {
    let env = (__fakeNode_process__ as BashProcess).env;
    if (typeof env.NODE_DEBUG === 'string' && env.NODE_DEBUG.includes(section)) {
        return Object.assign(function(message: string): void {
            callback(`${env.NODE_DEBUG.toUpperCase()} ${__fakeNode_process__.pid}: ${message}`);
        }, {enabled: true});
    } else {
        return Object.assign(() => {}, {enabled: true});
    }
}

export {debuglog as debug};

export function deprecate(fn: Function, msg: string, code?: string): Function {
    return function(...args: any[]): any {
        emitWarning('DeprecationWarning', {type: msg, code: code});
        return fn(...args);
    }
}

export function format(format: string, ...args: unknown[]) {
    return formatWithOptions({}, format, ...args);
}

export function formatWithOptions(inspectOptions: InspectOptions, format: string, ...args: unknown[]): string {
    let out = '';
    let i = 0;
    let j = 0;
    while (i < format.length && j < args.length) {
        if (format[i] === '%') {
            i++;
            const type = format[i];
            const value = args[j];
            j++;
            if (type === 's') {
                if (typeof value === 'bigint') {
                    out += value + 'n';
                } else if (value === 0 && 1 / value === -Infinity) {
                    out += '-0';
                } else if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
                    out += inspect(value, {depth: 0, colors: false, compat: 3});
                } else {
                    out += String(i);
                }
            } else if (type === 'd') {
                if (typeof value === 'bigint') {
                    out += value + 'n';
                } else if (typeof value === 'symbol') {
                    out += value.toString();
                } else {
                    out += Number(value);
                }
            } else if (type === 'i') {
                if (typeof value === 'bigint') {
                    out += value + 'n';
                } else if (typeof value === 'symbol') {
                    out += value.toString();
                } else {
                    out += parseInt(String(value), 10);
                }
            } else if (type === 'f') {
                if (typeof value === 'symbol') {
                    out += value.toString();
                } else {
                    out += parseFloat(String(value));
                }
            } else if (type === 'j') {
                try {
                    out += JSON.stringify(value);
                } catch (error) {
                    if (error instanceof TypeError && (error.message.includes('circular') || error.message.includes('cyclic'))) {
                        out += '[Circular]';
                    } else {
                        throw error;
                    }
                }
            } else if (type === 'o') {
                out += inspect(value, {showHidden: true, showProxy: true});
            } else if (type === 'O') {
                out += inspect(value, inspectOptions);
            } else {
                j--;
            }
        } else {
            out += format[i];
        }
        i++;
    }
    return out + format.slice(i);
}

type CallSites = {functionName: string, scriptName: string, scriptId: string, lineNumber: number, columnNumber: number}[];

export function getCallSites(options?: {sourceMap?: boolean}): CallSites;
export function getCallSites(frameCount: number, options?: {sourceMap?: boolean}): CallSites;
export function getCallSites(frameCountOrOptions?: number | {sourceMap?: boolean}, options: {sourceMap?: boolean} = {}): CallSites {
    throw new TypeError('util.getCallSites is not supported in fake-node');
}

export function getSystemErrorName(error: number): string {
    throw new TypeError('util.getSystemErrorName is not supported in fake-node');
}

export function getSystemErrorMap(): Map<number, string> {
    throw new TypeError('util.getSystemErrorMap is not supported in fake-node');
}

export function getSystemErrorMessage(error: number): string {
    throw new TypeError('util.getSystemErrorMessage is not supported in fake-node');
}

export function inherits(constructor: Function, superConstructor: Function) {
    Object.setPrototypeOf(constructor.prototype, superConstructor.prototype);
}

interface InspectOptions {

}

export function inspect(value: unknown, options: InspectOptions = {}): string {
    throw new TypeError('util.inspect is not supported in fake-node');
}

export function isDeepStrictEqual(val1: unknown, val2: unknown): boolean {
    if ((typeof val1 === 'object' && val1 !== null) || typeof val1 === 'function') {
        if (!(typeof val2 === 'object' && val2 !== null) && !(typeof val2 === 'function')) {
            return false;
        }
        if ((Symbol.toStringTag in val1 && Symbol.toStringTag in val2) && val1[Symbol.toStringTag] !== val2[Symbol.toStringTag]) {
            return false;
        }
        if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2)) {
            return false;
        }
        if (val1 instanceof Map) {
            if (!(val2 instanceof Map)) {
                throw new TypeError(`this error should not occur`);
            }
            for (const [key, value] of val1.entries()) {
                if (!val2.has(key)) {
                    return false;
                }
                return isDeepStrictEqual(value, val2.get(key));
            }
        }
        if (val1 instanceof Set) {
            if (!(val2 instanceof Set)) {
                throw new TypeError(`this error should not occur`);
            }
            for (const item of val1) {
                let found = false;
                for (const item2 of val2) {
                    if (item === item2) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
            }
            return true;
        }
        const properties = Reflect.ownKeys(val1);
        const val2Properties = (Object.getOwnPropertyNames(val2) as (string | symbol)[]).concat(Object.getOwnPropertySymbols(val2));
        if (!properties.every((prop: string | symbol) => val2Properties.includes(prop))) {
            return false;
        }
        for (const property of properties) {
            // @ts-ignore
            if (!isDeepStrictEqual(val1[property], val2[property])) {
                return false;
            }
        }
        if (types.isBoxedPrimitive(val1)) {
            if (!types.isBoxedPrimitive(val2)) {
                return false;
            }
            return Object.is(val1.constructor(val1), val2.constructor(val2));
        }
        return true;
    } else if ((typeof val2 === 'object' && val2 !== null) || typeof val2 === 'function') {
        return false;
    } else {
        return Object.is(val1, val2);
    }
}

export class MIMEType {

    constructor() {
        throw new TypeError('util.MIMEType is not supported in fake-node');
    }

}

export class MIMEParams {

    constructor() {
        throw new TypeError('util.MIMEParams is not supported in fake-node');
    }

}

interface ParseArgsConfig {
    args?: string[];
    options: {
        [key: string]: {
            short?: string;
        } & (({multiple: false} & ({
                type: 'string';
                default?: string;
            } | {
                type: 'boolean';
                default?: boolean;
            })) | ({multiple: true} & ({
                type: 'string';
                default?: string[];
            } | {
                type: 'boolean';
                default?: boolean[];
            }))
        );
    };
    strict?: boolean;
    allowPositionals?: boolean;
    allowNegative?: boolean;
    tokens?: boolean;
}

export function parseArgs(config?: ParseArgsConfig): {values: {[key: string]: string | boolean}, positionals: string[], tokens?: object[]} {
    throw new TypeError('util.parseArgs is not supported in fake-node');
}

export function parseEnv(content: string): {[key: string]: string} {
    throw new TypeError('util.parseEnv is not supported in fake-node');
}

export function promisify(original: ((...args: [...any[], Callback]) => void) & {[func: typeof promisify.custom]: (...args: any[]) => Promise<any>}): (...args: any[]) => Promise<any> {
    if (promisify.custom in original) {
        return original[promisify.custom];
    }
    return function(...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            original(args, (error: Error | null, value: unknown) => {
                if (error instanceof Error) {
                    reject(error);
                } else {
                    resolve(value);
                }
            });
        });
    };
}
promisify.custom = Symbol.for('nodejs.util.promisify.custom');

export function stripVTControlCharacters(str: string): string {
    throw new TypeError('util.stripVTControlCharacters is not supported in fake-node');
}

export function styleText(format: string | Array<unknown>, text: string, options?: {validateStream: boolean, stream: unknown}): string {
    throw new TypeError('util.styleText is not supported in fake-node');
}

const TextDecoder_ = TextDecoder;
const TextEncoder_ = TextEncoder;
export {
    TextDecoder_ as TextDecoder,
    TextEncoder_ as TextEncoder,
};

export function toUSVString(string: string): string {
    let out = '';
    for (let i = 0; i < string.length; i++) {
        const code = string.charCodeAt(i);
        if (code >= 0xD800 && code < 0xDFFF) {
            out += '\uFFFD';
        } else {
            out += string[i];
        }
    }
    return out;
}

export function transferableAbortController(): AbortController {
    throw new TypeError('util.transferableAbortController is not supported in fake-node');
}

export function transferableAbortSignal(): AbortSignal {
    throw new TypeError('util.transferableAbortSignal is not supported in fake-node');
}

export function aborted(signal: AbortSignal, resource: object): Promise<undefined> {
    throw new TypeError('util.aborted is not supported in fake-node');
}

export const types = {

    isAnyArrayBuffer(value: unknown): value is (ArrayBuffer | SharedArrayBuffer) {
        return types.isArrayBuffer(value) || types.isSharedArrayBuffer(value);
    },

    isArrayBufferView(value: unknown): value is (DataView | TypedArray) {
        return ArrayBuffer.isView(value);
    },

    isArgumentsObject(value: unknown): value is typeof arguments {
        if (typeof value !== 'object' || value === null || !('length' in value) || !('callee' in value)) {
            return false;
        }
        try {
            value.callee;
            return false;
        } catch (error) {
            if (error instanceof Error && (error.message === "TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them" || error.message === "TypeError: 'arguments', 'callee', and 'caller' cannot be accessed in this context.")) {
                return types.isProxy(value) !== true;
            } else {
                throw error;
            }
        }
    },

    isArrayBuffer(value: unknown): value is ArrayBuffer {
        return value instanceof ArrayBuffer;
    },

    isAsyncFunction(value: unknown): value is (...args: unknown[]) => Promise<unknown> {
        return value instanceof (async () => {}).constructor;
    },

    isBigInt64Array(value: unknown): value is BigInt64Array {
        return value instanceof BigInt64Array;
    },

    isBigIntObject(value: unknown): boolean {
        return value instanceof Object(0n).constructor;
    },

    isBigUint64Array(value: unknown): value is BigUint64Array {
        return value instanceof BigUint64Array;
    },

    isBooleanObject(value: unknown): value is Boolean {
        return value instanceof Boolean;
    },

    isBoxedPrimitive(value: unknown): value is Boolean | Number | String {
        return value instanceof Boolean || value instanceof Number || value instanceof String || value instanceof Object(0n).constructor || value instanceof Object(Symbol()).constructor;
    },

    isCryptoKey(value: unknown): value is CryptoKey {
        return value instanceof CryptoKey;
    },

    isDataView(value: unknown): value is DataView {
        return value instanceof DataView;
    },

    isDate(value: unknown): value is Date {
        return value instanceof Date;
    },

    isExternal(value: unknown): boolean {
        return false;
    },

    isFloat32Array(value: unknown): value is Float32Array {
        return value instanceof Float32Array;
    },

    isFloat64Array(value: unknown): value is Float64Array {
        return value instanceof Float64Array;
    },

    isGeneratorFunction(value: unknown): value is GeneratorFunction {
        return value instanceof (function*() {}).constructor;
    },

    isGeneratorObject(value: unknown): value is Generator {
        return value?.constructor === (function*() {}).constructor.prototype;
    },

    isInt8Array(value: unknown): value is Int8Array {
        return value instanceof Int8Array;
    },

    isInt16Array(value: unknown): value is Int16Array {
        return value instanceof Int16Array;
    },

    isInt32Array(value: unknown): value is Int32Array {
        return value instanceof Int32Array;
    },

    isKeyObject(value: unknown): boolean {
        return false;
    },

    isMap(value: unknown): value is Map<unknown, unknown> {
        return value instanceof Map;
    },

    isMapIterator(value: unknown): value is MapIterator<unknown> {
        return value instanceof (new Map()).keys().constructor;
    },

    isModuleNamespaceObject(value: unknown): boolean {
        if (typeof value !== 'object' || value === null) {
            return false;
        }
        return Object.isSealed(value) && Object.getOwnPropertyDescriptor(value, Object.keys(value)[0])?.writable === true;
    },

    isNativeError(value: unknown): value is Error {
        return value instanceof Error;
    },

    isNumberObject(value: unknown): value is Number {
        return value instanceof Number;
    },

    isPromise(value: unknown): value is Promise<unknown> {
        return value instanceof Promise;
    },

    isProxy(value: unknown): boolean | 'maybe' {
        try {
            structuredClone(value);
            return false;
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'DataCloneError')) {
                throw error;
            }
        }
        if (shouldBeCloneable(value)) {
            return true;
        } else {
            return 'maybe';
        }
    },

    isRegExp(value: unknown): value is RegExp {
        return value instanceof RegExp;
    },

    isSet(value: unknown): value is Set<unknown> {
        return value instanceof Set;
    },

    isSetIterator(value: unknown): value is SetIterator<unknown> {
        return value instanceof (new Set()).keys().constructor;
    },

    isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
        return value instanceof SharedArrayBuffer;
    },

    isStringObject(value: unknown): value is String {
        return value instanceof String;
    },

    isSymbolObject(value: unknown): boolean {
        return value instanceof Object(Symbol()).constructor;
    },

    isTypedArray(value: unknown): value is TypedArray {
        return value instanceof Int8Array || value instanceof Uint8Array || value instanceof Int16Array || value instanceof Uint16Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Float32Array || value instanceof Float64Array || value instanceof BigInt64Array;
    },

    isUint8Array(value: unknown): value is Uint8Array {
        return value instanceof Uint8Array;
    },

    isUint8ClampedArray(value: unknown): value is Uint8ClampedArray {
        return value instanceof Uint8ClampedArray;
    },

    isUint16Array(value: unknown): value is Uint16Array {
        return value instanceof Uint16Array;
    },

    isUint32Array(value: unknown): value is Uint32Array {
        return value instanceof Uint32Array;
    },

    isWeakMap(value: unknown): value is WeakMap<WeakKey, unknown> {
        return value instanceof WeakMap;
    },

    isWeakSet(value: unknown): value is WeakSet<WeakKey> {
        return value instanceof WeakSet;
    },

};

export function _extend(target: Object, source: Object): Object {
    return Object.assign(target, source);
}

export function isArray(object: unknown): boolean {
    return Array.isArray(object);
}
