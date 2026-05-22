import { Emitter } from "./Emitter";
import type { TriggerHandler } from "@/types";

type UnionActionTypes<T extends Emitter<any>[]> =
    T[number] extends Emitter<infer U>
        ? U
        : never;

export class Union<T extends Emitter<any>[]> {
    private readonly emitters: T;

    constructor(...emitters: T) {
        this.emitters = emitters;
    }

    on<Action extends keyof UnionActionTypes<T>>(
        action: Action,
        handler: TriggerHandler<UnionActionTypes<T>[Action], any>,
        options?: any
    ) {
        for (const emitter of this.emitters) {
            (emitter as any).on(action, handler, options);
        }
    }

    off<Action extends keyof UnionActionTypes<T>>(
        action: Action,
        handler: TriggerHandler<any, any>
    ) {
        for (const emitter of this.emitters) {
            (emitter as any).off(action, handler);
        }
    }

    offAll<Action extends keyof UnionActionTypes<T>>(action: Action) {
        for (const emitter of this.emitters) {
            (emitter as any).offAll(action);
        }
    }

    clear() {
        for (const emitter of this.emitters) {
            emitter.clear();
        }
    }

    emit<Action extends keyof UnionActionTypes<T>>(action: Action, data: UnionActionTypes<T>[Action]) {
        for (const emitter of this.emitters) {
            (emitter as any).emit(action, data);
        }
    }
}


// export class Union<ActionTypes extends Record<keyof ActionTypes, Record<any, any>>> extends Emitter<ActionTypes> {
//     private readonly emitters: Emitter<ActionTypes>[];
//
//     constructor(...emitters: Emitter<ActionTypes>[]) {
//         super();
//         this.emitters = emitters;
//     }
//
//     on<Action extends keyof ActionTypes>(
//         action: Action,
//         handler: TriggerHandler<ActionTypes[Action], Emitter<ActionTypes>>,
//         // @ts-ignore
//         options?: any
//     ) {
//         const emitters = this.emitters;
//         const length = emitters.length;
//         for (let i = 0; i < length; i++) {
//             emitters[i].on(action, handler, options);
//         }
//     }
//
//     off<Action extends keyof ActionTypes>(action: Action, handler: TriggerHandler<any, any>) {
//         const emitters = this.emitters;
//         const length = emitters.length;
//         for (let i = 0; i < length; i++) {
//             emitters[i].off(action, handler);
//         }
//     }
//
//     offAll<Action extends keyof ActionTypes>(action: Action) {
//         const emitters = this.emitters;
//         const length = emitters.length;
//         for (let i = 0; i < length; i++) {
//             emitters[i].offAll(action);
//         }
//     }
//
//     clear() {
//         const emitters = this.emitters;
//         const length = emitters.length;
//         for (let i = 0; i < length; i++) {
//             emitters[i].clear();
//         }
//     }
// }
