
import {System, logProcess} from './lib/index.js';

let system = new System();

let session = system.login('root');
session.runBash('/bin/touch test.txt');
session.runBash('/bin/mkdir dir');
logProcess(session.runBash('/bin/ls -l'));
