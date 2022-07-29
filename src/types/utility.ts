

/**
 * Alias to allow being explicit about numbers that should be integers
 */
export type Integer = number;

/**
 * A generic tuple type
 */
export type Pair<T> = readonly [T, T];

/**
 * A type to get completion for event names and event types for any DOM element interface.
 *
 * Every interface `FooElement` descended from `Element` has a corresponding `FooElementEventMap` interface descended from `GlobalEventHandlersEventMap`
 * that qualifies the events that can occur on that element
 */
export type EventHandlers<EventMap extends GlobalEventHandlersEventMap> = {
  [K in keyof EventMap]?: (ev: EventMap[K]) => any
};
