
import {FileSystem} from './fs';
import {UserManager, type UserData} from './um';
import bashPlugin from './plugins/bash';
import coreutilsPlugin from './plugins/coreutils';
import {Stream} from './stream';

export {Stream} from './stream';


export interface Process {
    system: System;
    pid: number;
    priority: number;
    uid: number;
    gid: number;
    cwd: string;
    umask: number;
    stdin: Stream;
    stdout: Stream;
    stderr: Stream;
    execFunc?: (this: Process) => void;
    exitCode?: number;
}

export interface CompleteProcess extends Process {
    exitCode: number;
}

export type Plugin = (<T extends System>(this: T, options: unknown) => T) & {id: string, requires?: string[]};


export class System {

    fs: FileSystem;
    um: UserManager;
    processes: Process[] = [];
    addedPluginIds: string[] = [];
    hostname: string = 'fake-system';

    constructor(addDefaultPlugins: boolean = true) {
        this.fs = new FileSystem();
        this.fs.mkdir('/bin');
        this.fs.mkdir('/boot');
        this.fs.mkdir('/dev');
        this.fs.addDevice('/dev/null', {reader: () => new Uint8Array()});
        this.fs.addDevice('/dev/zero', {reader: (position, length = 0) => new Uint8Array(length)});
        this.fs.addDevice('/dev/full', {
            reader(position, length = 0) {
                return new Uint8Array(length);
            },
            writer() {
                throw new Error('disk full');
            },
        });
        this.fs.addDevice('/dev/urandom', {reader: (position, length = 0) => {
            let out = new Uint8Array(length);
            window.crypto.getRandomValues(out);
            return out;
        }});
        this.fs.link('/dev/random', this.fs.get('/dev/urandom'));
        this.fs.mkdir('/etc');
        this.fs.write('/etc/passwd', 'root::0:0::/root:/bin/bash');
        this.fs.write('/etc/group', 'root::0:root');
        this.fs.mkdir('/home');
        this.fs.mkdir('/lib');
        this.fs.mkdir('/media');
        this.fs.mkdir('/mnt');
        this.fs.mkdir('/opt');
        this.fs.mkdir('/proc');
        this.fs.mkdir('/root');
        this.fs.mkdir('/run');
        this.fs.link('/sbin', this.fs.get('/bin'));
        this.fs.mkdir('/srv');
        this.fs.mkdir('/sys');
        this.fs.mkdir('/tmp');
        this.fs.mkdir('/usr');
        this.fs.link('/usr/bin', this.fs.get('/bin'));
        this.fs.mkdir('/usr/include');
        this.fs.mkdir('/usr/lib');
        this.fs.mkdir('/usr/local');
        this.fs.link('/usr/sbin', this.fs.get('/bin'));
        this.fs.mkdir('/usr/share');
        this.fs.mkdir('/usr/src');
        this.fs.mkdir('/var');
        this.fs.mkdir('/var/cache');
        this.fs.mkdir('/var/lib');
        this.fs.mkdir('/var/lock');
        this.fs.mkdir('/var/log');
        this.fs.mkdir('/var/mail');
        this.fs.mkdir('/var/opt');
        this.fs.mkdir('/var/run');
        this.fs.mkdir('/var/spool');
        this.fs.mkdir('/var/tmp');
        this.um = new UserManager(this.fs);
        if (addDefaultPlugins) {
            this.addPlugin(bashPlugin);
            this.addPlugin(coreutilsPlugin);
        }
    }

    addPlugin<T extends Plugin>(plugin: T, options?: Parameters<T>[0]): asserts this is ReturnType<T> {
        if (this.addedPluginIds.includes(plugin.id)) {
            throw new TypeError(`plugin ${plugin.id} is already added`);
        } else {
            if (plugin.requires !== undefined) {
                for (let id of plugin.requires) {
                    if (!this.addedPluginIds.includes(id)) {
                        throw new TypeError(`cannot add plugin ${plugin.id} because plugin ${id} is not added`);
                    }
                }
            }
            plugin.call(this, options);
            this.addedPluginIds.push(plugin.id);
        }
    }

    login(user: string | number): UserSession {
        return new UserSession(this, user);
    }

    export(): Uint8Array {
        return this.fs.export();
    }

    static import(data: Uint8Array): System {
        let out = new System();
        out.fs = FileSystem.import(data);
        return out;
    }

}


export class UserSession implements UserData {

    system: System;
    name: string;
    uid: number;
    gid: number;
    info: string;
    homedir: string;
    shell: string;
    cwd: string;

    constructor(system: System, user: string | number) {
        this.system = system;
        let data = system.um.getUserData(user);
        this.name = data.name;
        this.uid = data.uid;
        this.gid = data.gid;
        this.info = data.info;
        this.homedir = data.homedir;
        this.shell = data.shell;
        this.cwd = this.homedir;
    }

    createProcess(): Process {
        let process = {
            system: this.system,
            pid: this.system.processes.length,
            priority: 0,
            uid: this.uid,
            gid: this.gid,
            cwd: this.cwd,
            umask: 0o022,
            stdin: new Stream(),
            stdout: new Stream(),
            stderr: new Stream(),
            exitCode: undefined,
        };
        this.system.processes.push(process);
        return process;
    }

    run(process: Process): void {
        throw new TypeError('cannot run processes');
    }

}


export function logProcess(process: Process): void {

}
