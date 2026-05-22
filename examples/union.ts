import { Emitter } from "../src/classes/sources/Emitter";
import { Union } from "../src/classes/composition/Union";

const a = new Emitter<{ tick: number }>();
const b = new Emitter<{ tick: number }>();

const union = new Union(a, b);

union.on("tick", (t) => console.log(t));
a.emit("tick", 1);
b.emit("tick", 2);

const c = new Emitter<{ tick: number }>();
union.add(c);
c.emit("tick", 3);

union.remove(b);
b.emit("tick", 4);

const outer = new Union(union, new Emitter<{ tick: number }>());
outer.emit("tick", 5);
