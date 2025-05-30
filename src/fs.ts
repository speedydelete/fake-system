
import type {Process, UserSession} from './plugins/bash';


export const F_OK = 0;
export const X_OK = 1;
export const W_OK = 2;
export const R_OK = 4;

export const COPYFILE_EXCL = 1;
export const COPYFILE_FICLONE = 2;
export const COPYFILE_FICLONE_FORCE = 4;

export const O_RDONLY = 1;
export const O_WRONLY = 2;
export const O_RDWR = O_RDONLY | O_WRONLY;
export const O_CREAT = 4;
export const O_EXCL = 8;
export const O_NOCTTY = 16;
export const O_TRUNC = 32;
export const O_APPEND = 64;
export const O_DIRECTORY = 128;
export const O_NOATIME = 256;
export const O_NOFOLLOW = 512;
export const O_SYNC = 1024;
export const O_DSYNC = 2048;
export const O_SYMLINK = 4096;
export const O_DIRECT = 8192;
export const O_NONBLOCK = 16384;
export const UV_FS_O_FILEMAP = 32768;

export const S_IMFT = 0xF000;
export const S_IFREG = 0x8000;
export const S_IFDIR = 0x4000;
export const S_IFCHR = 0x2000;
export const S_IFBLK = 0x6000;
export const S_IFIFO = 0x1000;
export const S_IFLNK = 0xA000;
export const S_IFSOCK = 0xC000;

export const S_IRWXU = 0o700;
export const S_IRUSR = 0o400;
export const S_IWUSR = 0o200;
export const S_IXUSR = 0o100;
export const S_IRWXG = 0o070;
export const S_IRGRP = 0o040;
export const S_IWGRP = 0o020;
export const S_IXGRP = 0o010;
export const S_IRWXO = 0o007;
export const S_IROTH = 0o004;
export const S_IWOTH = 0o002;
export const S_IXOTH = 0o001;

export const constants = {F_OK, X_OK, W_OK, R_OK, COPYFILE_EXCL, COPYFILE_FICLONE, COPYFILE_FICLONE_FORCE, O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_EXCL, O_NOCTTY, O_TRUNC, O_APPEND, O_DIRECTORY, O_NOATIME, O_NOFOLLOW, O_SYNC, O_DSYNC, O_SYMLINK, O_DIRECT, O_NONBLOCK, UV_FS_O_FILEMAP, S_IMFT, S_IFREG, S_IFDIR, S_IFCHR, S_IFBLK, S_IFIFO, S_IFLNK, S_IFSOCK, S_IRWXU, S_IRUSR, S_IWUSR, S_IXUSR, S_IRWXG, S_IRGRP, S_IWGRP, S_IXGRP, S_IRWXO, S_IROTH, S_IWOTH, S_IXOTH};


let encoder = new TextEncoder();
let decoder = new TextDecoder();
export let encode = encoder.encode.bind(encoder);
export let decode = decoder.decode.bind(decoder);


export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export class Buffer extends Uint8Array {

    toString(encoding: BufferEncoding = 'utf-8'): string {
        return (new TextDecoder(encoding)).decode(this);
    }

}


export function normalize(path: string): string {
    let out: string[] = [];
    for (let segment of path.split('/')) {
        if (segment === '' || segment === '.') {
            continue;
        } else if (segment === '..') {
            out.pop();
        } else {
            out.push(segment);
        }
    }
    return (path.startsWith('/') ? '/' : '') + out.join('/');
}

export function resolve(cwd: string, ...paths: string[]): string {
    let out = '';
    for (let i = paths.length - 1; i >= 0; i--) {
        out += '/' + paths[i];
        if (paths[i].startsWith('/')) {
            return out;
        }
    }
    return cwd + out;
}

export function join(...paths: string[]): string {
    return normalize(paths.join('/'));
}


export type PathArg = string | URL | Buffer;

export function parsePathArg(arg: PathArg, cwd: string): string {
    let out: string;
    if (typeof arg === 'string') {
        out = arg;
    } else if (arg instanceof Buffer) {
        out = arg.toString('utf-8');
    } else if (arg instanceof URL) {
        if (arg.protocol === 'file:') {
            out = arg.pathname;
            return normalize(resolve(cwd, arg.pathname));
        } else {
            throw new TypeError(`invalid file URL: ${arg}`);
        }
    } else {
        throw new TypeError(`invalid path: ${arg}`);
    }
    return normalize(resolve(cwd, out));
}

const FLAGS = {
    'a': O_CREAT | O_APPEND,
    'ax': O_CREAT | O_EXCL | O_APPEND,
    'a+': O_RDONLY | O_CREAT | O_APPEND,
    'ax+': O_RDONLY | O_CREAT | O_EXCL | O_APPEND,
    'as': O_CREAT | O_APPEND | O_SYNC,
    'as+': O_RDONLY | O_CREAT | O_APPEND | O_SYNC,
    'r': O_RDONLY,
    'rs': O_RDONLY | O_SYNC,
    'r+': O_RDONLY | O_WRONLY,
    'rs+': O_RDONLY | O_WRONLY | O_SYNC,
    'w': O_WRONLY | O_CREAT | O_TRUNC,
    'wx': O_WRONLY | O_CREAT | O_EXCL | O_TRUNC,
    'w+': O_RDONLY | O_WRONLY | O_CREAT | O_TRUNC,
    'wx+': O_RDONLY | O_WRONLY | O_CREAT | O_EXCL | O_TRUNC,
}

export type Flag = number | keyof typeof FLAGS;

export function parseFlag(flag: Flag): number {
    if (typeof flag === 'string') {
        return FLAGS[flag];
    } else {
        return flag;
    }
}

export type TimeArg = number | string | bigint | Date;

export function parseTimeArg(time: TimeArg): number {
    if (typeof time === 'number') {
        return time;
    } else if (typeof time === 'bigint') {
        return Number(time);
    } else if (typeof time === 'string') {
        let timestamp = Date.parse(time);
        if (Number.isNaN(timestamp)) {
            timestamp = parseInt(time);
            if (Number.isNaN(timestamp)) {
                throw new TypeError(`invalid time argument ${time}`);
            } else {
                return timestamp / 1000;
            }
        } else {
            return timestamp / 1000;
        }
    } else if (time instanceof Date) {
        return time.valueOf() / 1000;
    } else {
        throw new TypeError(`invalid time value: ${time}`);
    }
}


type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;

export type DataArg = string | TypedArray | DataView | Iterable<any>;

export function parseDataArg(data: DataArg, encoding: BufferEncoding = 'utf8'): Uint8Array {
    if (typeof data === 'string') {
        if (encoding === 'utf8') {
            return encode(data);
        } else {
            // @ts-ignore
            return new Uint8Array(Buffer.from(data, encoding));
        }
    } else if (data instanceof DataView || data instanceof Int8Array || data instanceof Uint8Array || data instanceof Uint8ClampedArray || data instanceof Int16Array || data instanceof Uint16Array || data instanceof Int32Array || data instanceof Uint32Array || data instanceof Float32Array || data instanceof Float64Array || data instanceof BigInt64Array || data instanceof BigUint64Array) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data !== null && typeof data[Symbol.iterator] === 'function') {
        return new Uint8Array(data);
    } else {
        throw new TypeError(`invalid binary data: ${data}`);
    }
}

export type ModeArg = string | number;

const OCTAL_MODE_REGEX = /[0-7]{3}/;
const STRING_MODE_ARG_REGEX = /^([r-][w-][x-]){3}$/;

export function parseModeArg(mode: ModeArg): number {
    if (typeof mode === 'number') {
        return mode < 0o777 ? mode << 3 : mode;
    } else if (mode.match(OCTAL_MODE_REGEX)) {
        mode = parseInt(mode, 8);
        return mode < 0o777 ? mode << 3 : mode;
    } else if (mode.match(STRING_MODE_ARG_REGEX)) {
        // @ts-ignore
        return parseInt('0b' + mode.replaceAll('-', '0').replace(/[rwx]/g, '1')) << 3;
    } else {
        throw new TypeError(`invalid mode: ${mode}`)
    }
}


abstract class BaseStats {

    abstract mode: number | bigint;

    isBlockDevice() {
        return (Number(this.mode) & S_IFBLK) === S_IFBLK;
    }

    isCharacterDevice() {
        return (Number(this.mode) & S_IFCHR) === S_IFCHR;
    }

    isDirectory() {
        return (Number(this.mode) & S_IFDIR) === S_IFDIR;
    }

    isFIFO() {
        return (Number(this.mode) & S_IFIFO) === S_IFIFO;
    }

    isFile() {
        return (Number(this.mode) & S_IFREG) === S_IFREG;
    }

    isSocket() {
        return (Number(this.mode) & S_IFSOCK) === S_IFSOCK;
    }

    isSymbolicLink() {
        return (Number(this.mode) & S_IFLNK) === S_IFLNK;
    }

}


export type ExportFormatVersion = 1;
export const CURRENT_EXPORT_FORMAT_VERSION: ExportFormatVersion = 1;

export interface FileParams {
    mode?: number;
    uid: number;
    gid: number;
}

export interface FileMetadata {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    birthtime: number;
    atime: number;
    mtime: number;
    ctime: number;
}

export class FileObject implements FileMetadata {

    mode: number;
    nlink: number = 0;
    uid: number;
    gid: number;
    birthtime: number;
    atime: number;
    mtime: number;
    ctime: number;
    rdev: number = -1;

    constructor({mode, uid, gid}: FileParams) {
        this.mode = mode ?? 0o6440;
        this.uid = uid;
        this.gid = gid;;
        this.birthtime = Math.round(performance.now() / 1000);
        this.atime = this.birthtime;
        this.mtime = this.birthtime;
        this.ctime = this.birthtime;
    }

    setAtime() {
        this.atime = Math.round(performance.now() / 1000);
    }

    setMtime() {
        this.mtime = Math.round(performance.now() / 1000);
    }

    setCtime() {
        this.ctime = Math.round(performance.now() / 1000);
    }

    chmod(mode: string | number): void {
        mode = parseModeArg(mode);
        this.mode &= 0o170007;
        this.mode |= mode << 3;
        this.setCtime();
    }

    chown(uid: number, gid: number): void {
        this.uid = uid;
        this.gid = gid;
        this.setCtime();
    }

    cp(): FileObject {
        return new FileObject({mode: this.mode, uid: this.uid, gid: this.gid});
    }

    cpr(): FileObject {
        return this.cp();
    }

    get size(): number {
        return 0;
    }

    utimes(atime: TimeArg | undefined, mtime: TimeArg | undefined) {
        if (atime !== undefined) {
            this.atime = parseTimeArg(atime);
        }
        if (mtime !== undefined) {
            this.mtime = parseTimeArg(mtime);
        }
    }

    _export(): Uint8Array {
        let buffer = new ArrayBuffer(10);
        let view = new DataView(buffer);
        view.setUint16(0, this.mode, true);
        view.setUint16(2, this.uid, true);
        view.setUint16(4, this.gid, true);
        view.setUint32(6, this.size, true);
        return new Uint8Array(buffer);
    }

    static _import(data: Uint8Array, version: ExportFormatVersion = CURRENT_EXPORT_FORMAT_VERSION): FileMetadata {
        let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        return {
            mode: view.getUint16(0, true),
            uid: view.getUint16(2, true),
            gid: view.getUint16(4, true),
            size: view.getUint32(6, true),
            birthtime: 0,
            atime: 0,
            mtime: 0,
            ctime: 0,
        };
    }

    export(): Uint8Array {
        return this._export();
    }

}

export class RegularFile extends FileObject {

    data: Uint8Array;

    constructor(data: DataArg, {mode = 0o6440, encoding, ...params}: FileParams & {encoding?: BufferEncoding}) {
        super({mode: mode | S_IFREG, ...params});
        this.data = parseDataArg(data, encoding);
    }

    cp(): RegularFile {
        return new RegularFile(new Uint8Array(this.data), {mode: this.mode, uid: this.uid, gid: this.gid});
    }

    read(encoding?: BufferEncoding, start?: number, length?: number): string;
    read(encoding: 'uint8array', start?: number, length?: number): Uint8Array;
    read(encoding: 'buffer', start?: number, length?: number): Buffer;
    read(encoding: BufferEncoding | 'uint8array' | 'buffer' = 'utf8', start: number = 0, length?: number): string | Uint8Array | Buffer {
        let data = this.data.slice(start, length);
        if (encoding === 'uint8array') {
            return data;
        } else if (encoding === 'buffer') {
            return Buffer.from(data);
        } else if (encoding === 'utf8') {
            return decoder.decode(data);
        } else {
            return (new TextDecoder(encoding)).decode(data);
        }
    }

    write(data: string, position?: number, encoding?: BufferEncoding): void;
    write(data: TypedArray | DataView | Iterable<any>, offset?: number, length?: number): void;
    write(data: DataArg, position?: number, encoding_or_length?: number | BufferEncoding): void {
        let encoding = typeof encoding_or_length === 'string' ? encoding_or_length : 'utf8';
        let length = typeof encoding_or_length === 'number' ? encoding_or_length : undefined;
        let array = parseDataArg(data, encoding);
        if (!position && length === undefined) {
            this.data = array;
        } else if (length === undefined) {
            this.data.set(array, position);
        } else {
            this.data.set(array.slice(0, length), position);
        }
        this.setMtime();
    }

    append(data: DataArg, encoding: BufferEncoding = 'utf8'): void {
        let array = parseDataArg(data, encoding);
        let newData = new Uint8Array(this.data.length + array.length);
        newData.set(this.data, 0);
        newData.set(array, this.data.length);
        this.data = newData;
        this.setMtime();
    }

    get size(): number {
        return this.data.length;
    }

    export(): Uint8Array {
        let out = new Uint8Array(10 + this.size);
        out.set(this._export(), 0);
        out.set(this.data, 10);
        return out;
    }

    static import(data: Uint8Array, version: ExportFormatVersion = CURRENT_EXPORT_FORMAT_VERSION): RegularFile {
        let info = this._import(data, version);
        let out = new RegularFile(data.slice(10, 10 + info.size), info);
        out.atime = info.atime;
        out.mtime = info.mtime;
        out.ctime = info.ctime;
        out.birthtime = info.birthtime;
        return out;
    }

}


export class SymbolicLink extends FileObject {

    rootDir: Directory | null;
    path: string;
    linkedTo?: FileObject;

    constructor(rootDir: Directory | null, path: string, {mode = 0o6440, ...params}: FileParams) {
        super({mode: mode | S_IFLNK, ...params});
        this.rootDir = rootDir;
        this.path = path;
        if (rootDir !== null) {
            this.linkedTo = rootDir.get(path);
        }
    }

    cp(): SymbolicLink {
        return new SymbolicLink(this.rootDir, this.path, {mode: this.mode, uid: this.uid, gid: this.gid});
    }

    get size(): number {
        return this.path.length;
    }

    export(): Uint8Array {
        let out = new Uint8Array(10 + this.size);
        out.set(this._export(), 0);
        out.set(encode(this.path), 10);
        return out;
    }

    static import(data: Uint8Array, version: ExportFormatVersion = CURRENT_EXPORT_FORMAT_VERSION): SymbolicLink {
        let info = this._import(data, version);
        let out = new SymbolicLink(null, decode(data.slice(10, 10 + info.size)), info);
        out.atime = info.atime;
        out.mtime = info.mtime;
        out.ctime = info.ctime;
        out.birthtime = info.birthtime;
        return out;
    }

}


export type DeviceReader = (position: number, length: number) => Uint8Array;
export type DeviceWriter = (data: Uint8Array, position: number, length?: number) => void;
export type DeviceExecutor = (process: Process, session: UserSession) => void;

export class Device extends FileObject {

    reader: DeviceReader;
    writer: DeviceWriter;
    executor: DeviceExecutor;

    constructor(reader: DeviceReader, writer: DeviceWriter, executor: DeviceExecutor, {mode = 0o6440, ...params}: FileParams) {
        super({mode: mode | S_IFCHR, ...params});
        this.reader = reader;
        this.writer = writer;
        this.executor = executor;
    }

    cp(): Device {
        return new Device(this.reader, this.writer, this.executor, {mode: this.mode, uid: this.uid, gid: this.gid});
    }

    read(length: number, encoding?: BufferEncoding, start?: number): string;
    read(length: number, encoding: 'uint8array', start?: number): Uint8Array;
    read(length: number, encoding: 'buffer', start?: number): Buffer;
    read(length: number, encoding: BufferEncoding | 'uint8array' | 'buffer' = 'utf8', start: number = 0): string | Uint8Array | Buffer {
        let data = this.reader(start, length);
        if (encoding === 'uint8array') {
            return data;
        } else if (encoding === 'buffer') {
            return Buffer.from(data);
        } else {
            return (new TextDecoder(encoding)).decode(data);
        }
    }

    write(data: string, position?: number, encoding?: BufferEncoding): void;
    write(data: TypedArray | DataView | Iterable<any>, offset?: number, length?: number): void;
    write(data: DataArg, position: number = 0, encoding_or_length?: number | BufferEncoding): void {
        let encoding = typeof encoding_or_length === 'string' ? encoding_or_length : 'utf8';
        let length = typeof encoding_or_length === 'number' ? encoding_or_length : undefined;
        let array = parseDataArg(data, encoding);
        this.writer(array, position, length);
        this.setMtime();
    }

    export(): Uint8Array {
        throw new TypeError('devices are not exportable');
    }

    static import(data: Uint8Array, version: ExportFormatVersion = CURRENT_EXPORT_FORMAT_VERSION): RegularFile {
        throw new TypeError('devices are not exportable');
    }

}


export class Directory extends FileObject {

    rootDir: Directory;
    absPath: string = '/';
    files: Map<string, FileObject>;

    constructor(rootDir: Directory | null, files: Map<string, FileObject>, {mode, ...params}: FileParams);
    constructor(rootDir: Directory | null, files: {[key: string]: FileObject}, {mode, ...params}: FileParams);
    constructor(rootDir: Directory | null, files: MapIterator<[string, FileObject]>, {mode, ...params}: FileParams);
    constructor(rootDir: Directory | null, files: Map<string, FileObject> | {[key: string]: FileObject} | MapIterator<[string, FileObject]> = new Map(), {mode = 0o7770, ...params}: FileParams) {
        super({mode: mode | S_IFDIR, ...params});
        this.rootDir = rootDir ?? this;
        if (files instanceof Map) {
            this.files = files;
        } else {
            this.files = new Map(Object.entries(files));
        }
    }

    [Symbol.iterator]() {
        return this.files.values();
    }

    cp(): Directory {
        return new Directory(this.rootDir, this.files.entries(), {mode: this.mode, uid: this.uid, gid: this.gid});
    }

    cpr(): Directory {
        return new Directory(this.rootDir, new Map(Array.from(this.files.entries()).map(([name, file]) => [name, file.cpr()])), {mode: this.mode, uid: this.uid, gid: this.gid});
    }

    get size(): number {
        return this.files.size;
    }

    get recursiveSize(): number {
        let out = this.files.size;
        for (let file of this.files.values()) {
            if (file instanceof Directory) {
                out += file.recursiveSize;
            }
        }
        return out;
    }

    lget(path: PathArg): FileObject {
        let parsed = parsePathArg(path, this.absPath);
        if (!parsed.startsWith(this.absPath)) {
            return this.rootDir.get(parsed.slice(1));
        } else {
            let segments = parsed.slice(this.absPath.length).split('/');
            let file: FileObject = this;
            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                if (file instanceof Directory) {
                    let newFile = file.files.get(segment);
                    if (newFile === undefined) {
                        throw new TypeError(`${'/' + segments.slice(0, i + 1).join('/')} does not exist`);
                    }
                    file = newFile;
                } else {
                    throw new TypeError(`${'/' + segments.slice(0, i).join('/')} is not a directory`);
                }
            }
            return file;
        }
    }

    get(path: PathArg, noDereference: boolean = false): FileObject {
        let out = this.lget(path);
        if (noDereference) {
            return out;
        }
        while (out instanceof SymbolicLink) {
            if (!out.linkedTo) {
                if (!out.rootDir) {
                    throw new TypeError('accessing uninitialized symbolic link');
                }
                out.linkedTo = out.rootDir.get(out.path);
            }
            out = out.linkedTo;
        }
        return out;
    }

    getRegular(path: PathArg): RegularFile {
        let file = this.get(path);
        if (!(file instanceof RegularFile)) {
            throw new TypeError(`${path} is not a regular file`);
        }
        return file as RegularFile;
    }

    getDir(path: PathArg): Directory {
        let file = this.get(path);
        if (!(file instanceof Directory)) {
            throw new TypeError(`${path} is not a directory`);
        }
        return file as Directory;
    }

    exists(path: PathArg): boolean {
        try {
            this.get(path);
            return true;
        } catch {
            return false;
        }
    }

    link(path: PathArg, file: FileObject): void {
        file.nlink++;
        if (file instanceof Directory) {
            file.rootDir = this.rootDir;
        }
        let parsed = parsePathArg(path, this.absPath);
        if (!parsed.startsWith(this.absPath)) {
            this.rootDir.link(parsed, file);
        } else {
            let relPath = parsed.slice(this.absPath.length);
            if (relPath.startsWith('/')) {
                relPath = relPath.slice(1);
            }
            if (relPath.includes('/')) {
                let parts = relPath.split('/');
                let dir = this.getDir(parts.slice(0, -1).join('/'));
                dir.files.set(parts[parts.length - 1], file);
            } else {
                this.files.set(relPath, file);
            }
        }
    }

    unlink(path: PathArg): FileObject {
        let parsed = parsePathArg(path, this.absPath);
        if (!parsed.startsWith(this.absPath)) {
            return this.rootDir.unlink(parsed.slice(1));
        }
        parsed = parsed.slice(this.absPath.length);
        let file = this.files.get(parsed);
        if (file === undefined) {
            throw new TypeError(`${path} does not exist`);
        }
        file.nlink--;
        this.files.delete(parsed);
        return file;
    }

    symlink(target: PathArg, path: PathArg): void {
        this.link(path, new SymbolicLink(this.rootDir, parsePathArg(target, this.absPath), {uid: this.uid, gid: this.gid}));
    }

    mkdir(path: PathArg, recursive: boolean = false, mode: ModeArg = 0o7770): Directory {
        let parsed = parsePathArg(path, this.absPath);
        if (!parsed.startsWith(this.absPath)) {
            return this.rootDir.mkdir(parsed.slice(1));
        }
        parsed = parsed.slice(this.absPath.length);
        if (recursive) {
            let segments = parsed.split('/');
            let file: Directory = this;
            for (let segment of segments) {
                if (!file.exists(segment)) {
                    file = file.mkdir(segment);
                } else {
                    file = file.getDir(segment);
                }
            }
            return file;
        } else {
            let file = new Directory(this.rootDir, new Map(), {uid: this.uid, gid: this.gid, mode: parseModeArg(mode)});
            file.absPath = join(this.absPath, parsed) + '/';
            this.link(parsed, file);
            return file;
        }
    }

    read(path: PathArg, encoding?: BufferEncoding, start?: number, length?: number): string;
    read(path: PathArg, encoding: 'uint8array', start?: number, length?: number): Uint8Array;
    read(path: PathArg, encoding: 'buffer', start?: number, length?: number): Buffer;
    read(path: PathArg, encoding: BufferEncoding | 'uint8array' | 'buffer' = 'utf8', start?: number, length?: number): string | Uint8Array | Buffer {
        // @ts-ignore
        return this.getRegular(path).read(encoding, start, length);
    }

    write(path: PathArg, data: string, position?: number, encoding?: BufferEncoding): void;
    write(path: PathArg, data: TypedArray | DataView | Iterable<any>, offset?: number, length?: number): void;
    write(path: PathArg, data: DataArg, position?: number, encoding_or_length?: number | BufferEncoding): void {
        if (this.exists(path)) {
            // @ts-ignore
            this.getRegular(path).write(data, position, encoding_or_length);
        } else {
            this.link(path, new RegularFile(data, {uid: this.uid, gid: this.gid}));
        }
    }

    addDevice(path: PathArg, {reader, writer, executor}: {reader?: DeviceReader, writer?: DeviceWriter, executor?: DeviceExecutor}): void {
        let parsed = parsePathArg(path, this.absPath);
        reader ??= () => {throw new TypeError(`${normalize(resolve(parsed))} is not readable`)};
        writer ??= () => {throw new TypeError(`${normalize(resolve(parsed))} is not writable`)};
        executor ??= () => {throw new TypeError(`${normalize(resolve(parsed))} is not executable`);}
        this.link(parsed, new Device(reader, writer, executor, {uid: this.uid, gid: this.gid}));
    }

    export(): Uint8Array {
        let entries = Array.from(this.files.entries()).map(([name, data]) => [encode(name), data.export()]);
        let size = entries.map(([name, data]) => 1 + name.length + data.length).reduce((x, y) => x + y);
        let out = new Uint8Array(10 + size);
        out.set(this._export(), 0);
        let offset = 10;
        for (let [name, data] of entries) {
            out[offset] = name.length;
            out.set(name, offset + 1);
            offset += 1 + name.length;
            out.set(data, offset);
            offset += data.length;
        }
        return out;
    }

    static import(data: Uint8Array, version: ExportFormatVersion = CURRENT_EXPORT_FORMAT_VERSION): Directory {
        let info = this._import(data, version);
        let offset = 10;
        let entries: [string, FileObject][] = [];
        for (let i = 0; i < info.size; i++) {
            let nameLength = data[offset];
            offset++;
            let name = decode(data.slice(offset, offset + nameLength));
            offset += nameLength;
            let meta = this._import(data.slice(offset, offset + 10), version);
            let fileData = data.slice(offset, offset + 10 + meta.size);
            offset += 10 + meta.size;
            let file: FileObject;
            if ((meta.mode & S_IFREG) === S_IFREG) {
                file = RegularFile.import(fileData);
            } else if ((meta.mode & S_IFDIR) === S_IFDIR) {
                file = Directory.import(fileData);
            } else {
                throw new TypeError(`invalid file mode: ${meta.mode}`);
            }
            entries.push([name, file]);
        }
        let out = new Directory(null, new Map(entries), info);
        out.atime = info.atime;
        out.mtime = info.mtime;
        out.ctime = info.ctime;
        out.birthtime = info.birthtime;
        return out;
    }

    fullExport(): Uint8Array {
        let data = this.export();
        let out = new Uint8Array(1 + data.length);
        out[0] = CURRENT_EXPORT_FORMAT_VERSION;
        out.set(data, 1);
        return out;
    }

    static fullImport(data: Uint8Array): Directory {
        return Directory.import(data.slice(1), (data[0] as ExportFormatVersion));
    }

}


export class FileSystem extends Directory {

    fileDescriptors: (FileObject | null)[] = [];

    constructor(files?: Map<string, FileObject>) {
        super(null, files ?? new Map(), {uid: 0, gid: 0});
    }

    getfd(fd: number): FileObject {
        let out = this.fileDescriptors[fd];
        if (out === null) {
            throw new TypeError(`file descriptor ${fd} is not accessible`);
        }
        return out;
    }

    getfdRegular(fd: number): RegularFile {
        let out = this.fileDescriptors[fd];
        if (out === null) {
            throw new TypeError(`file descriptor ${fd} is not accessible`);
        } else if (!(out instanceof RegularFile)) {
            throw new TypeError(`file descriptor ${fd} is not a regular file`);
        }
        return out;
    }

    open(path: PathArg, flags: Flag, mode: ModeArg = 'r'): number {
        return this.fileDescriptors.push(this.get(path));
    }

    export(): Uint8Array {
        return this.fullExport();
    }

    static import(data: Uint8Array): FileSystem {
        return new FileSystem(Directory.fullImport(data).files);
    }

}
