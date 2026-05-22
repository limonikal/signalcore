import { Emitter } from "../src/classes/sources/Emitter";
import { Trigger } from "../src/classes/sources/Trigger";

const e = new Emitter<{ msg: { text: string } }>();
e.emit("msg", { text: "hi" });

e.on("msg", (t) => {
    t.text;
    t.emitter;
    t instanceof Trigger;
});
