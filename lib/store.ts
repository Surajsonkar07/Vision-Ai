"use client";

import { useSyncExternalStore } from "react";

export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Subscribe to a store. `serverValue` is used during SSR and hydration. */
export function useStore<T>(store: Store<T>, serverValue?: T): T {
  return useSyncExternalStore(store.subscribe, store.get, () => serverValue ?? store.get());
}

const noopSubscribe = () => () => {};
/** true after hydration on the client, false on the server and during hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
