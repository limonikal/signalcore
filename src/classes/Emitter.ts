import { Trigger as TriggerClass } from "./Trigger";
import type { Trigger, TriggerHandler } from "@/types";
import { getActionHandlers, getAllHandlers } from "@/symbols";

export class Emitter<ActionTypes extends Record<keyof ActionTypes, Record<any, any>>> {
    private readonly handlers = new Map<keyof ActionTypes, Set<TriggerHandler<any, any>>>();
    private readonly onceWrappers = new WeakMap<TriggerHandler<any, any>, TriggerHandler<any, any>>();

    emit<Action extends keyof ActionTypes>(action: Action, data: ActionTypes[Action]) {
        const handlers = this.handlers.get(action);
        if (!handlers) return;

        // Создаём триггер
        const trigger = Object.assign(
            new TriggerClass(),
            data,
            { emitter: this },
        ) as Trigger<ActionTypes[Action], Emitter<ActionTypes>>;

        // вызываем обработчики
        const iterator = handlers.values();
        let entry: IteratorResult<TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>>;
        while (!(entry = iterator.next()).done) {
            entry.value(trigger);
        }
    }

    on<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
        // @ts-ignore
        options?: any
    ) {
        let handlers = this.handlers.get(action);
        if (!handlers) {
            handlers = new Set();
            this.handlers.set(action, handlers);
        }
        handlers.add(handler);
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
        // @ts-ignore
        options?: any
    ) {
        const wrap: TriggerHandler<any, any> = (trigger) => {
            this.off(action, wrap);
            handler(trigger);
        }
        this.onceWrappers.set(handler, wrap);
        this.on(action, wrap);
    }

    off<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<any, any>) {
        const handlers = this.handlers.get(action);
        if (!handlers) return;

        // Попытка удалить обработчик с прямой ссылкой
        if (handlers.delete(handler)) return;

        // Попытка удалить обработчик по его обёртке
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
        return this.handlers.get(action) as Set<TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>> | undefined;
    }

    [getAllHandlers]() {
        return this.handlers;
    }
}
