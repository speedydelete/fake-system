
import {FakeNode} from '../src/index';

let fakeNode = new FakeNode();

const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLScriptElement && 'path' in node.dataset) {
                fakeNode.write(node.dataset.path, node.text);
            }
        }
    }
});
observer.observe(document.documentElement, {childList: true, subtree: true});
window.addEventListener('load', observer.disconnect);
