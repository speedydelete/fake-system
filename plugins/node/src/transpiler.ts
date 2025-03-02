
import babel from '@babel/standalone';
import type {NodeSystem} from './index';


export type SourceMap = (ReturnType<typeof babel.transform> & {})['map'];

type TransformOptions = Parameters<typeof babel.transform>[1];

export interface Options {
    filename?: string;
    development?: boolean;
    jsx?: boolean;
    jsxPragma?: string;
    jsxPragmaFrag?: string;
    ts?: boolean;
    dts?: boolean;
    assumptions?: TransformOptions['assumptions'] | 'none';
}


let targets: TransformOptions['targets'] = {};
// @ts-ignore
const ua: string = navigator.userAgent;
let match: RegExpMatchArray | null;
if ((match = ua.match(/Chrome\/(\d+)/)) && !ua.match(/Edge|Edg|OPR/)) {
    targets.chrome = match[1];
} else if ((match = ua.match(/Firefox\/(\d+)/))) {
    targets.firefox = match[1];
} else if ((match = ua.match(/Safari\/(\d+)/)) && ua.match(/Version\/(\d+)/) && !ua.match(/Chrome/)) {
    targets.safari = ua.match(/Version\/(\d+)/)?.[1];
} else if ((match = ua.match(/Edg\/(\d+)/))) {
    targets.edge = match[1];
} else if ((match = ua.match(/OPR\/(\d+)/))) {
    targets.opera = match[1];
} else if ((match = ua.match(/MSIE (\d+)/)) || (match = ua.match(/Trident\/.*rv:(\d+)/))) {
    targets.ie = match[1];
}


export function transpile(code: string, options: Options = {}): {code: string, map: SourceMap} {
    let plugins = [];
    if (options.ts) {
        plugins.push(['@babel/plugin-transform-typescript', {
            dts: options.dts,
            isTSX: options.jsx,
            jsxPragma: options.jsxPragma,
            jsxPragmaFrag: options.jsxPragmaFrag,
            onlyRemoveTypeImports: true,
            optimizeConstEnums: !options.development,
        }]);
    }
    if (options.jsx) {
        plugins.push([options.development ? '@babel/plugin-transform-react-jsx' : '@babel/plugin-transform-react-jsx-development', {
            jsxPragma: options.jsxPragma,
            jsxPragmaFrag: options.jsxPragmaFrag,
        }]);
    }
    let out = babel.transform(code, {
        caller: {
            name: '@fake-system/node',
            supportsStaticESM: false,
            supportsDynamicImport: false,
            supportsTopLevelAwait: false,
            supportsExportNamespaceFrom: false,
        },
        filename: options.filename,
        presets: [['@babel/preset-env', targets]],
        plugins: plugins,
        targets: targets,
        sourceType: 'unambiguous',
        minified: !options.development,
        assumptions: options.assumptions === 'none' ? undefined : (options.assumptions ?? {}),
    });
    if (out === null) {
        throw new Error('out is null');
    }
    return {code: out.code as string, map: out.map};
}
