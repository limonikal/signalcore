import { Emitter } from "./Emitter";
import type { TriggerHandler } from "@/types";

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
        options?: AddEventListenerOptions | boolean
    ) {
        const aborter = new AbortController();

        const userSignal = typeof options === "object" && options?.signal;
        if (userSignal) {
            userSignal.addEventListener("abort", () => aborter.abort(), { once: true });
        }

        const mergedOptions: AddEventListenerOptions = {
            ...(typeof options === "object" ? options : {}),
            ...(typeof options === "boolean" ? { capture: options } : {}),
            signal: aborter.signal,
        };

        const listener = (event: Event) => {
            super.emit(
                action,
                Object.assign(
                    { event },
                    event,
                ) as ActionTypes[Action] & { event: Event }
            );
        };

        this.target.addEventListener(action as string, listener, mergedOptions);

        aborter.signal.addEventListener("abort", () => {
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

        if (mergedOptions.once) {
            super.once(action, handler);
        } else {
            super.on(action, handler);
        }
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
        options?: AddEventListenerOptions | boolean
    ) {
        const baseOptions: AddEventListenerOptions = typeof options === "object"
            ? { ...options }
            : typeof options === "boolean"
                ? { capture: options }
                : {};
        baseOptions.once = true;
        this.on(action, handler, baseOptions);
    }

    off<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>
    ) {
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
        if (!aborters) return;
        const iterator = aborters.values();
        let entry: IteratorResult<AbortController>;
        while (!(entry = iterator.next()).done) {
            entry.value.abort();
        }
        this.handlerAborters.delete(action);
        super.offAll(action);
    }

    clear() {
        const mapIterator = this.handlerAborters.values();
        let aborters: IteratorResult<Map<TriggerHandler<any, any>, AbortController>>;
        while (!(aborters = mapIterator.next()).done) {
            const iterator = aborters.value.values();
            let entry: IteratorResult<AbortController>;
            while (!(entry = iterator.next()).done) {
                entry.value.abort();
            }
        }
        this.handlerAborters.clear();
        super.clear();
    }
}
