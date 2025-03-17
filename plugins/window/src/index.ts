
import type {System, UserSession} from 'fake-system';
import {WindowManager} from './window';

export * from './window';


export interface WindowSystem extends System {
    login(user: string | number): WindowUserSession;
}

export interface WindowUserSession extends UserSession {
    windowManager: WindowManager;
}


export default function plugin<T extends System>(this: T): T & WindowSystem {
    let oldLogin = this.login.bind(this);
    return Object.assign(this, {
        login(user: string | number): WindowUserSession {
            let session = oldLogin(user);
            return Object.assign(session, {
                windowManager: new WindowManager(session),
            });
        }
    });
}
plugin.name = 'window';
