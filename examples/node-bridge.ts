import { EventEmitter } from "events";
import { NodeEventEmitter } from "../src/classes/sources/NodeEventEmitter";

type ProcessEvents = {
    exit: [number];
    uncaughtException: [Error];
};

const emitter = new EventEmitter();

const bridge = new NodeEventEmitter<ProcessEvents>(emitter);

bridge.on("exit", (t) => {
    const [code] = t;
    console.log(`Exit code: ${code}`);
});

bridge.once("uncaughtException", (t) => {
    const [err] = t;
    console.error(err.message);
});

emitter.emit("exit", 0);
emitter.emit("uncaughtException", new Error("fail"));
