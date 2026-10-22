"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** False on the server and during hydration, true afterwards (client only). */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );
}