# signalcore

Typed event-driven architecture for TypeScript. Zero runtime overhead. Full type safety.

```ts
interface AppEvents {
    login: { user: string };
}

const emitter = new Emitter<AppEvents>();

emitter.on("login", (t) => console.log(`Welcome, ${t.user}`));
//    ^ action autocompleted, trigger.data fully typed

emitter.emit("login", { user: "Alice" });
//                    ^ only valid shape compiles
```

---

## Why signalcore?

Most event libraries treat events as strings with `any` payload. You lose type information the moment you call `emit` or `on`. signalcore fixes this at the core: **every action is permanently linked to its data type**.

- **Full type safety** — `emit` with wrong data is a compile error. Handlers receive exactly the type declared for the action. No `any` leaks.
- **Tree-shakable** — import only what you use. ESM + CJS dual format.
- **Systematic approach** — not just an event emitter. A complete typed event-driven toolkit:
  - `Emitter` — typed event bus
  - `EventTargetEmitter` — bridge to DOM events
  - `NodeEventEmitter` — bridge to Node.js EventEmitter
  - `Union` — compose multiple emitters into one interface
  - `Middleware` — intercept groups of actions
  - `ProxyEmitter` — reactive objects: `proxy.x = v` → emit
  - `Stor` — reactive store with custom comparators (no emit on equal values)
  - `until` — async helper: `await until(emitter, "ready")`
- **Runtime-validatable** — every event trigger is `instanceof Trigger`, so you can check it at runtime.
- **Memory safe** — uses `WeakMap` for `once` wrappers, no timer leaks, no global caches.
- **Architectural freedom** — no framework lock-in. Works in browser, Node.js, or anywhere TypeScript runs.

---

## Quick example

```ts
import { Emitter, until } from "signalcore";

type Events = {
    ready: { data: string };
    error: { code: number };
};

const bus = new Emitter<Events>();

// Subscribe with full autocomplete
bus.on("ready", ({ data, emitter }) => {
    console.log(data);  // string
    emitter.emit("error", { code: 0 }); // typed emit from handler
});

// Async wait for exactly one emission
const trigger = await until(bus, "ready");

// Broadcast
bus.emit("ready", { data: "hello" });
```

More examples are available in the [`examples/`](./examples) folder of the repository.

---

## Installation

```sh
npm install signalcore
```

```sh
yarn add signalcore
```

```sh
pnpm add signalcore
```

```ts
// ESM
import { Emitter, Union, until } from "signalcore";

// CJS
const { Emitter, Union, until } = require("signalcore");
```

---

## Documentation

### Core: `Emitter<ActionTypes>`

The foundation. An `Emitter` maps action names to their data types.

```ts
import { Emitter } from "signalcore";

type AppEvents = {
    login: { user: string };
    logout: {};
    error: { code: number; message: string };
};

const e = new Emitter<AppEvents>();
```

#### Methods

| Method | Signature | Description |
|---|---|---|
| `emit` | `(action, data) => boolean` | Creates a `Trigger`, calls all handlers. Returns `true` if any handler was called. |
| `on` | `(action, handler)` | Subscribe to an action. |
| `once` | `(action, handler)` | Subscribe for one emission, then auto-unsubscribe. |
| `off` | `(action, handler)` | Unsubscribe a specific handler. Handler is typed to the action. |
| `offAll` | `(action)` | Remove all handlers for an action. |
| `clear` | `()` | Remove all handlers for all actions. |
| `hasListeners` | `(action) => boolean` | Check if an action has subscribers. |
| `listenerCount` | `(action?) => number` | Count subscribers (for an action or total). |
| `actions` | `() => (keyof ActionTypes)[]` | List all actions that have subscribers. |

#### Error handling

One failing handler never breaks the chain. `emit` wraps each handler call in `try-catch`, logs the error to `console.error`, and continues to the next handler.

#### The `Trigger` object

When an action is emitted, each handler receives a `Trigger` — an intersection of:

```ts
TriggerClass & ActionData & { emitter: Emitter<ActionTypes> }
```

- `t instanceof Trigger` — runtime checkable
- `t.user`, `t.text`, ... — typed action data
- `t.emitter` — reference to the emitter (non-enumerable, does not appear in `JSON.stringify` or `for..in`)

---

### DOM bridge: `EventTargetEmitter<ActionTypes>`

Wraps a native `EventTarget` (DOM element, `window`, `document`) and bridges its events into the typed emitter system.

```ts
import { EventTargetEmitter } from "signalcore";

const clicks = new EventTargetEmitter<{
    click: MouseEvent;
    submit: SubmitEvent;
}>(document);

clicks.on("click", (t) => {
    t.clientX;  // MouseEvent data
    t.event;    // original Event object
}, { capture: true });

// External signal for cleanup
const ctrl = new AbortController();
clicks.on("click", () => {}, { signal: ctrl.signal });
ctrl.abort();
```

---

### Node.js bridge: `NodeEventEmitter<ActionTypes>`

Wraps a Node.js `EventEmitter` (or any object with `on`/`once`/`off`) into the typed system. Action data is a tuple of event arguments.

```ts
import { EventEmitter } from "events";
import { NodeEventEmitter } from "signalcore";

const source = new EventEmitter();

const bridge = new NodeEventEmitter<{
    data: [Buffer];
    end: [];
    error: [Error];
}>(source);

bridge.on("data", ([chunk]) => {
    console.log(chunk.toString());
});
```

---

### Composition: `Union<ActionTypes>`

Combines multiple emitters with the same `ActionTypes` into one interface. Supports dynamic `add` and `remove`.

```ts
import { Emitter, Union } from "signalcore";

type Events = { tick: number };

const a = new Emitter<Events>();
const b = new Emitter<Events>();
const union = new Union(a, b);

union.on("tick", (t) => console.log(t));
a.emit("tick", 1); // fires
b.emit("tick", 2); // fires

const c = new Emitter<Events>();
union.add(c);   // replays existing subscriptions onto c
union.remove(b); // unsubscribes b from all tracked handlers
```

Union accepts any `EmitterLike` — including other Union instances. Unlimited nesting.

```ts
const inner = new Union(e1, e2);
const outer = new Union(inner, e3); // nested Union
```

---

### Middleware: `Middleware<ActionTypes, Actions>`

Attaches one handler to multiple actions. Useful for logging, metrics, or cross-cutting concerns.

```ts
import { Emitter, Middleware } from "signalcore";

const bus = new Emitter<{ login: {}; logout: {} }>();

const logger = new Middleware(bus, ["login", "logout"], (t) => {
    console.log("Action:", t);
});

bus.emit("login", {}); // logs

logger.destroy(); // unsubscribes from both actions
```

---

### Reactive proxy: `createProxyEmitter<Data>`

Turns a plain object into a reactive proxy: property assignment automatically emits an event with `{ from, value }`.

```ts
import { createProxyEmitter } from "signalcore";

const state = createProxyEmitter({ x: 0, y: 0 });

state.emitter.on("x", ({ from, value }) => {
    console.log(`${from} → ${value}`);
});

state.x = 10; // emits "x" with { from: 0, value: 10 }
state.x = 20; // emits "x" with { from: 10, value: 20 }

// Properties cannot be deleted (type integrity)
delete state.x; // no-op, returns false

// Technical fields (emitter) are non-enumerable
JSON.stringify(state); // "{"x":20,"y":0}"
```

---

### Reactive store: `createStor<Data>`

Like `createProxyEmitter`, but with custom comparators. Does not emit if the new value equals the old one by your comparator.

```ts
import { createStor } from "signalcore";

const store = createStor(
    { user: { name: "Alice" }, count: 0 },
    { user: (a, b) => a.name === b.name },
);

store.emitter.on("user", ({ value }) => console.log("changed:", value.name));

store.user = { name: "Alice" }; // silent (comparator says "equal")
store.user = { name: "Bob" };   // emits
store.count = 0;                 // silent (===)
store.count = 1;                 // emits
```

---

### Async helper: `until(emitter, action)`

Returns a `Promise` that resolves with the `Trigger` on the next emission.

```ts
import { Emitter, until } from "signalcore";

async function start() {
    const trigger = await until(bus, "ready");
    console.log(trigger.data);
}
```

Combine with `Promise.race` for timeouts:

```ts
const result = await Promise.race([
    until(bus, "ready"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
]);
```

---

### `EmitterLike<ActionTypes>` interface

Any object that satisfies the `EmitterLike` interface — including `Emitter`, `Union`, or custom implementations — can be used wherever an event source is expected. This enables unlimited compositional flexibility.

```ts
import type { EmitterLike } from "signalcore";

function onTick(target: EmitterLike<{ tick: number }>) {
    target.on("tick", (t) => console.log(t));
}
```

---

## License

Apache-2.0
