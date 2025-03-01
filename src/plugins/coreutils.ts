
import {constants, join, FileObject, RegularFile, Directory, SymbolicLink} from '../fs';
import type {System} from '../index';
import command from './command';


function recursively(file: FileObject, func: (file: FileObject, path: string) => void, recursive: boolean = true, path: string = ''): void {
    func(file, path);
    if (recursive && file instanceof Directory) {
        for (let [newPath, newFile] of file.files.entries()) {
            recursively(newFile, func, recursive, join(path, newPath));
        }
    }
}

function parseIntIfInt(value: string): string | number {
    return isNaN(parseInt(value)) ? value : parseInt(value);
}

let chgrp = command('chgrp', 'Change the group of FILE to GROUP')
    .argument('GROUP')
    .argument('FILE')
    .option('-R', '--recursive', 'operate on files and directories recursively')
    .func(({args, system}) => {
        recursively(system.fs.get(args.file), (file) => {
            file.chown(file.uid, system.um.getGroupData(parseIntIfInt(args.group)).gid);
        }, args.R === undefined);
    });

let chown = command('chgrp', 'Change the owner and/or group of each FILE to OWNER and/or GROUP.')
    .argument('[OWNER]', '[OWNER][:[GROUP]]')
    .argument('FILE')
    .option('-R', '--recursive', 'operate on files and directories recursively')
    .func(({args, system}) => {
        if (args.owner !== undefined) {
            let owner: number;
            let group: number;
            if (args.owner.includes(':')) {
                let parts = args.owner.split(':');
                owner = system.um.getUserData(parseIntIfInt(parts[0])).uid;
                group = system.um.getGroupData(parseIntIfInt(parts[1])).gid;
            } else {
                let ownerData = system.um.getUserData(parseIntIfInt(args.owner));
                owner = ownerData.uid;
                group = ownerData.gid;
            }
            recursively(system.fs.get(args.file), file => {
                file.chown(owner, group);
            }, args.R);
        }
    });

let chmod = command('chmod', 'Change the mode of each FILE to MODE.')
    .argument('MODE')
    .argument('FILE')
    .option('-R', '--recursive', 'operate on files and directories recursively')
    .func(({args, system}) => {
        recursively(system.fs.get(args.file), file => file.chmod(args.mode), Boolean(args.R));
    });

let cp = command('cp', 'Copy SOURCE(s) to DEST')
    .argument('SOURCE...')
    .argument('DEST')
    .option('-R', '--recursive', 'operate on files and directories recursively')
    .func(({args, system}) => {
        for (let source of args.source) {
            recursively(system.fs.get(source), (file, path) => {
                if (file instanceof RegularFile) {
                    system.fs.write(join(args.dest, path), file.read());
                }
            }, args.R);
        }
    });


let dircolors = command('dircolors', 'Output commands to set the LS_COLORS environment variable.')
    .argument('[FILE]')
    .option('-b', '--sh', 'output Bourne shell code to set LS_COLORS')
    .option('-c', '--csh', 'output C shell code to set LS_COLORS')
    .option('-p', '--print-database', 'output defaults')
    .option('--print-ls-colors', 'output fully escaped colors for display')
    .func(() => {}); // todo: make this


let ln = command('ln', 'Create a link to TARGET with the name LINK_NAME')
    .argument('TARGET')
    .argument('LINK_NAME')
    .option('-s', '--symbolic', 'make symbolic links instead of hard links')
    .func(({args, system}) => {
        system.fs.link(args.link_name, system.fs.get(args.target));
    });

const LS_FILE_CHARS = new Map([
    [constants.S_IFREG, '-'],
    [constants.S_IFBLK, 'b'],
    [constants.S_IFCHR, 'c'],
    [constants.S_IFDIR, 'd'],
    [constants.S_IFLNK, 'l'],
    [constants.S_IFIFO, 'p'],
    [constants.S_IFSOCK, 's'],
]);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let ls = command('ls', 'List information about the FILES (the current directory by default).')
    .argument('FILES...')
    .option('-a', '--all', 'do not ignore entries starting with .')
    .option('-A', '--almost-all', 'do not list implied . and ..')
    .option('-l', 'use a long listing format')
    .option('-R', '--recursive', 'use a long listing format')
    .func(({args, process, system}) => {
        let files: [string, FileObject][] = [];
        for (let path of (args.files.length === 0 ? Array.from(system.fs.getDir(process.cwd).files.keys()).map(path => join(process.cwd, path)) : args.files)) {
            if (!args.a && path.startsWith('.')) {
                continue;
            }
            let file = system.fs.lget(path);
            if (file instanceof Directory) {
                for (let subFile of file) {
                    recursively(subFile, (file, path) => {
                        if (args.a || !path.startsWith('.')) {
                            files.push([path, file]);
                        }
                    }, args.R);
                }
            } else {
                files.push([path, file]);
            }
        }
        if (args.l) {
            let data: [string, string, string, string, string, string][] = [];
            for (let [path, file] of files) {
                let mode = LS_FILE_CHARS.get(file.mode & constants.S_IMFT) as string;
                let fileMode = file.mode >> 3;
                mode += (fileMode & constants.S_IRUSR ? 'r' : '-') +
                        (fileMode & constants.S_IWUSR ? 'w' : '-') +
                        (fileMode & constants.S_IXUSR ? 'x' : '-') +
                        (fileMode & constants.S_IRGRP ? 'r' : '-') +
                        (fileMode & constants.S_IWGRP ? 'w' : '-') +
                        (fileMode & constants.S_IXGRP ? 'x' : '-') +
                        (fileMode & constants.S_IROTH ? 'r' : '-') +
                        (fileMode & constants.S_IWOTH ? 'w' : '-') +
                        (fileMode & constants.S_IXOTH ? 'x' : '-');
                let user = system.um.getUserData(file.uid).name;
                let group = system.um.getGroupData(file.uid).name;
                let mtime = (new Date(Number(file.mtime / 1000000n)));
                let mtimeString = `${MONTHS[mtime.getMonth() - 1]} ${mtime.getDay().toString().padStart(2, '0')} ${mtime.getHours().toString().padStart(2, '0')}:${mtime.getMinutes().toString().padStart(2, '0')}`;
                path = path.slice(path.lastIndexOf('/') + 1);
                if (file instanceof SymbolicLink) {
                    path += ` -> ${file.path}`;
                }
                data.push([mode, file.nlink.toString(), user, group, file.size.toString(), mtimeString + ' ' + path]);
            }
            let nlinkLength = Math.max(...data.map(row => row[1].length));
            let userLength = Math.max(...data.map(row => row[2].length));
            let groupLength = Math.max(...data.map(row => row[3].length));
            let sizeLength = Math.max(...data.map(row => row[4].length));
            process.stdout += data.map(row => `${row[0]} ${row[1].padStart(nlinkLength)} ${row[2].padStart(userLength)} ${row[3].padStart(groupLength)}  ${row[4].padStart(sizeLength)} ${row[5]}`).join('\n');
        } else {
            let paths = files.map(file => file[0]).map(file => file.slice(file.lastIndexOf('/') + 1));
            let maxPathLength = Math.max(...paths.map(path => path.length)) + 2;
            let pathsPerLine = Math.floor(80 / maxPathLength) || 1;
            let pathsOnLine = 0;
            for (let path of paths) {
                process.stdout += path;
                pathsOnLine++;
                if (pathsOnLine === pathsPerLine) {
                    process.stdout += '\n';
                    pathsOnLine = 0;
                } else {
                    process.stdout += '  ';
                }
            }
            if (!process.stdout.endsWith('\n')) {
                process.stdout += '\n';
            }
        }
    });

let mkdir = command('mkdir', 'Create the DIRECTORY(ies), if they do not already exist.')
    .argument('DIRECTORY...')
    .option('-m=mode', '--mode=mode', 'set file mode (as in chmod), not a=rwx - umask')
    .option('-p', '--parents', 'no error if existing, make parent directories as needed')
    .func(({args, system}) => {
        for (let directory of args.directory) {
            system.fs.mkdir(directory, args.p, args.m);
        }
    });

let mv = command('mv', 'Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.')
    .argument('SOURCE...')
    .argument('DEST')
    .option('-R', '--recursive', 'operate on files and directories recursively')
    .func(({args, system}) => {
        for (let source of args.source) {
            recursively(system.fs.get(source), (file, path) => {
                if (file instanceof RegularFile) {
                    system.fs.write(join(args.dest, path), file.read());
                } else if (file instanceof Directory) {
                    system.fs.mkdir(path);
                }
                system.fs.unlink(path);
            }, args.R);
        }
    });

let rm = command('rm', 'Remove (unlink) the FILE(s).')
    .argument('FILE...')
    .option('-r', '--recursive', 'remove directories and their contents recursively')
    .option('-d', '--dir', 'remove empty directories')
    .func(({args, system}) => {
        for (let path of args.file) {
            let file = system.fs.get(path);
            if (file instanceof Directory) {
                if (args.r) {
                    recursively(file, (file, path) => {
                        system.fs.unlink(path);
                    }, true);
                } else if (args.d) {
                    if (file.files.size > 0) {
                        throw new TypeError(`cannot delete non-empty directory`);
                    } else {
                        system.fs.unlink(path);
                    }
                } else {
                    throw new TypeError(`cannot delete directory`);
                }
            } else {
                system.fs.unlink(path);
            }
        }
    });

let rmdir = command('rm', 'Remove the DIRECTORY(ies), if they are empty.')
    .argument('DIRECTORY...')
    .func(({args, system}) => {
        for (let path of args.directory) {
            let file = system.fs.get(path);
            if (file instanceof Directory) {
                if (file.files.size > 0) {
                    throw new TypeError(`cannot remove non-empty directory ${path}`); 
                } else {
                    system.fs.unlink(path);
                }
            } else {
                throw new TypeError(`cannot remove non-directory ${path}`); 
            }
        }
    });

function overwrite(file: FileObject): void {
    eval(''); // don't optimize
    if (file instanceof RegularFile) {
        // Bruce Schneier's recommended overwriting pattern
        file.data.fill(0b00000000);
        file.data.fill(0b11111111);
        window.crypto.getRandomValues(file.data);
        window.crypto.getRandomValues(file.data);
        window.crypto.getRandomValues(file.data);
        window.crypto.getRandomValues(file.data);
        window.crypto.getRandomValues(file.data);
    } else if (file instanceof Directory) {
        for (let subfile of file.files.values()) {
            overwrite(subfile);
        }
    }
    for (let key in Reflect.ownKeys(file)) {
        // @ts-ignore
        delete file[key];
    }
}

let shred = command('shred', 'Overwrite the specified FILE(s) repeatedly, in order to make it harder for even very expensive hardware probing to recover the data.')
    .argument('FILE...')
    .option('-u', 'deallocate and remove file after overwriting')
    .func(({args, system}) => {
        for (let path of args.file) {
            let file = system.fs.get(path);
            if (args.u) {
                system.fs.unlink(path);
            }
            overwrite(file);
        }
    });


let touch = command('touch', 'Update the access and modification times of each FILE to the current time.')
    .argument('FILE...')
    .option('-a', 'change only the access time')
    .option('-c', '--no-create', 'do not create any files')
    .option('-d=STRING', '--date=STRING', 'parse STRING and use it instead of current time')
    .option('-f', '(ignored)')
    .option('-h', '--no-dereference', 'affect each symbolic link instead of any referenced file (useful only on systems that can change the timestamps of a symlink)')
    .option('-m', 'change only the modification time')
    .option('-r=FILE', '--reference=FILE', 'use this file\'s times instead of current time')
    .option('-t=TIME', '--t=TIME', 'use specified time instead of current time, with a date-time format that differs from -d\'s, the format is [[CC]YY]MMDDhhmm[.ss]')
    .option('--time=WORD', "specify which time to change: access time (-a): 'access', 'atime', 'use'; modification time (-m): 'modify', 'mtime'")
    .func(({args, system}) => {
        let time: Date;
        if (args.d) {
            time = new Date(args.d);
        } else if (args.t) {
            time = new Date();
            let ts = args.t;
            if (ts.includes('.')) {
                let split = ts.split('.');
                time.setSeconds(parseInt(split[1]));
                ts = split[0];
            }
            if (ts.length !== 8 && ts.length !== 10 && ts.length !== 12) {
                throw new TypeError(`invalid time string: ${args.t}`);
            }
            if (ts.length === 12) {
                time.setFullYear(parseInt(ts.slice(0, 4)));
                ts = ts.slice(4);
            } else if (ts.length === 10) {
                time.setFullYear(Math.floor(time.getFullYear() / 100) + parseInt(ts.slice(0, 2)));
                ts = ts.slice(2);
            }
            time.setMonth(parseInt(ts.slice(0, 2)), parseInt(ts.slice(2, 4)));
            time.setHours(parseInt(ts.slice(4, 6)));
            time.setHours(parseInt(ts.slice(6, 8)));
        } else {
            time = new Date();
        }
        let a = args.a !== undefined ? args.a : (args.time !== undefined ? args.time === 'access' || args.time === 'atime' || args.time === 'use' : undefined);
        let m = args.m !== undefined ? args.m : (args.time !== undefined ? args.time === 'modify' || args.time === 'mtime' : undefined);
        for (let path of args.file) {
            if (!system.fs.exists(path) && !args.c) {
                system.fs.write(path, '');
            } else {
                let file = system.fs.get(path, args.h);
                file.utimes(a ? time : undefined, m ? time : undefined);
            }
        }
    });


let cat = command('cat', 'Concatenate FILE(s) to standard output. With no FILE, or when FILE is -, read standard input.')
    .argument('FILE...')
    .func(({args, system, process}) => {
        let out = '';
        for (let path of args.file) {
            if (path === '-') {
                out += process.stdin;
            } else {
                out += system.fs.read(path);
            }
        }
        process.stdout += out;
    });


export default function plugin<T extends System>(this: T): T {
    this.fs.addDevice('/bin/chgrp', {executor: chgrp});
    this.fs.addDevice('/bin/chown', {executor: chown});
    this.fs.addDevice('/bin/chmod', {executor: chmod});
    this.fs.addDevice('/bin/dircolors', {executor: dircolors});
    this.fs.addDevice('/bin/cp', {executor: cp});
    this.fs.addDevice('/bin/ln', {executor: ln});
    this.fs.addDevice('/bin/ls', {executor: ls});
    this.fs.addDevice('/bin/mkdir', {executor: mkdir});
    this.fs.addDevice('/bin/mv', {executor: mv});
    this.fs.addDevice('/bin/rm', {executor: rm});
    this.fs.addDevice('/bin/rmdir', {executor: rmdir});
    this.fs.addDevice('/bin/shred', {executor: shred});
    this.fs.addDevice('/bin/touch', {executor: touch});
    this.fs.addDevice('/bin/cat', {executor: cat});
    return this;
}
plugin.id = 'coreutils';
plugin.requires = ['bash'];
