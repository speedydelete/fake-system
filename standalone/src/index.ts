
import {System} from 'fake-system';

// @ts-ignore
window.system = new System();

const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLScriptElement && node.dataset.path) {
                // @ts-ignore
                system.fs.write(node.dataset.path, node.text);
            }
        }
    }
});
observer.observe(document.documentElement, {childList: true, subtree: true});
window.addEventListener('load', () => observer.disconnect());
