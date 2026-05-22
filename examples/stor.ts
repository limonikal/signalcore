import { createStor } from "../src/classes/sources/Stor";

const store = createStor(
    { user: { name: "Alice" }, count: 0 },
    { user: (a, b) => a.name === b.name },
);

store.emitter.on("user", (t) => console.log("changed"));

store.user = { name: "Alice" };
store.user = { name: "Bob" };
store.count = 0;
store.count = 1;
