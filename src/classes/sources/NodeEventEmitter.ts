import { Emitter } from "./Emitter";
import type { TriggerHandler } from "@/types";

interface NodeEventSource {
    on(event: string, listener: (...args: any[]) => void): any;
    once(event: string, listener: (...args: any[]) => void): any;
    off(event: string, listener: (...args: any[]) => void): any;
}

export class NodeEventEmitter<ActionTypes extends Record<string, any[]>> extends Emitter<ActionTypes> {
    private readonly source: NodeEventSource;
    private readonly handlerWrappers
        = new Map<keyof ActionTypes, Map<TriggerHandler<any, any>, (...args: any[]) => void>>();

    constructor(source: NodeEventSource) {
        super();
        this.source = source;
    }

    on<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
    ) {
        const wrapper = (...args: any[]) => {
            super.emit(action, args as ActionTypes[Action]);
        };

        let actionWrappers = this.handlerWrappers.get(action);
        if (!actionWrappers) {
            actionWrappers = new Map();
            this.handlerWrappers.set(action, actionWrappers);
        }
        actionWrappers.set(handler, wrapper);

        this.source.on(action as string, wrapper);
        super.on(action, handler);
    }

    once<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
    ) {
        const wrapper = (...args: any[]) => {
            this.handlerWrappers.get(action)?.delete(handler);
            super.emit(action, args as ActionTypes[Action]);
        };

        let actionWrappers = this.handlerWrappers.get(action);
        if (!actionWrappers) {
            actionWrappers = new Map();
            this.handlerWrappers.set(action, actionWrappers);
        }
        actionWrappers.set(handler, wrapper);

        this.source.once(action as string, wrapper);
        super.once(action, handler);
    }

    off<Action extends keyof ActionTypes>(
        action: Action,
        handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
    ) {
        const actionWrappers = this.handlerWrappers.get(action);
        if (!actionWrappers) return;
        const wrapper = actionWrappers.get(handler);
        if (!wrapper) return;

        this.source.off(action as string, wrapper);
        actionWrappers.delete(handler);
        super.off(action, handler);
    }

    offAll<Action extends keyof ActionTypes>(action: Action) {
        const actionWrappers = this.handlerWrappers.get(action);
        if (!actionWrappers) return;
        for (const wrapper of actionWrappers.values()) {
            this.source.off(action as string, wrapper);
        }
        this.handlerWrappers.delete(action);
        super.offAll(action);
    }

    clear() {
        for (const [action, actionWrappers] of this.handlerWrappers) {
            for (const wrapper of actionWrappers.values()) {
                this.source.off(action as string, wrapper);
            }
        }
        this.handlerWrappers.clear();
        super.clear();
    }
}
