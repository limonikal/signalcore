# AGENTS.md — Проектная память

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

## Ключевые решения и конвенции

- **Типизация**: строгая через generic `ActionTypes extends Record<keyof, Record<any, any>>`
- **Trigger** — это не класс, а пересечение (intersection type): `TriggerClass & ActionData & { emitter }`
- **Обработчики** хранятся в `Map<action, Set<handler>>`, итерация через `.values()` (не forEach — чтобы сохранить контроль)
- **once** реализован через обёртку в WeakMap
- **off** ищет handler напрямую, затем по once-обёртке
- **Symbol**-ключи (`getActionHandlers`, `getAllHandlers`) для внутреннего доступа (паттерн protected без protected)
- **EventTargetEmitter.on** создаёт AbortController для каждого listener; при вызове off — abort
- **Middleware** в конструкторе навешивает handler через `emitter.on`, destroy делает `emitter.off` (баг: сейчас в destroy снова on!)
- **Union** не extends Emitter — это композиция (делегирует emit/on/off всем переданным emitter'ам)
- **ProxyEmitter/Stor**: `deleteProperty` всегда false (защита от удаления полей)
- **Сборка**: Vite + vite-plugin-dts, алиасы `@/`, `@classes/`, `@hooks/`
- **moduleResolution**: bundler, `verbatimModuleSyntax: true`, `noEmit: true`
- **Формат**: ESM + CJS (через Vite)

## Запреты

- **НЕ запускать `vite build` без явной просьбы пользователя.** Только если он сам попросит собрать проект.

## План публикации в npm

- [ ] Выбрать финальное имя пакета (текущее "test-emitter" — временное)
- [ ] Обновить `name` в package.json
- [ ] Настроить `repository.url`, `homepage`, `bugs.url`
- [ ] Проверить/добавить `files` в package.json (dist, README.md)
- [ ] Убедиться, что сборка корректно генерирует .d.ts
- [ ] Добавить `prepublishOnly` скрипт: `"prepublishOnly": "vite build"`
- [ ] Добавить README.md с документацией
- [ ] Добавить LICENSE (Apache-2.0 уже указан)
- [ ] `npm login`
- [ ] `npm publish --access public`
- [ ] Настроить CI (GitHub Actions) для авто-публикации по тегам

## Известные баги

1. **Middleware.destroy()** вызывает `emitter.on()` вместо `emitter.off()` — строки 45-46 в Middleware.ts
