"use client";

import { useSyncExternalStore } from "react";

import {
    getDeferredStart,
    getServerDeferredStart,
    subscribeDeferredStart,
} from "@/lib/deferredStart";

/** False until the main weather is ready; true from then on for the whole session. */
export function useDeferredStart(): boolean {
    return useSyncExternalStore(
        subscribeDeferredStart,
        getDeferredStart,
        getServerDeferredStart
    );
}