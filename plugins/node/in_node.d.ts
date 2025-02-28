
import type {System, Process} from '../../src/index'; // fake-system
import type {require} from './index';

declare global {
    var __fakeNode_system__: System;
    var __fakeNode_process__: Process;
    var module: {
        exports: {[key: string]: any},
    };
    var exports: {[key: string]: any};
    var require: typeof require;
}
