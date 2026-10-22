const PREFIX = "weathercast:weather:v1:";

// Saved weather older than this is not shown at all (the loading screen is used).
const MAX_STORED_AGE_MS = 6 * 60 * 60 * 1000;

// Entries of cities not visited for a day are removed.
const PRUNE_AGE_MS = 24 * 60 * 60 * 1000;

let pruned = false;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function looksLikeWeather(value: unknown): boolean {
    return (
        isRecord(value) &&
        isRecord(value.current) &&
        Array.isArray(value.forecast) &&
        Array.isArray(value.daily) &&
        isRecord(value.details)
    );
}

function readFetchedAt(key: string): number {
    try {
        const raw = localStorage.getItem(key);
        const parsed: unknown = raw === null ? null : JSON.parse(raw);

        return isRecord(parsed) && typeof parsed.fetchedAt === "number"
            ? parsed.fetchedAt
            : 0;
    } catch {
        return 0;
    }
}

function removeOldEntries(maxAgeMs: number, keepKey: string): void {
    const now = Date.now();
    const keys: string[] = [];

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);

        if (key !== null && key.startsWith(PREFIX) && key !== keepKey) {
            keys.push(key);
        }
    }

    for (const key of keys) {
        if (now - readFetchedAt(key) >= maxAgeMs) localStorage.removeItem(key);
    }
}

/** The weather of a city saved by an earlier visit (null if missing or too old). */
export function readStoredWeather<T>(
    cityId: string
): { weather: T; fetchedAt: number } | null {
    try {
        const raw = localStorage.getItem(PREFIX + cityId);

        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);

        if (
            !isRecord(parsed) ||
            typeof parsed.fetchedAt !== "number" ||
            !looksLikeWeather(parsed.weather)
        ) {
            return null;
        }

        if (Date.now() - parsed.fetchedAt > MAX_STORED_AGE_MS) return null;

        return { weather: parsed.weather as T, fetchedAt: parsed.fetchedAt };
    } catch {
        return null;
    }
}

export function writeStoredWeather<T>(
    cityId: string,
    weather: T,
    fetchedAt: number
): void {
    const key = PREFIX + cityId;

    try {
        const value = JSON.stringify({ fetchedAt, weather });

        try {
            if (!pruned) {
                pruned = true;
                removeOldEntries(PRUNE_AGE_MS, key);
            }

            localStorage.setItem(key, value);
        } catch {
            // Storage is full: drop the other saved cities and try once more.
            removeOldEntries(0, key);
            localStorage.setItem(key, value);
        }
    } catch {
        // Storage can be unavailable (private mode, quota); the saved copy is optional.
    }
}