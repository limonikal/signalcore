import { Emitter } from "./Emitter";
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
    private readonly emitter: Emitter<ActionTypes>;
    private readonly handler: MiddlewareHandler<ActionTypes, UsedActions>;
    private readonly wrappingActions: UsedActions;

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
        return this.wrappingActions;
    }

    destroy() {
        const actions = this.wrappingActions;
        const length = actions.length;
        const handler = this.handler;
        for (let i = 0; i < length; i++) {
            this.emitter.on(actions[i], handler);
        }
    }
}
