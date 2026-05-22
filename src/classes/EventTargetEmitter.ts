import { Emitter } from "./Emitter";
import type { TriggerHandler, Options } from "@/types";
import { getActionHandlers, getAllHandlers } from "@/symbols";

export class EventTargetEmitter<ActionTypes extends Record<string, Event>> extends Emitter<ActionTypes> {
    private readonly target: EventTarget;
    private readonly handlerAborters
        = new Map<keyof ActionTypes, Map<TriggerHandler<any, any>, AbortController>>();

    constructor(eventTarget: EventTarget) {
        super();
        this.target = eventTarget;
    }

    on<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
        options?: Options
    ) {
        let aborter: AbortController;
        let signal: AbortSignal;
        if (options) {
            if (typeof options === "object") {
                if (options.signal) {
                    aborter = new AbortController();
                    signal = aborter.signal;
                    options.signal.addEventListener("abort", (reason) => {
                        aborter.abort(reason);
                    });
                    options.signal = signal;
                } else {
                    aborter = new AbortController();
                    signal = aborter.signal;
                    options.signal = signal;
                }
            } else {
                aborter = new AbortController();
                signal = aborter.signal;
                options = { signal, capture: true };
            }
        } else {
            aborter = new AbortController();
            signal = aborter.signal;
            options = { signal };
        }

        const listener = (event: Event) => {
            super.emit(
                action,
                Object.assign(
                    { event: event },
                    event
                ) as ActionTypes[Action] & { event: Event }
            );
        };
        this.target.addEventListener(action as string, listener, options);
        signal.addEventListener("abort", () => {
            this.target.removeEventListener(action as string, listener);
            this.handlerAborters.get(action)?.delete(handler);
            super.off(action, handler);
        });
        let aborters = this.handlerAborters.get(action);
        if (!aborters) {
            aborters = new Map();
            this.handlerAborters.set(action, aborters);
        }
        aborters.set(handler, aborter);
        if (options.once) {
            super.once(action, handler);
        } else {
            super.on(action, handler);
        }
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
        options?: Options
    ) {
        if (options) {
            if (!(typeof options === "object")) {
                options = { capture: true };
            }
        } else {
            options = {};
        }
        options.once = true;

        this.on(action, handler, options);
    }

    off<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<any, any>) {
        const aborters = this.handlerAborters.get(action);
        if (!aborters) return;
        const aborter = aborters.get(handler);
        if (aborter) {
            aborter.abort();
            aborters.delete(handler);
        }
    }

    offAll<Action extends keyof ActionTypes>(action: Action) {
        const aborters = this.handlerAborters.get(action);
        if (!aborters) return
        const iterator = aborters.values();
        let entry: IteratorResult<AbortController>;
        while (!(entry = iterator.next()).done) {
            entry.value.abort();
        }
    }

    clear() {
        const mapIterator = this.handlerAborters.values();
        let aborters: IteratorResult<Map<TriggerHandler<any, any>, AbortController>>;
        while(!(aborters = mapIterator.next()).done) {
            const iterator = aborters.value.values();
            let entry: IteratorResult<AbortController>;
            while(!(entry = iterator.next()).done) {
                entry.value.abort();
            }
        }
    }

    [getActionHandlers](action: keyof ActionTypes) {
        return super[getActionHandlers](action);
    }

    [getAllHandlers]() {
        return super[getAllHandlers]();
    }
}
