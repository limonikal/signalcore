import { createProxyEmitter } from "../src/classes/sources/ProxyEmitter";

const state = createProxyEmitter({ x: 0, y: 0 });

state.emitter.on("x", (t) => {
    console.log(`x: ${t.from} → ${t.value}`);
});

state.x = 10;
state.x = 20;

JSON.stringify(state);
