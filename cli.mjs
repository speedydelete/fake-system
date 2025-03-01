
import {System} from './lib/index.js';
import nodePlugin from 'plugins/node/lib/index.js';

let system = new System();
system.addPlugin(nodePlugin);

let {default: readline} = await import('node:readline/promises');
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

(async () => {
    let session = system.login('root');
    while (true) {
        let input = await rl.question(session.getPS1());
        let {stderr, stdout} = session.runBash(input);
        let text = stderr ? stderr : stdout;
        if (text !== '\n') {
            process.stdout.write(text);
        }
    }
})();
