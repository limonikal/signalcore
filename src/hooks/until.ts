import { type Emitter } from "@classes/sources/Emitter";
import type { BaseActionTypes, Trigger } from "@/types";

export async function until<
    ActionTypes extends BaseActionTypes<ActionTypes>,
    Action extends keyof ActionTypes
>(emitter: Emitter<ActionTypes>, action: Action) {
    return new Promise<Trigger<ActionTypes[Action], Emitter<ActionTypes>>>((resolve: (trigger: Trigger<ActionTypes[Action], Emitter<ActionTypes>>) => void) => {
        emitter.once(action, resolve);
    });
}
