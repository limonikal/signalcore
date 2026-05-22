import { EventEmitter } from "events";
import { NodeEventEmitter } from "../src/classes/sources/NodeEventEmitter";

type MultiArgEvents = {
    progress: [number, string, boolean];
    both: [string, number];
};

const source = new EventEmitter();
const bridge = new NodeEventEmitter<MultiArgEvents>(source);

bridge.on("progress", (t) => {
    const [percent, label, done] = t;
    console.log(`${percent}% — ${label} ${done ? "✓" : "…"}`);
});

bridge.on("both", (t) => {
    const [a, b] = t;
});

source.emit("progress", 42, "loading", false);
source.emit("progress", 100, "done", true);
source.emit("both", "answer", 42);
