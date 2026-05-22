import { Emitter } from "../src/classes/sources/Emitter";

const e = new Emitter<{ x: number }>();
const handler = () => {};

console.log(e.emit("x", 1));

e.on("x", () => {});
console.log(e.hasListeners("x"));
console.log(e.listenerCount());
console.log(e.actions());

e.on("x", (t) => {
    console.log(Object.keys(t).includes("emitter"));
    console.log("emitter" in t);
});

const heavy = () => {};
e.once("x", heavy);
e.off("x", heavy);

e.on("x", () => { throw new Error("fail"); });
e.on("x", () => console.log("still works"));
e.emit("x", 1);
