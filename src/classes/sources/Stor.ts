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

    const emitter = new Emitter<DataEmitting<Data>>();

    const proxy = new Proxy(initState, {
        deleteProperty() {
            return false;
        },
        set(target: Data, name: string | symbol, value: Data[keyof Data]) {
            const key = name as keyof Data;
            const from = target[key];
            const comparator = comparators[key] ?? baseCompare;
            if (comparator(from, value)) return true;
            target[key] = value;
            emitter.emit(key, { from, value });
            return true;
        },
    });

    Object.defineProperties(proxy, {
        emitter: {
            value: emitter,
            enumerable: false,
            writable: false,
        },
        comparators: {
            value: comparators,
            enumerable: false,
            writable: false,
        },
    });

    return proxy as unknown as Stor<Data>;
}
