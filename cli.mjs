
import {System, logProcess} from './lib/index.js';

let system = new System();

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
