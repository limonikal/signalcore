import { Emitter } from "./Emitter";
import type { DataEmitting } from "@/types";

function baseCompare(from: any, to: any) {
    return from === to;
}

type Comparator<Data extends object, Key extends keyof Data> = (from: Data[Key], to: Data[Key]) => boolean;

export type Stor<Data extends object> = {
    [P in keyof Data]: Data[P];
} & {
    emitter: Emitter<DataEmitting<Data>>;
    comparators: Partial<{
        [Key in keyof Data]: Comparator<Data, Key>;
    }>;
};

export function createStor<Data extends object>(
    initState: Data,
    comparators: Partial<{
        [K in keyof Data]: Comparator<Data, K>;
    }> = {}) {

    const proxy = new Proxy(initState, {
        deleteProperty() {
            return false;
        },
        // @ts-ignore
        set<Key extends keyof Data>(
            target: Data,
            name: Key,
            value: Data[Key],
            receiver: {
                emitter: Emitter<DataEmitting<Data>>,
                comparators: Partial<Record<keyof Data, (...args: any[]) => boolean>>
            }
        ) {
            const from = target[name];
            const comparator = receiver.comparators[name] ?? baseCompare;
            if (comparator(from, value)) return true;
            target[name] = value;
            receiver.emitter.emit(name, { from, value });
            return true;
        },
    });

    Object.defineProperties(proxy, {
        emitter: {
            value: new Emitter<DataEmitting<Data>>(),
            enumerable: false,
            writable: false,
        },
        comparators: {
            value: comparators,
            enumerable: false,
            writable: true,
        },
    });

    return proxy as unknown as Stor<Data>;
}
