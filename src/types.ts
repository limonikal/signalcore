import { Emitter } from "@classes/sources/Emitter";
import { Trigger as TriggerClass } from "@classes/sources/Trigger";

export type Trigger<ActionData, EmitterThis extends Emitter<any>> = TriggerClass & ActionData & { emitter: EmitterThis };
export type TriggerHandler<ActionData, EmitterThis extends Emitter<any>> = (trigger: Trigger<ActionData, EmitterThis>) => void;
export type Options = Parameters<EventTarget["addEventListener"]>[2];
export type BaseActionTypes<ActionTypes> = Record<keyof ActionTypes, Record<any, any>>;
export type DataEmitting<Data extends object> = Record<keyof Data, {
    from: Data[keyof Data];
    value: Data[keyof Data];
}>;
