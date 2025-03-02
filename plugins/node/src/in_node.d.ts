
import type {BashSystem, BashProcess} from 'fake-system/bash';
import type {NodeSystem, require as fakeRequire} from './index';

declare global {
    var __fakeNode_system__: BashSystem & NodeSystem;
    var __fakeNode_process__: BashProcess;
    var module: {
        exports: {[key: string]: any},
    };
    var exports: {[key: string]: any};
    var require: typeof fakeRequire;
}
