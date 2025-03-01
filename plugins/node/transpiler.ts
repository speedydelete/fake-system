
import * as babel from '@babel/core';
import presetEnv from '@babel/preset-env';
// @ts-ignore
import pluginTransformReactJSX from '@babel/plugin-transform-react-jsx';
// @ts-ignore
import pluginTransformReactJSXDevelopment from '@babel/plugin-transform-react-jsx-development';
// @ts-ignore
import pluginTransformTypescript from '@babel/plugin-transform-typescript';
import type {NodeSystem} from './index';


export type SourceMap = (ReturnType<typeof babel.transformSync> & {})['map'];

export interface Options {
    filename?: string;
    development?: boolean;
    jsx?: boolean;
    jsxPragma?: string;
    jsxPragmaFrag?: string;
    ts?: boolean;
    dts?: boolean;
    assumptions?: babel.TransformOptions['assumptions'] | 'none';
}


export const REASONABLE_ASSUMPTIONS = {
    arrayLikeIsIterable: true,
    constantSuper: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    noIncompleteNsImportDetection: true,
    noNewArrows: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    pureGetters: true,
    skipForOfIteratorClosing: true,
};


let targets: babel.TransformOptions['targets'] = {};
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
        plugins.push([pluginTransformTypescript, {
            dts: options.dts,
            isTSX: options.jsx,
            jsxPragma: options.jsxPragma,
            jsxPragmaFrag: options.jsxPragmaFrag,
            onlyRemoveTypeImports: true,
            optimizeConstEnums: !options.development,
        }]);
    }
    if (options.jsx) {
        plugins.push([options.development ? pluginTransformReactJSX : pluginTransformReactJSXDevelopment, {
            jsxPragma: options.jsxPragma,
            jsxPragmaFrag: options.jsxPragmaFrag,
        }]);
    }
    let out = babel.transformSync(code, {
        caller: {
            name: 'fake-node',
            supportsStaticESM: false,
            supportsDynamicImport: false,
            supportsTopLevelAwait: false,
            supportsExportNamespaceFrom: false,
        },
        filename: options.filename,
        presets: [presetEnv],
        plugins: plugins,
        targets: targets,
        sourceType: 'unambiguous',
        minified: !options.development,
        assumptions: options.assumptions === 'none' ? undefined : (options.assumptions ?? REASONABLE_ASSUMPTIONS),
    });
    if (out === null) {
        throw new Error('out is null');
    }
    return {code: out.code as string, map: out.map};
}


export function transpiler(system: NodeSystem, code: string, type: string, filename?: string): {code: string, map: SourceMap} {
    return transpile(code, {
        filename: filename,
        development: system.node.development,

        assumptions: system.node.assumptions,
    });
}
transpiler.types = ['text/javascript', 'application/json', 'text/javascript-jsx', 'text/typescript', 'text/typescript-declaration', 'text/typescript-jsx', 'text/typescript-jsx-declaration'];
