
export function parse(str: string): {[key: string]: string | string[]} {
    let out: {[key: string]: string | string[]} = {}
    for (const [key, value] of (new URLSearchParams(str)).entries()) {
        if (key in out) {
            if (typeof out[key] === 'string') {
                out[key] = [out[key], value];
            } else {
                out[key].push(value);
            }
        } else {
            out[key] = value;
        }
    }
    return out;
}

export function stringify(obj: {[key: string]: string | number | bigint | boolean | string[] | number[] | bigint[] | boolean[]}): string {
    let params = new URLSearchParams();
    for (const key in Object.entries(obj)) {
        const value = obj[key];
        if (typeof value === 'string') {
            params.set(key, value);
        } else if (value instanceof Array) {
            for (const item of value) {
                params.append(key, String(item));
            }
        }
    }
    return params.toString();
}

export {
    parse as decode,
    stringify as encode,
}
