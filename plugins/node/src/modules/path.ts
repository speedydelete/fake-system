
/// <reference path="../in_node.d.ts" />


export interface PathObject {
    dir: string;
    root: string;
    base: string;
    name: string;
    ext: string;
};


abstract class PathModule {

    abstract sep: string;
    abstract delimiter: string;
    abstract _normalizeSplit: string | RegExp;

    basename(path: string, suffix?: string): string {
        const split = path.split(this.sep);
        let out = split[split.length - 1];
        if (suffix !== undefined && out.endsWith(suffix)) {
            out = out.slice(0, out.length - suffix.length);
        }
        return out;
    }

    dirname(path: string): string {
        return path.split('/').slice(0, -1).join('/');
    }

    extname(path: string): string {
        let pos = path.indexOf('.');
        if (pos === -1) {
            return '';
        } else {
            return path.slice(pos);
        }
    }
    
    format(path: string): string {
        throw new TypeError('path.format is not supported in fake-node');
    }

    matchesGlob(path: string, pattern: string): boolean {
        throw new TypeError('path.matchesGlob is not supported in fake-node');
    }

    abstract isAbsolute(path: string): boolean;

    join(...paths: string[]) {
        return this.normalize(paths.join(this.sep));
    }

    normalize(path: string): string {
        let out: string[] = [];
        for (const segment of path.split(this._normalizeSplit)) {
            if (segment === '' || segment === '.') {
                continue;
            } else if (segment === '..') {
                out.pop();
            } else {
                out.push(segment);
            }
        }
        return out.join(this.sep);
    }

    parse(path: string): PathObject {
        throw new TypeError('path.parse is not supported in fake-node');
    }

    relative(from: string, to: string): string {
        throw new TypeError('path.relative is not supported in fake-node');
    }

    resolve(...paths: string[]): string {
        let out = '';
        for (let i = paths.length - 1; i > 0; i--) {
            out += paths[i];
            if (this.isAbsolute(out)) {
                return out;
            }
        }
        return __fakeNode_process__.cwd + out;
    }

    abstract toNamespacedPath(path: string): string;

};


export const posix = new class extends PathModule {

    sep = '/';
    delimiter = ':';
    _normalizeSplit = '/';

    isAbsolute(path: string): boolean {
        return path.startsWith(this.sep);
    }

    toNamespacedPath(path: string): string {
        return path;
    }

};


export const win32 = new class extends PathModule {

    sep = '\\';
    delimiter = ';';
    _normalizeSplit = /\/|\\/;

    isAbsolute(path: string): boolean {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(path[0]) && path[1] === ':' && path[2] === this.sep;
    }

    toNamespacedPath(path: string): string {
        throw new TypeError('path.windows.toNamespacedPath is not supported in fake-node');
    }

};


export const basename = posix.basename;
export const delimiter = posix.delimiter;
export const dirname = posix.dirname;
export const extname = posix.extname;
export const format = posix.format;
export const matchesGlob = posix.matchesGlob;
export const isAbsolute = posix.isAbsolute;
export const join = posix.join;
export const normalize = posix.normalize;
export const parse = posix.parse;
export const relative = posix.relative;
export const resolve = posix.resolve;
export const sep = posix.sep;
export const toNamespacedPath = posix.toNamespacedPath;
