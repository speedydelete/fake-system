
import type {System, Process, Stream} from 'fake-system';


interface Colors {
    normal: [string, string, string, string, string, string, string, string];
    bright: [string, string, string, string, string, string, string, string];
    default: string;
    defaultBackground: string;
}

export interface TerminalOptions {
    text?: string;
    height?: number;
    width?: number;
    tabSize?: number;
    colors?: Colors;
}


export const DEFAULT_COLORS: Colors = {
    normal: ['000000', 'cd0000', '00cd00', 'cdcd00', '0000ee', 'cd00cd', '00cdcd', 'e5e5e5'],
    bright: ['7f7f7f', 'ff0000', '00ff00', 'ffff00', '0000ff', 'ff00ff', '00ffff', 'ffffff'],
    default: 'e5e5e5',
    defaultBackground: '000000',
};


export class Terminal {

    element: HTMLDivElement;
    charElts: HTMLSpanElement[][] = [];
    text: string;
    stdin: Stream;
    stdout: Stream;
    stderr: Stream;

    height: number;
    width: number;
    tabSize: number;
    colors: Colors;

    row: number = 0;
    col: number = 0;
    scrollRow: number = 0;

    wasEscape: boolean = false;

    inString: boolean = false;
    stringType: null | number = null;
    stringChars: string = '';

    inCSI: boolean = false;
    csiParams: string = '';

    color: string;
    backgroundColor: string;
    invertColors: boolean = false;
    weight: 'normal' | 'bold' | 'light' = 'normal';
    italic: boolean = false;
    strikethrough: boolean = false;
    underline: boolean | 'double' = false;
    overline: boolean = false;
    underlineColor: null | string = null;
    blink: boolean | 'fast' = false;
    hidden: boolean = false;
    framed: boolean = false;
    align: null | 'super' | 'sub' = null;

    constructor(stdin: Stream, stdout: Stream, stderr: Stream, options: TerminalOptions) {
        this.stdin = stdin;
        this.stdout = stdout;
        this.stderr = stderr;
        this.text = options.text ?? '';
        this.height = options.height ?? 24;
        this.width = options.width ?? 80;
        this.colors = options.colors ?? DEFAULT_COLORS;
        this.color = this.colors.default;
        this.backgroundColor = this.colors.defaultBackground;
        this.tabSize = options.tabSize ?? 8;
        this.element = document.createElement('div');
        this.element.style.width = this.width + 'ch';
        for (let i = 0; i < this.height; i++) {
            let row = document.createElement('div');
            let rowSpans = [];
            for (let j = 0; j < this.width; j++) {
                let elt = document.createElement('span');
                elt.textContent = ' ';
                row.appendChild(elt);
                rowSpans.push(elt);
            }
            this.element.appendChild(row);
            this.charElts.push(rowSpans);
        }
        this.stdin.addWriteListener(this.write);
        this.stdout.addWriteListener(this.write);
        this.stderr.addWriteListener(this.write);
    }

    drawC1(code: number): void {
        if (code === 0x90 || code === 0x98 || code === 0x9d || code === 0x9e || code === 0x9f) {
            this.inString = true;
            this.stringType = code;
            this.stringChars = '';
        } else if (code === 0x9b) {
            this.inCSI = true;
        }
    }

    getCSIColor(args: (number | null)[]): string | null {
        if (args[1] === 5 && args[2]!) {
            if (args[2] < 8) {
                return this.colors.normal[args[2]];
            } else if (args[2] < 16) {
                return this.colors.bright[args[2]];
            } else if (args[2] < 232) {
                args[2] -= 16;
                let r = Math.floor(args[2] % 6 * 256/6).toString(16).padStart(2, '0');
                let g = Math.floor(args[2] / 6 * 256/6).toString(16).padStart(2, '0');
                let b = Math.floor(args[2] / 36 * 256/6).toString(16).padStart(2, '0');
                return r + g + b;
            } else {
                return ((args[2] - 232) * 24 / 256).toString(16).padStart(2, '0').repeat(3);
            }
        } else if (args[1] === 2 && args[2]! && args[3]! && args[4]!) {
            let r = args[2].toString(16).padStart(2, '0');
            let g = args[3].toString(16).padStart(2, '0');
            let b = args[4].toString(16).padStart(2, '0');
            return r + g + b;
        } else {
            return null;
        }
    }

    drawCSI(char: string): void {
        let args = this.csiParams.split(';').map(arg => arg === '' ? null : parseInt(arg));
        if (char === 'm') {
            if (args[0] === null || args[0] === 0) {
                this.color = this.colors.default;
                this.backgroundColor = this.colors.defaultBackground;
                this.invertColors = false;
                this.weight = 'normal';
                this.italic = false;
                this.strikethrough = false;
                this.underline = false;
                this.overline = false;
                this.underlineColor = null;
                this.blink = false;
                this.hidden = false;
                this.framed = false;
                this.align = null;
            } else if (args[0] === 1) {
                this.weight = 'bold';
            } else if (args[0] === 2) {
                this.weight = 'light';
            } else if (args[0] === 3) {
                this.italic = true;
            } else if (args[0] === 4) {
                this.underline = true;
            } else if (args[0] === 5) {
                this.blink = true;
            } else if (args[0] === 6) {
                this.blink = 'fast';
            } else if (args[0] === 7) {
                this.invertColors = true;
            } else if (args[0] === 8) {
                this.hidden = true;
            } else if (args[0] === 9) {
                this.strikethrough = true;
            } else if (args[0] === 21) {
                this.underline = 'double';
            } else if (args[0] === 22) {
                this.weight = 'normal';
            } else if (args[0] === 23) {
                this.italic = false;
            } else if (args[0] === 24) {
                this.underline = false;
            } else if (args[0] === 25) {
                this.blink = false;
            } else if (args[0] === 27) {
                this.invertColors = false;
            } else if (args[0] === 28) {
                this.hidden = false;
            } else if (args[0] === 29) {
                this.strikethrough = false;
            } else if (args[0] >= 30 && args[0] < 38) {
                this.color = this.colors.normal[args[0] - 30];
            } else if (args[0] === 38) {
                this.color = this.getCSIColor(args) ?? this.color;
            } else if (args[0] === 39) {
                this.color = this.colors.default;
            } else if (args[0] >= 40 && args[0] < 48) {
                this.backgroundColor = this.colors.normal[args[0] - 40];
            } else if (args[0] === 48) {
                this.backgroundColor = this.getCSIColor(args) ?? this.backgroundColor;
            } else if (args[0] === 49) {
                this.backgroundColor = this.colors.defaultBackground;
            } else if (args[0] === 51 || args[0] === 52) {
                this.framed = true;
            } else if (args[0] === 53) {
                this.overline = true;
            } else if (args[0] === 54) {
                this.framed = false;
            } else if (args[0] === 58) {
                this.underlineColor = this.getCSIColor(args);
            } else if (args[0] === 59) {
                this.underlineColor = null;
            } else if (args[0] === 73) {
                this.align = 'super';
            } else if (args[0] === 74) {
                this.align = 'sub';
            } else if (args[0] === 75) {
                this.align = null;
            } else if (args[0] >= 90 && args[0] < 98) {
                this.color = this.colors.bright[args[0] - 90];
            } else if (args[0] >= 100 && args[0] < 108) {
                this.backgroundColor = this.colors.bright[args[0] - 100];
            }
        } else {
            if (char === 'A') {
                this.row -= args[0] ?? 1;
            } else if (char === 'B') {
                this.row += args[0] ?? 1;
            } else if (char === 'C') {
                this.col += args[0] ?? 1;
            } else if (char === 'D') {
                this.col -= args[0] ?? 1;
            } else if (char === 'E') {
                this.row += args[0] ?? 1;
                this.col = 0;
            } else if (char === 'F') {
                this.row -= args[0] ?? 1;
                this.col = 0;
            } else if (char === 'G') {
                this.col = (args[0] ?? 1) - 1;
            } else if (char === 'H' || char === 'f') {
                this.row = (args[0] ?? 1) - 1;
                this.col = (args[0] ?? 1) - 1;
            } else if (char === 'J') {
                if (args[0] === null || args[0] === 0) {
                    for (let i = this.col; i < this.width; i++) {
                        this.charElts[this.row][i].textContent = '';
                    }
                    for (let row of this.charElts.slice(this.row + 1)) {
                        for (let elt of row) {
                            elt.textContent = ' ';
                        }
                    }
                } else if (args[0] === 1) {
                    for (let i = 0; i < this.col; i++) {
                        this.charElts[this.row][i].textContent = '';
                    }
                    for (let row of this.charElts.slice(0, this.row)) {
                        for (let elt of row) {
                            elt.textContent = ' ';
                        }
                    }
                } else if (args[0] === 2) {
                    for (let row of this.charElts) {
                        for (let elt of row) {
                            elt.textContent = ' ';
                        }
                    }
                } else {
                    for (let row of this.charElts) {
                        for (let elt of row) {
                            elt.textContent = ' ';
                        }
                    }
                    // code to clear scrollback buffer here
                }
            } else if (char === 'K') {
                let row = this.charElts[this.row];
                if (args[0] === null || args[0] === 0) {
                    for (let i = this.col; i < this.width; i++) {
                        row[i].textContent = '';
                    }
                } else if (args[0] === 1) {
                    for (let i = 0; i < this.col; i++) {
                        row[i].textContent = '';
                    }
                } else if (args[0] === 2) {
                    for (let i = 0; i < this.width; i++) {
                        row[i].textContent = '';
                    }
                }
            } else if (char === 'S') {
                this.scrollRow++;
            } else if (char === 'T') {
                this.scrollRow--;
            }
            if (this.row >= this.height) {
                this.scrollRow += this.row - this.height + 1;
                this.row = this.height - 1;
            }
        }
    }

    drawChar(char: string): void {
        let code = char.charCodeAt(0);
        if (this.inCSI) {
            if (code >= 0x30 && code < 0x40) {
                this.csiParams += char;
            } else if (code >= 0x40 && code <= 0x7F) {
                this.drawCSI(char);
            }
        } else if (this.wasEscape) {
            if (code >= 0x40 && code < 0x60) {
                this.drawC1(code + 0x40);
            }
            this.wasEscape = false;
        } else if (code === 0x1b) {
            this.wasEscape = true;
        } else if (this.inString) {
            if (code === 0x9c) {
                this.inString = false;
            } else {
                this.stringChars += char;
            }
        } else if (code === 0x08) {
            this.col -= 1;
            if (this.col < 0) {
                this.col = this.width - 1;
                this.row -= 1;
            }
        } else if (code === 0x09) {
            this.col = this.tabSize * Math.ceil(this.col / this.tabSize);
        } else if (code >= 0x80 && code < 0xa0) {
            this.drawC1(code);
        } else {
            if (this.hidden) {
                return;
            }
            let elt = this.charElts[this.row][this.col];
            if (elt === undefined) {
                while (elt === undefined) {
                    let newElt = document.createElement('span');
                    newElt.textContent = ' ';
                    this.charElts[this.row].push(newElt);
                    elt = this.charElts[this.row][this.col];
                }
            }
            elt.textContent = char;
            if (this.invertColors) {
                elt.style.color = this.backgroundColor;
                elt.style.backgroundColor = this.color;
            } else {
                elt.style.color = this.color;
                elt.style.backgroundColor = this.backgroundColor;
            }
            elt.style.fontWeight = this.weight === 'light' ? '100' : this.weight;
            elt.style.fontSize = this.italic ? 'italic' : '';
            elt.style.textDecorationLine = (this.underline ? 'underline ' : '') + (this.overline ? 'overline ' : '') + (this.strikethrough ? 'strikethrough' : '');
            elt.style.textDecorationColor = this.underlineColor ?? elt.style.color;
            if (this.framed) {
                elt.textContent += '\ufe0f';
            }
            elt.style.verticalAlign = this.align ?? 'unset';
        }
    }

    write(text: string): void {
        this.text += text;
        for (let char of text) {
            this.drawChar(char);
        }
    }

    onkey(event: KeyboardEvent): void {
        let out: string;
        if (event.key.length === 1) {
            if (event.altKey || event.metaKey) {
                let modifier = String(1 + (event.shiftKey ? 1 : 0) + (event.altKey ? 2 : 0) + (event.ctrlKey ? 4 : 0) + (event.metaKey ? 8 : 0));
                out = '\x1b[' + modifier + event.key;
            } else if (event.ctrlKey) {
                out = String.fromCharCode(event.key.charCodeAt(0) - 64);
            } else {
                out = event.key;
            }
        } else if (event.key === 'Enter') {
            out = '\n';
        } else if (event.key === 'Tab') {
            out = '\t';
        } else if (event.key === 'Backspace') {
            out = '\b';
        } else if (event.key === 'ArrowUp') {
            out = '\x1b[A';
        } else if (event.key === 'ArrowDown') {
            out = '\x1b[B';
        } else if (event.key === 'ArrowRight') {
            out = '\x1b[C';
        } else if (event.key === 'ArrowLeft') {
            out = '\x1b[D';
        } else if (event.key === 'End') {
            out = '\x1b[F';
        } else if (event.key === 'Home') {
            out = '\x1b[H';
        } else if (event.key === 'PageDown') {
            out = '\x1b[S';
        } else if (event.key === 'PageUp') {
            out = '\x1b[T';
        } else {
            return;
        }
        this.stdin.write(out);
    }

    listen(): void {
        this.element.addEventListener('keydown', this.onkey);
    }

    unlisten(): void {
        this.element.removeEventListener('keydown', this.onkey);
    }

}
