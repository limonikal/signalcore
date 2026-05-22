import { Emitter } from "../src/classes/sources/Emitter";
import { until } from "../src/hooks/until";

const emitter = new Emitter<{ ready: { data: string } }>();

async function start() {
    const trigger = await until(emitter, "ready");
    console.log(trigger.data);
    console.log(trigger.emitter);
}

start();
emitter.emit("ready", { data: "hello" });
