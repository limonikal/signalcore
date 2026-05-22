import { Readable } from "stream";
import { NodeEventEmitter } from "../src/classes/sources/NodeEventEmitter";

type StreamEvents = {
    data: [Buffer];
    end: [];
    close: [];
    error: [Error];
};

const stream = Readable.from(["hello", "world"]);

const bridge = new NodeEventEmitter<StreamEvents>(stream);

bridge.on("data", (t) => {
    const [chunk] = t;
    console.log(chunk.toString());
});

bridge.once("end", () => {
    console.log("Stream ended");
});

bridge.on("error", (t) => {
    const [err] = t;
    console.error(err.message);
});
