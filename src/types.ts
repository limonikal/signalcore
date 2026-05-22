import { Trigger as TriggerClass } from "@classes/sources/Trigger";

export type Trigger<ActionData, EmitterThis> = TriggerClass & ActionData & { emitter: EmitterThis };
export type TriggerHandler<ActionData, EmitterThis> = (trigger: Trigger<ActionData, EmitterThis>) => void;
export type BaseActionTypes<ActionTypes> = Record<keyof ActionTypes, Record<any, any>>;
export type DataEmitting<Data extends object> = {
    [K in keyof Data]: {
        from: Data[K];
        value: Data[K];
    };
};

export type EmitterLike<ActionTypes extends Record<keyof ActionTypes, Record<any, any>>> = {
    emit<Action extends keyof ActionTypes>(action: Action, data: ActionTypes[Action]): boolean;
    on<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<ActionTypes[Action], any>): void;
    once<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<ActionTypes[Action], any>): void;
    off<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<ActionTypes[Action], any>): void;
    offAll<Action extends keyof ActionTypes>(action: Action): void;
    clear(): void;
    hasListeners<Action extends keyof ActionTypes>(action: Action): boolean;
    listenerCount<Action extends keyof ActionTypes>(action?: Action): number;
    actions(): (keyof ActionTypes)[];
};
