"use client";

import { useSyncExternalStore } from "react";

import { resolveTemperature } from "@/lib/units";
import {
    getServerSnapshot,
    getSnapshot,
    restoreDefaults,
    setUnit,
    subscribe,
} from "@/lib/unitsStore";

export function useUnits() {
    const units = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        units,
        /** The temperature unit actually in use ("system" resolved). */
        temperatureUnit: resolveTemperature(units.temperature),
        setUnit,
        restoreDefaults,
    };
}