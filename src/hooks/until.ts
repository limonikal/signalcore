import { type Emitter } from "@classes/sources/Emitter";
import type { BaseActionTypes, Trigger } from "@/types";

export async function until<
    ActionTypes extends BaseActionTypes<ActionTypes>,
    Action extends keyof ActionTypes
>(emitter: Emitter<ActionTypes>, action: Action) {
    return new Promise<Trigger<ActionTypes[Action]>>((resolve: (trigger: Trigger<ActionTypes[Action]>) => void) => {
        emitter.once(action, resolve);
    });
}
