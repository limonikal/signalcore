import { Emitter } from "../src/classes/sources/Emitter";
import { Union } from "../src/classes/composition/Union";
import type { EmitterLike } from "../src/types";

type Events = { tick: number };

const e1 = new Emitter<Events>();
const e2 = new Emitter<Events>();
const u1 = new Union(e1, e2);

function subscribeAll(target: EmitterLike<Events>) {
    target.on("tick", (t) => console.log(t));
}

subscribeAll(e1);
subscribeAll(u1);
