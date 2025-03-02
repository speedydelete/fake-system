
/// <reference path="../in_node.d.ts" />
import {type TypedArray} from './util';
import {dirname, basename, resolve} from './path';
import {Buffer, type BufferEncoding} from './buffer';
import {constants, parsePathArg, Directory, FileSystem} from 'fake-system/fs';
import type {PathArg, ModeArg, DataArg, TimeArg, Flag, Stats, BigIntStats, StatFs, BigIntStatFs} from 'fake-system/fs';

export {constants} from 'fake-system/fs';
export {Stats, BigIntStats, StatFs, BigIntStatFs} from 'fake-system/fs';


// export function accessSync(path: PathArg, mode: number = constants.F_OK) {
//     __fakeNode_system__.fs.get(path).access(mode);
// }

export function appendFileSync(path: PathArg, data: DataArg, {encoding = 'utf8', mode = 0o666, flag = 'a'}: {encoding?: BufferEncoding, mode: number, flag: string}) {
    __fakeNode_system__.fs.getRegular(path).append(data, encoding);
}

export function chmodSync(path: PathArg, mode: ModeArg): void {
    __fakeNode_system__.fs.get(path).chmod(mode);
}

export function chownSync(path: PathArg, uid: number, gid: number): void {
    __fakeNode_system__.fs.get(path).chown(uid, gid);
}

export function closeSync(fd: number): void {
    __fakeNode_system__.fs.fileDescriptors[fd] = null;
}

export function copyFileSync(src: PathArg, dest: PathArg, mode: number = 0): void {
    if ((mode & constants.COPYFILE_EXCL) === constants.COPYFILE_EXCL && __fakeNode_system__.fs.exists(dest)) {
        throw new TypeError(`${dest} exists`);
    }
    if ((mode & constants.COPYFILE_FICLONE_FORCE) === constants.COPYFILE_FICLONE_FORCE) {
        throw new TypeError('fake-node does not support copy-on-write');
    }
    __fakeNode_system__.fs.getRegular(dest).write(__fakeNode_system__.fs.getRegular(src).read());
}

export function existsSync(path: PathArg): boolean {
    return __fakeNode_system__.fs.exists(path);
}

export function fchmodSync(fd: number, mode: ModeArg): void {
    __fakeNode_system__.fs.getfd(fd).chmod(mode);
}

export function fchownsync(fd: number, uid: number, gid: number): void {
    __fakeNode_system__.fs.getfd(fd).chown(uid, gid);
}

export function fdatasyncSync(fd: number): void {
    return;
}

export function fstatSync(fd: number): Stats {
    return __fakeNode_system__.fs.getfd(fd).stat();
}

export function fsyncSync(fd: number): void {
    return;
}

export function ftruncateSync(fd: number, len: number): void {
    let file = __fakeNode_system__.fs.getfdRegular(fd);
    file.data = file.data.slice(0, len);
}

export function futimesSync(fd: number, atime: TimeArg, ctime: TimeArg): void {
    __fakeNode_system__.fs.getfd(fd).utimes(atime, ctime);
}

export function globSync(pattern: string | string[]): string[] {
    throw new TypeError('globs are not supported in fake-node');
}

export function lchmodSync(path: PathArg, mode: number): void {
    __fakeNode_system__.fs.lget(path).chmod(mode);
}

export function lchownSync(path: PathArg, uid: number, gid: number): void {
    __fakeNode_system__.fs.lget(path).chown(uid, gid);
}

export function lutimesSync(path: PathArg, atime: TimeArg, mtime: TimeArg): void {
    __fakeNode_system__.fs.lget(path).utimes(atime, mtime);
}

export function linkSync(existingPath: PathArg, newPath: PathArg): void {
    __fakeNode_system__.fs.getDir(dirname(parsePathArg(existingPath, __fakeNode_process__.cwd))).link(basename(parsePathArg(newPath, __fakeNode_process__.cwd)), __fakeNode_system__.fs.get(existingPath));
}

export function lstatSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: false, throwIfNoEntry: false}): Stats;
export function lstatSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: false, throwIfNoEntry: true}): Stats | undefined;
export function lstatSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: true, throwIfNoEntry: false}): BigIntStats;
export function lstatSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: true, throwIfNoEntry: true}): BigIntStats | undefined;
export function lstatSync(path: PathArg, {bigint = false, throwIfNoEntry = false}: {bigint?: boolean, throwIfNoEntry?: boolean} = {}): Stats | BigIntStats | undefined {
    if (!throwIfNoEntry && !__fakeNode_system__.fs.exists(path)) {
        return undefined;
    }
    // @ts-ignore // why is it doing this
    return __fakeNode_system__.fs.lget(path).stat(bigint);
}

export function mkdirSync(path: PathArg, options: {recursive?: boolean, mode?: ModeArg} | ModeArg = 0o777): void {
    let recursive: boolean;
    let mode: ModeArg;
    if (typeof options === 'number' || typeof options === 'string') {
        recursive = false;
        mode = options;
    } else {
        recursive = options.recursive ?? false;
        mode = options.mode ?? 0o777;
    }
    __fakeNode_system__.fs.mkdir(path, recursive, mode);
}

export function mkdtempSync(prefix: PathArg, options: {encoding?: string} | string = 'utf8'): void {
    throw new TypeError('fs.mkdtemp is not supported in fake-node');
}

export function opendirSync(path: PathArg, {encoding = 'utf8', bufferSize = 32, recursive = false}: {encoding?: string, bufferSize?: number, recursive?: boolean} = {}): void {
    throw new TypeError('fs.opendir is not supported in fake-node');
}

export function openSync(path: PathArg, flags: Flag, mode: ModeArg = 'r'): number {
    return __fakeNode_system__.fs.open(path, flags, mode);
}

export function readdirSync(path: PathArg, options: {encoding?: string, withFileTypes?: boolean, recursive?: boolean} | string = 'utf8') {
    throw new TypeError('fs.readdir is not supported in fake-node');
}

export function readFileSync(path: PathArg, options: {encoding?: null | 'buffer', flag?: string} | 'buffer'): Buffer;
export function readFileSync(path: PathArg, options: {encoding: BufferEncoding, flag?: string} | BufferEncoding): string;
export function readFileSync(path: PathArg, options: {encoding?: BufferEncoding | null | 'buffer', flag?: string} | BufferEncoding | 'buffer' = {encoding: null, flag: 'r'}): string | Buffer {
    // @ts-ignore // why is it doing this
    return __fakeNode__.fs.getRegular(path).read(typeof options === 'string' ? options : options.encoding ?? 'buffer');
}

export function readlinkSync(path: PathArg, options: {encoding?: string} | string = 'utf8'): string | Buffer {
    throw new TypeError('fs.readlink is not supported in fake-node');
}

export function readSync(fd: number, buffer: Buffer | TypedArray | DataView, offset: number, length: number, position: number | bigint | null = null): number {
    position = Number(position ?? 0);
    const data = __fakeNode_system__.fs.getfdRegular(fd).read('uint8array', offset, length);
    if (buffer instanceof DataView) {
        for (let i = position; i < data.length; i++) {
            buffer.setUint8(i, data[i]);
        }
    } else {
        // @ts-ignore // why is it doing this
        buffer.set(data, position);
    }
    return length;
}

export function readvSync(fd: number, buffers: ArrayBufferView[], position: number | null = null): number {
    throw new TypeError('fs.readv is not supported in fake-node');
}

export function realpathSync(path: PathArg, {encoding}: {encoding: string} = {encoding: 'utf8'}): string {
    return resolve(parsePathArg(path, __fakeNode_process__.cwd));
}
realpathSync.native = realpathSync;

export function renameSync(oldPath: PathArg, newPath: PathArg): void {
    const parsedOldPath = parsePathArg(oldPath, __fakeNode_process__.cwd);
    const parsedNewPath = parsePathArg(newPath, __fakeNode_process__.cwd);
    const file = __fakeNode_system__.fs.getDir(dirname(parsedOldPath)).unlink(basename(parsedOldPath));
    __fakeNode_system__.fs.getDir(dirname(parsedNewPath)).link(basename(parsedNewPath), file);
}

export function rmdirSync(path: PathArg): void {
    const file = __fakeNode_system__.fs.get(path);
    if (!(file instanceof Directory)) {
        throw new TypeError(`cannot remove directory ${path}: is not a directory`);
    } else if (!(file.size === 0)) {
        throw new TypeError(`cannot remove directory ${path}: is not empty`);
    }
    __fakeNode_system__.fs.unlink(path);
}

export function rmSync(path: PathArg): void {
    __fakeNode_system__.fs.unlink(path);
}

export function statSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: false, throwIfNoEntry: false}): Stats;
export function statSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: false, throwIfNoEntry: true}): Stats | undefined;
export function statSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: true, throwIfNoEntry: false}): BigIntStats;
export function statSync(path: PathArg, {bigint, throwIfNoEntry}: {bigint?: true, throwIfNoEntry: true}): BigIntStats | undefined;
export function statSync(path: PathArg, {bigint = false, throwIfNoEntry = false}: {bigint?: boolean, throwIfNoEntry?: boolean} = {}): Stats | BigIntStats | undefined {
    if (!throwIfNoEntry && !__fakeNode_system__.fs.exists(path)) {
        return undefined;
    }
    // @ts-ignore // why is it doing this
    return __fakeNode__.fs.get(path).stat(bigint);
}

export function statfsSync(path: PathArg, {bigint}: {bigint?: false}): StatFs;
export function statfsSync(path: PathArg, {bigint}: {bigint?: true}): BigIntStatFs;
export function statfsSync(path: PathArg, {bigint = false}: {bigint?: boolean} = {}): StatFs | BigIntStatFs {
    let file = __fakeNode_system__.fs.get(path);
    if (!(file instanceof FileSystem)) {
        throw new TypeError(`cannot get fs stat for ${path}: is not a file system`);
    }
    // @ts-ignore // why is it doing this
    return file.statfs(bigint);
}

export function symlinkSync(target: PathArg, path: PathArg): void {
    __fakeNode_system__.fs.symlink(target, path);
}

export function truncateSync(path: PathArg, len: number = 0): void {
    let file = __fakeNode_system__.fs.getRegular(path);
    file.data = file.data.slice(0, len);
}

export function unlinkSync(path: PathArg): void {
    __fakeNode_system__.fs.unlink(path);
}

export function utimesSync(path: PathArg, atime: TimeArg, mtime: TimeArg) {
    __fakeNode_system__.fs.get(path).utimes(atime, mtime);
}
