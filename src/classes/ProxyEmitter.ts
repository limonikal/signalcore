import { Emitter } from "./Emitter";
import type { DataEmitting } from "@/types";

export type ProxyEmitter<Data extends object> = {
    [P in keyof Data]: Data[P];
} & {
    emitter: Emitter<DataEmitting<Data>>;
}

export function createProxyEmitter<Data extends object>(initState: Data) {
    const proxy = new Proxy(initState, {
        deleteProperty() {
            return false;
        },
        // @ts-ignore
        set<K extends keyof Data>(target: Data, name: keyof Data, value: Data[K], receiver: { emitter: Emitter<DataEmitting<Data>> }) {
            const from = target[name];
            target[name] = value;
            receiver.emitter.emit(name, { from, value });
        },
    });
    Object.defineProperty(proxy, "emitter", {
        value: new Emitter<DataEmitting<Data>>(),
        enumerable: false,
        writable: false,
    });
    return proxy as ProxyEmitter<Data>;
}
