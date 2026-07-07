import { callBus, connectBus, disconnectBus } from "@/symbols";
import { Emitter } from "@/classes/sources/Emitter";
import type { TriggerHandler } from "../../types";

type BusActionTypes = {
    [K: string | symbol | number]: any;
};

export class Bus extends Emitter<BusActionTypes> {
    private readonly emitters = new Set<Emitter<any>>();

    on<Data extends object>(action: string | number | symbol, handler: TriggerHandler<Data>) {
        return super.on(action, handler);
    }

    [callBus](action: string | number | symbol, data: any) {
        this.emit(action, {
            action,
            data,
        });
    }

    connect(emitter: Emitter<any>) {
        this.emitters.add(emitter);
        emitter[connectBus](this);
    }

    disconnect(emitter: Emitter<any>) {
        this.emitters.delete(emitter);
        emitter[disconnectBus](this);
    }

    disconnectAllEmitters() {
        const iterator = this.emitters.values();
        let entry: IteratorResult<Emitter<any>>;
        while(!(entry = iterator.next()).done) {
            entry.value[disconnectBus](this);
        }
        this.emitters.clear();
    }
}
