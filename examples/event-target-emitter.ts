import { EventTargetEmitter } from "../src/classes/sources/EventTargetEmitter";

const ete = new EventTargetEmitter<{
    click: MouseEvent;
}>(document);

ete.on("click", (t) => {
    t.event;
    t.clientX;
}, { capture: true });

const ctrl = new AbortController();
ete.on("click", (t) => {}, { signal: ctrl.signal });
ctrl.abort();
