# AGENTS.md — Проектная память

> Имя пакета: **emitto** (проверено, свободно на npm)

## О проекте

TypeScript-библиотека для typed event-driven архитектуры. Ядро — `Emitter` с системой триггеров, поверх которого построены:

- **EventTargetEmitter** — мост к нативному DOM EventTarget
- **Middleware** — прослойка-обработчик для группы действий (actions) эмиттера
- **Union** — объединение нескольких эмиттеров в один интерфейс
- **ProxyEmitter** — реактивный объект: изменение поля → emit события
- **Stor** — реактивное хранилище с кастомными компараторами (не эмитит, если значение не изменилось)
- **until** — асинхронный хелпер: ждёт один emit и резолвит Trigger

## Структура src/

```
src/
├── classes/
│   ├── Emitter.ts            — базовый типизированный эмиттер
│   ├── Trigger.ts            — пустой класс-маркер (основа для Trigger type)
│   ├── EventTargetEmitter.ts — обёртка над EventTarget
│   ├── Middleware.ts          — middleware для группы actions
│   ├── Union.ts              — объединение эмиттеров
│   ├── ProxyEmitter.ts       — Proxy-реактивность (сеттер → emit)
│   └── Stor.ts               — Proxy-хранилище с компараторами
├── hooks/
│   ├── until.ts              — Promise, резолвящийся на первый emit
│   └── index.ts              — barrel export hooks
├── types.ts                  — Trigger, TriggerHandler, Options, DataEmitting, BaseActionTypes
├── symbols.ts                — символы: getActionHandlers, getAllHandlers
└── index.ts                  — публичный API (все экспорты)
```

## Философия библиотеки

- **Type safety first** — каждое событие жёстко привязано к своему типу данных через `Emitter<ActionTypes>`. Никаких `any`-утечек: emit с неверным типом данных — ошибка компиляции, обработчик получает именно тот тип, который задекларирован для экшена.
- **Trigger как runtime-сущность** — `TriggerClass` сделан классом (не интерфейсом) ради `instanceof Trigger` в рантайме. Данные намешиваются через `Object.assign` поверх экземпляра, чтобы в одном объекте были и проверяемый тип, и payload, и ссылка на emitter.
- **Память под контролем** — WeakMap для once-обёрток (оригинальный handler может GC-нуться, обёртка исчезнет сама). Никаких ручных чисток кроме тех, что явно вызвал пользователь (`off`, `offAll`, `clear`, `destroy`). Никаких таймеров, глобальных кешей, утечек через забытые подписки.
- **Читаемость важнее магии** — код пишется в расчёте на то, что его будут читать. Отказ от `forEach` в пользу ручного итератора — чтобы было видно контроль потока. WeakMap для once вместо сложных Set'ов обёрток.

## Ключевые решения и конвенции

- **Типизация**: строгая через generic `ActionTypes extends Record<keyof, Record<any, any>>`
- **Trigger** — это не класс, а пересечение (intersection type): `TriggerClass & ActionData & { emitter }`
- **Обработчики** хранятся в `Map<action, Set<handler>>`, итерация через `.values()` (не forEach — чтобы сохранить контроль)
- **once** реализован через обёртку в WeakMap
- **off** ищет handler напрямую, затем по once-обёртке
- **Symbol**-ключи (`getActionHandlers`, `getAllHandlers`) для внутреннего доступа (паттерн protected без protected)
- **EventTargetEmitter.on** создаёт AbortController для каждого listener; при вызове off — abort
- **EventTargetEmitter**: `options` типа `AddEventListenerOptions | boolean` (DOM-тип, не самописный `Options`). Не мутирует переданный `options` — создаёт `mergedOptions` через spread. Цепляет пользовательский `signal` через `addEventListener("abort", () => aborter.abort())` без перезаписи.
- **Middleware** в конструкторе навешивает handler через `emitter.on`, destroy делает `emitter.off` (баг: сейчас в destroy снова on!)
- **Union** — композиция (делегирует emit/on/off всем emitter'ам), не extends Emitter. **Класс в отложенной разработке, не трогать.**
- **ProxyEmitter/Stor** — `emitter` создаётся до Proxy и доступен через **замыкание** (closure), а не через `receiver`. Это избавляет от `@ts-ignore` в сеттере. `set` trap возвращает `true` (иначе TypeError в strict mode).
- **Object.defineProperty/defineProperties** — паттерн добавления служебных полей (`emitter`, `comparators`) на proxy-объект, **не затрагивая target**. Обычное присвоение `proxy.emitter = ...` записалось бы на target и смешалось бы с пользовательскими данными. defineProperty вешает поле только на proxy, а `enumerable: false` скрывает его от `for..in`/`JSON.stringify`.
- **deleteProperty → false** — гарантия целостности типа. Если удалить поле из реактивного объекта, структура перестаёт соответствовать `Data`. Блокируя delete, гарантируем: state всегда содержит все поля из типа, любое изменение проходит через `set` → emit.
- **ProxyEmitter/Stor set trap**: возвращает `true` (а не default `true`) — успешная запись, без этого TS/proxy кидает TypeError в strict mode.
- **baseCompare** в Stor: строгое `===`.
- **Сборка**: Vite + vite-plugin-dts, алиасы `@/`, `@classes/`, `@hooks/`
- **moduleResolution**: bundler, `verbatimModuleSyntax: true`, `noEmit: true`
- **Формат**: ESM + CJS (через Vite)
- **Trigger** — пустой класс, данные намешиваются через `Object.assign` в intersection type.

## Emitter API (текущий публичный интерфейс)

| Метод | Сигнатура | Описание |
|---|---|---|
| `emit` | `(action, data) → boolean` | Создаёт Trigger (emitter non-enumerable), вызывает handler'ы. `true` — были вызваны, `false` — нет подписчиков |
| `on` | `(action, handler)` | Подписка на экшен |
| `once` | `(action, handler)` | Подписка на один emit, затем авто-отписка |
| `off` | `(action, handler)` | Отписка. Handler типизирован под action |
| `offAll` | `(action)` | Снять всех подписчиков с экшена |
| `clear` | `()` | Снять все подписки со всех экшенов |
| `hasListeners` | `(action) → boolean` | Есть ли подписчики на экшен |
| `listenerCount` | `(action?) → number` | Количество подписчиков (на экшен или всех) |
| `actions` | `() → (keyof ActionTypes)[]` | Список экшенов с подписками |

## Эмиттер: обработка ошибок

`emit` оборачивает каждый вызов handler'а в try-catch. Один упавший handler не обрывает цепь — остальные получают trigger. Ошибка уходит в `console.error`. Никаких опций suppress/throw — решение принято в пользу **читаемости и простоты**.

## Эмиттер: emitter на Trigger

Поле `emitter` на Trigger — non-enumerable через `Object.defineProperty`. Это единый паттерн со Stor и ProxyEmitter: служебные поля не просачиваются в `for..in`/`JSON.stringify`.

## Правила совместимости

- **Emitter** и **Trigger** — корневые классы. Все новые решения и классы должны быть по возможности совместимы с `Emitter<ActionTypes>`. Если обеспечить совместимость не удаётся — согласовать со мной.

## Запреты

- **НЕ запускать `vite build` без явной просьбы пользователя.** Только если он сам попросит собрать проект.

## План публикации в npm

- [x] Выбрать финальное имя пакета: **emitto** (свободно на npm)
- [x] Обновить `name` в package.json → "emitto"
- [ ] Настроить `repository.url`, `homepage`, `bugs.url`
- [ ] Проверить/добавить `files` в package.json (dist, README.md)
- [ ] Убедиться, что сборка корректно генерирует .d.ts
- [ ] Добавить `prepublishOnly` скрипт: `"prepublishOnly": "vite build"`
- [ ] Добавить README.md с документацией
- [ ] Добавить LICENSE (Apache-2.0 уже указан)
- [ ] `npm login`
- [ ] `npm publish --access public`
- [ ] Настроить CI (GitHub Actions) для авто-публикации по тегам
- [ ] Добавить `"sideEffects": false` для tree-shaking

## Известные баги

1. **Middleware.destroy()** вызывает `emitter.on()` вместо `emitter.off()` — строки 45-46 в Middleware.ts

