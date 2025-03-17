
import {Stream, Process} from 'fake-system';
import {BashSystem, BashUserSession} from 'fake-system/bash';
import {Terminal} from './terminal';

export * from './terminal';


export interface TerminalSystem extends BashSystem {
    login(user: string | number): TerminalUserSession;
}

export interface TerminalUserSession extends BashUserSession {
    terminal: Terminal;
}


export default function plugin(this: BashSystem): BashSystem & TerminalSystem {
    let oldLogin = this.login.bind(this);
    return Object.assign(this, {
        login(user: string | number): TerminalUserSession {
            let session = oldLogin(user);
            let oldCreateProcess = session.createProcess.bind(session);
            return Object.assign(oldLogin(user), {
                terminal: new Terminal(new Stream(), new Stream(), new Stream(), {}),
                createProcess(this: TerminalUserSession): Process {
                    let process = oldCreateProcess();
                    process.stdin.attachTo(this.terminal.stdin);
                    process.stdout.attachTo(this.terminal.stdout);
                    process.stderr.attachTo(this.terminal.stderr);
                    return process;
                },
            });
        },
    });
}
plugin.name = 'terminal';
