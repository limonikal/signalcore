import type { EmitterLike, TriggerHandler } from "@/types";

export class Union<ActionTypes extends Record<keyof ActionTypes, Record<any, any>>> {
    private readonly emitters: EmitterLike<ActionTypes>[];
    private readonly onSubscriptions = new Map<keyof ActionTypes, Set<TriggerHandler<any, any>>>();
    private readonly onceSubscriptions = new Map<keyof ActionTypes, Set<TriggerHandler<any, any>>>();

    constructor(...emitters: EmitterLike<ActionTypes>[]) {
        this.emitters = [...emitters];
    }

    add(emitter: EmitterLike<ActionTypes>): void {
        this.emitters.push(emitter);

        for (const [action, handlers] of this.onSubscriptions) {
            for (const handler of handlers) {
                emitter.on(action, handler);
            }
        }

        for (const [action, handlers] of this.onceSubscriptions) {
            for (const handler of handlers) {
                emitter.once(action, handler);
            }
        }
    }

    remove(emitter: EmitterLike<ActionTypes>): boolean {
        const idx = this.emitters.indexOf(emitter);
        if (idx === -1) return false;
        this.emitters.splice(idx, 1);

        for (const [action, handlers] of this.onSubscriptions) {
            for (const handler of handlers) {
                emitter.off(action, handler);
            }
        }

        for (const [action, handlers] of this.onceSubscriptions) {
            for (const handler of handlers) {
                emitter.off(action, handler);
            }
        }

        return true;
    }

    on<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], any>
    ) {
        let handlers = this.onSubscriptions.get(action);
        if (!handlers) {
            handlers = new Set();
            this.onSubscriptions.set(action, handlers);
        }
        handlers.add(handler);

        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            emitters[i].on(action, handler);
        }
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], any>
    ) {
        let handlers = this.onceSubscriptions.get(action);
        if (!handlers) {
            handlers = new Set();
            this.onceSubscriptions.set(action, handlers);
        }
        handlers.add(handler);

        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            emitters[i].once(action, handler);
        }
    }

    off<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], any>
    ) {
        this.onSubscriptions.get(action)?.delete(handler);
        this.onceSubscriptions.get(action)?.delete(handler);

        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            emitters[i].off(action, handler);
        }
    }

    offAll<Action extends keyof ActionTypes>(action: Action) {
        this.onSubscriptions.delete(action);
        this.onceSubscriptions.delete(action);

        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            emitters[i].offAll(action);
        }
    }

    clear() {
        this.onSubscriptions.clear();
        this.onceSubscriptions.clear();

        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            emitters[i].clear();
        }
    }

    emit<Action extends keyof ActionTypes>(action: Action, data: ActionTypes[Action]): boolean {
        let result = false;
        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            if (emitters[i].emit(action, data)) result = true;
        }
        return result;
    }

    hasListeners<Action extends keyof ActionTypes>(action: Action): boolean {
        if (this.onSubscriptions.has(action) || this.onceSubscriptions.has(action)) return true;
        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            if (emitters[i].hasListeners(action)) return true;
        }
        return false;
    }

    listenerCount<Action extends keyof ActionTypes>(action?: Action): number {
        let count = 0;
        const emitters = this.emitters;
        const length = emitters.length;
        for (let i = 0; i < length; i++) {
            count += emitters[i].listenerCount(action);
        }
        return count;
    }

    actions(): (keyof ActionTypes)[] {
        const emitters = this.emitters;
        const length = emitters.length;
        if (length === 0) return [];
        const set = new Set<keyof ActionTypes>();
        for (let i = 0; i < length; i++) {
            const actions = emitters[i].actions();
            const actionsLength = actions.length;
            for (let j = 0; j < actionsLength; j++) {
                set.add(actions[j]);
            }
        }
        return [...set];
    }
}
