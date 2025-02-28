
import {System} from './lib/index.js';

let system = new System();

let session = system.login('root');
console.log(session.runBash('/bin/touch test.txt'));
console.log(session.runBash('/bin/ls'));
