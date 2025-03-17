
import type {UserSession} from 'fake-system';


let isCSSAdded = false;

const INJECTED_CSS = `
    .fake-system-window {
        position: relative;
    }
    .fake-system-window-window {
        position: absolute;
        display: flex;
        flex-direction: column;
    }
    .fake-system-window-top-bar {
        flex: 0 0 auto;
        display: flex;
        flex-direction: row;
    }
    .fake-system-window-title {
        justify-self: center;
    }
    .fake-system-window-window:last-child {
        flex: 1 0 auto;
    }
`;


export class Window {

    manager: WindowManager;
    content: HTMLElement;
    elt: HTMLDivElement;
    top: number;
    left: number;
    width: number;
    height: number;
    topBarElt: HTMLDivElement;
    titleElt: HTMLDivElement;
    mousedownX: number | null = null;
    mousedownY: number | null = null;

    constructor(manager: WindowManager, title: string, elt: HTMLElement) {
        this.manager = manager;
        this.content = elt;
        let rect = manager.elt.getBoundingClientRect();
        this.top = rect.height / 3;
        this.left = rect.width / 3;
        this.width =  rect.width / 3;
        this.height = rect.height / 3;
        this.elt = document.createElement('div');
        this.elt.className = 'fake-system-window-window';
        this.topBarElt = document.createElement('div');
        this.topBarElt.className = 'fake-system-window-top-bar';
        this.titleElt = document.createElement('div');
        this.titleElt.textContent = title;
        this.titleElt.className = 'fake-system-window-title';
        this.topBarElt.appendChild(this.titleElt);
        this.elt.appendChild(this.topBarElt);
        this.elt.appendChild(this.elt);
        this.elt.addEventListener('click', this.onclick.bind(this));
        this.elt.addEventListener('mousedown', this.onmousedown.bind(this));
        this.elt.addEventListener('mouseup', this.onmouseup.bind(this));
        this.elt.style.top = this.top + 'px';
        this.elt.style.left = this.left + 'px';
        this.elt.style.width = this.width + 'px';
        this.elt.style.height = this.height + 'px';
        this.manager.highestZIndex++;
        this.elt.style.zIndex = String(this.manager.highestZIndex);
        this.manager.elt.appendChild(this.elt);
    }

    get title(): string {
        return this.titleElt.textContent ?? '';
    }

    set title(value: string) {
        this.titleElt.textContent = value;
    }

    onclick(): void {
        this.manager.highestZIndex++;
        this.elt.style.zIndex = String(this.manager.highestZIndex);
        if (this.manager.highestZIndex > this.manager.windows.length * 2) {
            this.manager.normalizeZIndices();
        }
    }

    onmousedown(event: MouseEvent): void {
        this.mousedownX = event.offsetX;
        this.mousedownY = event.offsetY;
    }

    onmouseup(event: MouseEvent): void {
        if (this.mousedownX! && this.mousedownY!) {
            this.top += event.offsetY - this.mousedownY;
            this.left += event.offsetX - this.mousedownX;
            this.elt.style.top = this.top + 'px';
            this.elt.style.left = this.left + 'px';
            this.mousedownX = null;
            this.mousedownY = null;
        }
    }

}


export class WindowManager {

    session: UserSession;
    elt: HTMLDivElement;
    windows: Window[] = [];
    highestZIndex: number = 0;

    constructor(session: UserSession) {
        if (!isCSSAdded) {
            let elt = document.createElement('style');
            elt.textContent = INJECTED_CSS;
            document.head.insertBefore(document.head.children[0], elt);
        }
        this.session = session;
        this.elt = document.createElement('div');
        this.elt.className = 'fake-system-window';
    }

    createWindow(title: string, elt: HTMLElement): Window {
        let window = new Window(this, title, elt);
        this.windows.push(window);
        return window;
    }

    normalizeZIndices() {
        let order: (Window | undefined)[] = Array(this.highestZIndex);
        for (let window of this.windows) {
            order[Number(window.elt.style.zIndex)] = window;
        }
        let zIndex = 0;
        for (let window of order) {
            if (window !== undefined) {
                zIndex++;
                window.elt.style.zIndex = String(zIndex);
            }
        }
    }

}
