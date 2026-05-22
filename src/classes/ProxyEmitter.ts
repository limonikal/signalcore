import { Emitter } from "./Emitter";
import type { DataEmitting } from "@/types";

export type ProxyEmitter<Data extends object> = {
    [P in keyof Data]: Data[P];
} & {
    emitter: Emitter<DataEmitting<Data>>;
}

export function createProxyEmitter<Data extends object>(initState: Data) {
    const emitter = new Emitter<DataEmitting<Data>>();

    const proxy = new Proxy(initState, {
        deleteProperty() {
            return false;
        },
        set(target: Data, name: string | symbol, value: Data[keyof Data]) {
            const key = name as keyof Data;
            const from = target[key];
            target[key] = value;
            emitter.emit(key, { from, value });
            return true;
        },
    });

    Object.defineProperty(proxy, "emitter", {
        value: emitter,
        enumerable: false,
        writable: false,
    });

    return proxy as ProxyEmitter<Data>;
}
