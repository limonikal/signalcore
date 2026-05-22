import { EventEmitter } from "events";
import { NodeEventEmitter } from "../src/classes/sources/NodeEventEmitter";

type SimpleEvents = {
    tick: [number];
};

const source = new EventEmitter();
const bridge = new NodeEventEmitter<SimpleEvents>(source);

const log = (t: any) => {
    const [n] = t;
    console.log(n);
};

bridge.on("tick", log);
source.emit("tick", 1);

bridge.off("tick", log);
source.emit("tick", 2);

const onceLog = (t: any) => {
    const [n] = t;
    console.log("once:", n);
};

bridge.once("tick", onceLog);
source.emit("tick", 3);
source.emit("tick", 4);

bridge.offAll("tick");
source.emit("tick", 5);

bridge.clear();
source.emit("tick", 6);
