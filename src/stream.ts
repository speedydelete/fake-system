
import {decode} from './fs';


export class Stream {

    data: string;
    pos: number = 0;
    writeListeners: (((text: string) => void) | undefined)[] = [];

    constructor(data: string | Uint8Array = '') {
        if (typeof data === 'string') {
            this.data = data;
        } else {
            this.data = decode(data);
        }
    }

    write(data: string): void {
        this.data = this.data.slice(0, this.pos) + data + this.data.slice(this.pos + data.length);
        for (let listener of this.writeListeners) {
            if (listener !== undefined) {
                listener(data);
            }
        }
    }

    read(length?: number): string {
        let out = this.data.slice(this.pos, length);
        if (length === undefined) {
            this.pos = this.data.length;
        } else {
            this.pos += length;
        }
        return out;
    }

    readCode(): number {
        let out = this.data.charCodeAt(this.pos);
        this.pos++;
        return out;
    }

    readChar(): [string, number] {
        let char = this.data[this.pos];
        this.pos++;
        return [char, char.charCodeAt(0)];
    }

    seek(pos: number) {
        this.pos = pos;
    }

    indexOf(char: string) {
        return this.data.indexOf(char, this.pos);
    }

    readUpTo(char: string) {
        let index = this.indexOf(char);
        let data = this.data.slice(this.pos, index);
        this.pos = index;
        return data;
    }
    
    get length() {
        return this.data.length;
    }

    get done() {
        return this.pos >= this.data.length;
    }

    [Symbol.iterator]() {
        return this.data[Symbol.iterator]();
    }

    addWriteListener(func: (text: string) => void): number {
        this.writeListeners.push(func);
        return this.writeListeners.length - 1;
    }

    removeWriteListener(id: number): void {
        this.writeListeners[id] = undefined;
    }

    attachTo(stream: Stream): void {
        this.writeListeners.push(data => stream.write(data));
    }

}
