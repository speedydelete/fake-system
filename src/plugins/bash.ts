
import {normalize, resolve, type FileObject, RegularFile, Device} from '../fs';
import type {System, UserSession, Process} from '../index';


export interface BashProcess extends Process {
    env: {[key: string]: string};
    argv: string[];
}

export interface BashUserSession extends UserSession {
    createProcess(...argv: string[]): BashProcess;
    run(process: Process): void;
    runBash(code: string): BashProcess;
    getPS1(): string;
    aliases: Map<string, string>;
    prevDir: string;
    throwUnintentionalCommandErrors?: boolean;
}

export interface BashSystem extends System {
    login(user: string | number): UserSession & BashUserSession;
}

const DEFAULT_ENV = {
    PATH: '/usr/bin:/usr/local/bin:/bin',
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
    LS_COLORS: 'rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=00:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.avif=01;35:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.webp=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:*~=00;90:*#=00;90:*.bak=00;90:*.crdownload=00;90:*.dpkg-dist=00;90:*.dpkg-new=00;90:*.dpkg-old=00;90:*.dpkg-tmp=00;90:*.old=00;90:*.orig=00;90:*.part=00;90:*.rej=00;90:*.rpmnew=00;90:*.rpmorig=00;90:*.rpmsave=00;90:*.swp=00;90:*.tmp=00;90:*.ucf-dist=00;90:*.ucf-new=00;90:*.ucf-old=00;90:',
};


const OCTAL_REGEX = /[0-7]{1,3}/;
const HEX_REGEX = /[0-9A-Fa-f]{1,2}/;
const UNICODE_REGEX = /[0-9A-Fa-f]{1,4}/;
const LONG_UNICODE_REGEX = /[0-9A-Fa-f]{1,8}/;

type Word = {quoted: boolean, text: string};

function tokenize(command: string): Word[] {
    let inDoubleQuotes = false;
    let quoted = false;
    let words: Word[] = [];
    let buffer = '';
    let i = 0;
    if (command.includes('#')) {
        command = command.slice(0, command.indexOf('#'));
    }
    while (i < command.length) {
        let char = command[i];
        if (char === "'" && !inDoubleQuotes) {
            i++;
            while ((char = command[i]) !== "'") {
                i++;
                buffer += char;
            }
            quoted = true;
        } else if (char === '\\') {
            i++;
            char = command[i];
            if (char === 'a') {
                buffer += '\a';
            } else if (char === 'b') {
                buffer += '\b';
            } else if (char === 'e' || char === 'E') {
                buffer += '\x1b';
            } else if (char === 'f') {
                buffer += '\f';
            } else if (char === 'n') {
                buffer += '\n';
            } else if (char === 'r') {
                buffer += '\t';
            } else if (char === 'v') {
                buffer += '\v';
            } else if (char === 'h') {
                i++;
                let match = (command.slice(i).match(HEX_REGEX) as RegExpMatchArray)[0];
                buffer += String.fromCharCode(parseInt(match, 8));
                i += match.length;
            } else if (char === '0' || char === '1' || char === '2' || char === '3' || char === '4' || char === '5' || char === '6' || char === '7') {
                let match = (command.slice(i).match(OCTAL_REGEX) as RegExpMatchArray)[0];
                buffer += String.fromCharCode(parseInt(match, 8));
                i += match.length;
            } else if (char === 'u') {
                let match = (command.slice(i).match(UNICODE_REGEX) as RegExpMatchArray)[0];
                buffer += String.fromCharCode(parseInt(match, 8));
                i += match.length;
            } else if (char === 'U') {
                let match = (command.slice(i).match(LONG_UNICODE_REGEX) as RegExpMatchArray)[0];
                buffer += String.fromCharCode(parseInt(match, 8));
                i += match.length;
            } else if (char === 'c') {
                buffer += String.fromCharCode(char.charCodeAt(0) - 64);
            } else {
                buffer += char;
            }
        } else if (char === '"') {
            inDoubleQuotes = !inDoubleQuotes;
            quoted = true;
        } else if (char === ' ' && !inDoubleQuotes) {
            words.push({quoted: quoted, text: buffer});
            quoted = false;
            buffer = '';
        } else {
            buffer += char;
        }
        i++;
    }
    words.push({quoted: quoted, text: buffer});
    return words;
}

function resolveAliases(words: Word[], process: Process, session: BashUserSession): Word[] {
    if (words.length === 0) {
        return words;
    }
    let replaced = session.aliases.get(words[0].text);
    if (replaced !== undefined) {
        words[0].text = replaced;
    }
    return words;
}

type Command = {words: Word[], async: boolean};

function extractCommandsPipeline(words: Word[]): Command[][] {
    let pipeline: Word[][] = [];
    let buffer: Word[] = [];
    for (let word of words) {
        if (word.text === '|' && !word.quoted) {
            pipeline.push(buffer);
        } else {
            buffer.push(word);
        }
    }
    let commandsPipeline: Command[][] = [];
    for (let words of pipeline) {
        let command: Word[] = [];
        let commands: Command[] = [];
        for (let word of words) {
            if (word.text === ';' && !word.quoted) {
                commands.push({words: command, async: false});
                command = [];
            } else if (word.text === '&' && !word.quoted) {
                commands.push({words: command, async: true});
            } else {
                command.push(word);
            }
        }
        commandsPipeline.push(commands);
    }
    return commandsPipeline;
}

function substitutions(process: Process, words: Word[]): string[] {
    let argv = [words[0].text];
    for (let word of words.slice(1)) {
        if (!word.quoted && !word.text.startsWith('/') && !word.text.startsWith('.') && !word.text.startsWith('-')) {
            word.text = normalize(resolve(process.cwd, word.text));
        }
        argv.push(word.text);
    }
    return argv;
}


export let defaultCommands: {[key: string]: (process: BashProcess, session: BashUserSession) => void} = {

    ':'() {},

    '.'(process, session) {
        let file = process.argv[1];
        process.argv = process.argv.slice(2);
        bash(session.system.fs.read(file), process, session);
    },

    alias(process, session) {
        for (let arg of process.argv) {
            if (arg === '-p') {
                continue;
            } else {
                if (arg.includes('=')) {
                    let [name, value] = arg.split('=');
                    session.aliases.set(name, value);
                } else {
                    process.stdout.write(`${arg}=${session.aliases.get(arg)}\n`);
                }
            }
        }
    },

    builtin(process, session) {
        return defaultCommands[process.argv[0]](session.createProcess(...process.argv.slice(1)), session);
    },

    cd(process, session) {
        let arg = process.argv[0];
        let cwd: string;
        if (arg === undefined) {
            cwd = session.homedir;
        } else if (arg.startsWith('~')) {
            if (arg.length === 1) {
                cwd = session.homedir;
            } else {
                cwd = session.system.um.getUserData(arg.slice(1)).homedir;
            }
        } else if (arg === '-') {
            cwd = session.prevDir;
        } else {
            cwd = arg;
        }
        session.prevDir = session.cwd;
        session.cwd = cwd;
    },

    eval(process, session) {
        let command = process.argv.slice(1).join(' ');
        process.argv = [];
        bash(command, process, session);
    },

    exit(process) {
        process.exitCode = process.argv[1] ? parseInt(process.argv[1]) : 0;
    },

    pwd(process) {
        process.stdout.write(process.cwd + '\n');
    },

    source(process, session) {
        this['.'](process, session);
    },

    test(process, session) {
        // todo: make this
    },

    unalias(process, session) {
        for (let arg of process.argv) {
            if (arg === '-a') {
                session.aliases = new Map();
                return;
            } else {
                session.aliases.delete(arg);
            }
        }
    },

    '['(process, session) {
        if (process.argv[process.argv.length - 1] !== ']') {
            process.stderr.write('[: no matching ]\n');
            process.exitCode = -1;
        } else {
            this.test(process, session);
        }
    }

};


function bash(command: string, process: BashProcess, session: BashUserSession): void {
    let words = resolveAliases(tokenize(command), process, session);
    if (words[0].text in defaultCommands) {
        defaultCommands[words[0].text](process, session);
        process.exitCode ??= 0;
    } else {
        process.argv = substitutions(process, words);
    }
    // let commandsPipeline = extractCommandsPipeline(words);
    // for (let commands of commandsPipeline) {
    //     main: for (let command of commands) {
    //         let simpleCommands: Command[] = [];
    //         let buffer: Word[] = [];
    //         let exitCode0Fail = false;
    //         for (let word of command.words) {
    //             if (word.text === '&&' && !word.quoted) {
    //                 let exitCode = runSimpleCommand(system, session, process, buffer);
    //                 if (exitCode === 0) {
    //                     continue main;
    //                 }
    //                 buffer = [];
    //             } else if (word.text === '||' && !word.quoted) {
    //                 let exitCode = runSimpleCommand(system, session, process, buffer);
    //                 if (exitCode === 1) {
    //                     continue main;
    //                 } else {
    //                     exitCode0Fail = true;
    //                 }
    //                 buffer = [];
    //             } else {
    //                 buffer.push(word);
    //             }
    //         }
    //         let exitCode = runSimpleCommand(system, session, process, buffer);
    //         if (exitCode === 0) {
    //             // idk what to do here
    //         }
    //     }
    // }
}


function run(this: BashUserSession, process: BashProcess): void {
    let argv0 = resolve(process.cwd, process.argv[0]);
    if (!this.system.fs.exists(argv0)) {
        let found = false;
        for (let path of process.env.PATH.split(':')) {
            argv0 = resolve(path, process.argv[0]);
            if (this.system.fs.exists(argv0)) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new TypeError(`${process.argv[0]} does not exist`);
        }
    }
    let file = this.system.fs.get(argv0);
    if (file instanceof Device) {
        file.executor(process, this);
    } else if (file instanceof RegularFile) {
        let data = file.read();
        if (data.startsWith('#!')) {
            let index = data.indexOf('\n');
            let shebang = data.slice(2, index);
            data = data.slice(index);
            if (shebang.includes(' ')) {
                let index = shebang.indexOf(' ');
                process.argv = [shebang.slice(0, index), shebang.slice(index + 1), data].concat(process.argv);
            } else {
                process.argv = [shebang, data].concat(process.argv);
            }
            this.run(process);
        } else {
            throw new Error(`${normalize(resolve(process.argv[0]))} is not executable`);
        }
    } else {
        throw new Error(`${normalize(resolve(process.argv[0]))} is not executable`);
    }
}


export default function plugin<T extends System>(this: T): T & BashSystem {
    this.fs.addDevice('/bin/bash', {executor: (process: Process, session: UserSession) => {
        bash((process as BashProcess).argv.join(' '), process as BashProcess, session as BashUserSession)
        if (process.exitCode === undefined) {
            (session as BashUserSession).run(process);
        }
    }});
    this.fs.link('/bin/sh', this.fs.get('/bin/bash'));
    let oldLogin = this.login.bind(this);
    return Object.assign(this, {
        login(user: string | number): UserSession & BashUserSession {
            let out = oldLogin(user);
            let oldCreateProcess = out.createProcess.bind(out);
            return Object.assign(out, {
                run: run,
                createProcess(...argv: string[]): BashProcess {
                    return Object.assign(oldCreateProcess(), {argv, env: DEFAULT_ENV});
                },
                runBash(this: BashUserSession, command: string): BashProcess {
                    let process = this.createProcess();
                    try {
                        bash(command, process, this);
                    } catch (error) {
                        process.stderr.write(`bash: error: ${error instanceof Error ? error.message : error}\n`);
                    }
                    if (process.exitCode === undefined) {
                        this.run(process);
                    }
                    return process;
                },
                getPS1(this: BashUserSession): string {
                    return `\x1b[01;32m${this.name}@${this.system.hostname}\x1b[0m:\x1b[01;34m${this.cwd.replace(new RegExp('^' + this.homedir), '~')}\x1b[0m${this.uid === 0 ? '#' : '$'} `;
                },
                aliases: new Map(),
                prevDir: out.homedir,
            });
        }
    });
}
plugin.id = 'bash';
