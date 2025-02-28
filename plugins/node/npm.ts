
export type Person = string | {name: string, email?: string, url?: string};
export interface PackageJSON {
    name?: string;
    version?: string;
    description?: string;
    keywords?: string[];
    homepage?: string;
    bugs?: string | {url?: string, email?: string};
    license?: string;
    author?: Person;
    contributors?: Person[];
    funding?: {type: string, url: string};
    files?: string[];
    exports?: {[entryPoint: string]: string};
    main?: string;
    browser?: string;
    bin?: {[name: string]: string};
    man?: string | string[];
    repository?: string | {type: string, url: string};
    scripts?: {[name: string]: string};
    config?: {[key: string]: string};
    dependancies?: {[name: string]: string};
    devDependancies?: {[name: string]: string};
    peerDependancies?: {[name: string]: string};
    bundleDependancies?: string[];
    optionalDependancies?: {[name: string]: string};
    overrides?: {[name: string]: string};
    engines?: {[engine: string]: string};
    os?: string | string[];
    cpu?: string | string[];
    libc?: string | string[];
    private?: boolean;
    publishConfig?: {[key: string]: string};
    workspaces?: string[];
}
