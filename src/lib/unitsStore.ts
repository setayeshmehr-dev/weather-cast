import {
    SERVER_UNITS,
    getRegionDefaults,
} from "@/lib/units";
import type { Units } from "@/lib/units";

const STORAGE_KEY = "weathercast:units:v1";

const TEMPERATURES = ["celsius", "fahrenheit", "system"] as const;
const WINDS = ["kmh", "mph", "ms", "kn"] as const;
const PRECIPITATIONS = ["mm", "in"] as const;
const PRESSURES = ["hpa", "inhg", "mmhg", "kpa"] as const;
const DISTANCES = ["km", "mi"] as const;

const listeners = new Set<() => void>();

// The snapshot must be the same object until something changes.
let cached: Units | null = null;

function isOneOf<T extends string>(
    value: unknown,
    list: readonly T[]
): value is T {
    return typeof value === "string" && (list as readonly string[]).includes(value);
}

function parseUnits(value: unknown): Units | null {
    if (typeof value !== "object" || value === null) return null;

    const { temperature, wind, precipitation, pressure, distance } =
        value as Record<string, unknown>;

    if (
        isOneOf(temperature, TEMPERATURES) &&
        isOneOf(wind, WINDS) &&
        isOneOf(precipitation, PRECIPITATIONS) &&
        isOneOf(pressure, PRESSURES) &&
        isOneOf(distance, DISTANCES)
    ) {
        return { temperature, wind, precipitation, pressure, distance };
    }

    return null;
}

function load(): Units {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored = raw === null ? null : parseUnits(JSON.parse(raw));

        if (stored) return stored;
    } catch {
        // Storage can be unavailable or hold something else; use the defaults.
    }

    return getRegionDefaults();
}

function notify(): void {
    listeners.forEach((listener) => listener());
}

export function getSnapshot(): Units {
    if (cached === null) cached = load();
    return cached;
}

export function getServerSnapshot(): Units {
    return SERVER_UNITS;
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    // Another tab changed the units.
    const onStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY) return;

        cached = null;
        listener();
    };

    window.addEventListener("storage", onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

export function setUnit<K extends keyof Units>(key: K, value: Units[K]): void {
    cached = { ...getSnapshot(), [key]: value };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
        // The setting still works until the page is closed.
    }

    notify();
}

export function restoreDefaults(): void {
    cached = getRegionDefaults();

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to remove.
    }

    notify();
}