import { Emitter } from "../sources/Emitter";
import type { Trigger } from "@/types";

type MiddlewareActionTypes<
    ActionTypes extends Record<keyof ActionTypes, Record<any, any>>,
    UsedActions extends (keyof ActionTypes)[]
> = ActionTypes[UsedActions[number]];
type MiddlewareHandler<
    ActionTypes extends Record<keyof ActionTypes, Record<any, any>>,
    UsedActions extends (keyof ActionTypes)[]
> = (target: Trigger<MiddlewareActionTypes<ActionTypes, UsedActions>, Emitter<ActionTypes>>) => void;

export class Middleware<
    ActionTypes extends Record<keyof ActionTypes, Record<any, any>>,
    UsedActions extends (keyof ActionTypes)[]
> {
    private emitter: Emitter<ActionTypes> | null = null;
    private handler: MiddlewareHandler<ActionTypes, UsedActions> | null = null;
    private readonly wrappingActions: UsedActions;
    private destroyed = false;

    constructor(
        emitter: Emitter<ActionTypes>,
        actions: UsedActions,
        handler: MiddlewareHandler<ActionTypes, UsedActions>
    ) {
        this.emitter = emitter;
        this.wrappingActions = actions;
        this.handler = handler;

        const length = actions.length;
        for (let i = 0; i < length; i++) {
            this.emitter.on(actions[i], handler);
        }
    }

    get actions() {
        return [...this.wrappingActions];
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        const { emitter, handler, wrappingActions: actions } = this;
        if (!emitter || !handler) return;
        const length = actions.length;
        for (let i = 0; i < length; i++) {
            emitter.off(actions[i], handler);
        }
        this.emitter = null;
        this.handler = null;
    }
}
