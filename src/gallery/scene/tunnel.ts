import { createElement, Fragment, useEffect, useId, useSyncExternalStore, type ReactNode } from 'react';

/**
 * A tunnel: lets a page view (the lobby, a collection) put its 3D scene into the one canvas the
 * Gallery keeps for the whole visit, without owning that canvas. Changing view swaps the
 * scene inside it, so there is never a second graphics context. It holds no three.js code, so
 * the views can use it without pulling 3D into the page's first download.
 */
export function createTunnel() {
  let entries: { id: string; node: ReactNode }[] = [];
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of listeners) l();
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  const snapshot = () => entries;

  /** Puts `children` into the tunnel for as long as this is mounted. */
  function In({ children }: { children: ReactNode }) {
    const id = useId();
    useEffect(() => {
      entries = [...entries.filter((e) => e.id !== id), { id, node: children }];
      emit();
    }, [id, children]);
    useEffect(
      () => () => {
        entries = entries.filter((e) => e.id !== id);
        emit();
      },
      [id],
    );
    return null;
  }

  /** Renders whatever is in the tunnel (inside the canvas). */
  function Out() {
    const current = useSyncExternalStore(subscribe, snapshot, snapshot);
    return createElement(
      Fragment,
      null,
      current.map((e) => createElement(Fragment, { key: e.id }, e.node)),
    );
  }

  return { In, Out };
}

/** The Gallery's scene tunnel: views put their 3D scene in; the Gallery's canvas draws it. */
export const SceneTunnel = createTunnel();
