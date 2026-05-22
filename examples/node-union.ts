import { EventEmitter } from "events";
import { NodeEventEmitter } from "../src/classes/sources/NodeEventEmitter";
import { Union } from "../src/classes/composition/Union";

type StreamEvents = {
    data: [Buffer];
    end: [];
};

const src1 = new EventEmitter();
const src2 = new EventEmitter();

const bridge1 = new NodeEventEmitter<StreamEvents>(src1);
const bridge2 = new NodeEventEmitter<StreamEvents>(src2);

const union = new Union(bridge1, bridge2);

union.on("data", (t) => {
    const [chunk] = t;
    console.log("Data from any source:", chunk.toString());
});

src1.emit("data", Buffer.from("from bridge1"));
src2.emit("data", Buffer.from("from bridge2"));

const src3 = new EventEmitter();
const bridge3 = new NodeEventEmitter<StreamEvents>(src3);
union.add(bridge3);
src3.emit("data", Buffer.from("from bridge3"));
