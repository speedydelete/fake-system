
const {System} = require('.');
const {default: nodePlugin} = require('./plugins/node');

let system = new System();
system.addPlugin(nodePlugin);
system.fs.write('/root/test.js', 'console.log(\'hi\')\n');

let readline = require('node:readline/promises');
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
