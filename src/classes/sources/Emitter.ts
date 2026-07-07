import { Trigger as TriggerClass } from "./Trigger";
import type { Trigger, TriggerHandler } from "@/types";
import { getActionHandlers, getAllHandlers } from "@/symbols";

export class Emitter<ActionTypes extends Record<keyof ActionTypes, Record<any, any>>> {
    private readonly handlers = new Map<keyof ActionTypes, Set<TriggerHandler<any>>>();
    private readonly onceWrappers = new WeakMap<TriggerHandler<any>, TriggerHandler<any>>();

    emit<Action extends keyof ActionTypes>(action: Action, data: ActionTypes[Action]): boolean {
        const handlers = this.handlers.get(action);
        if (!handlers) return false;

        const trigger = Object.assign(
            new TriggerClass(),
            data,
        ) as Trigger<ActionTypes[Action]>;

        const iterator = handlers.values();
        let entry: IteratorResult<TriggerHandler<ActionTypes[Action]>>;
        while (!(entry = iterator.next()).done) {
            try {
                entry.value(trigger);
            } catch (err) {
                console.error(err);
            }
        }
        return true;
    }

    on<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action]>
    ) {
        let handlers = this.handlers.get(action);
        if (!handlers) {
            handlers = new Set();
            this.handlers.set(action, handlers);
        }
        handlers.add(handler);
    }

    hasListeners<Action extends keyof ActionTypes>(action: Action): boolean {
        const handlers = this.handlers.get(action);
        return handlers ? handlers.size > 0 : false;
    }

    listenerCount<Action extends keyof ActionTypes>(action?: Action): number {
        if (action !== undefined) {
            return this.handlers.get(action)?.size ?? 0;
        }
        let count = 0;
        const mapIterator = this.handlers.values();
        let entry: IteratorResult<Set<TriggerHandler<any>>>;
        while (!(entry = mapIterator.next()).done) {
            count += entry.value.size;
        }
        return count;
    }

    actions(): (keyof ActionTypes)[] {
        return [...this.handlers.keys()];
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action]>
    ) {
        const wrap: TriggerHandler<any> = (trigger) => {
            this.off(action, wrap);
            handler(trigger);
        }
        this.onceWrappers.set(handler, wrap);
        this.on(action, wrap);
    }

    off<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action]>
    ) {
        const handlers = this.handlers.get(action);
        if (!handlers) return;

        if (handlers.delete(handler)) return;

        const wrap = this.onceWrappers.get(handler);
        if (!wrap) return;
        handlers.delete(wrap);
        this.onceWrappers.delete(handler);
    }

    offAll<Action extends keyof ActionTypes>(action: Action) {
        const handlers = this.handlers.get(action);
        if (!handlers) return;
        handlers.clear();
    }

    clear() {
        this.handlers.clear();
    }

    [getActionHandlers]<Action extends keyof ActionTypes>(action: Action) {
        return this.handlers.get(action) as Set<TriggerHandler<ActionTypes[Action]>> | undefined;
    }

    [getAllHandlers]() {
        return this.handlers;
    }
}
