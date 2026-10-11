"use client";

import { useEffect, useState } from "react";

type ArchiveResponse = {
    daily: {
        temperature_2m_max: (number | null)[];
    };
};

const YEARS = 10;
const WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(time: number): string {
    return new Date(time).toISOString().slice(0, 10);
}

function readCache(key: string): number | null {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;

        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
    } catch {
        return null;
    }
}

function writeCache(key: string, value: number): void {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Storage can be unavailable (private mode, quota); the cache is optional.
    }
}

async function fetchHighs(
    start: string,
    end: string,
    signal: AbortSignal
): Promise<number[]> {
    const api =
        "https://archive-api.open-meteo.com/v1/archive" +
        "?latitude=35.69&longitude=51.42" +
        `&start_date=${start}&end_date=${end}` +
        "&daily=temperature_2m_max&timezone=Asia%2FTehran";

    const response = await fetch(api, { signal });
    if (!response.ok) throw new Error("Failed to fetch climate data.");

    const data = (await response.json()) as ArchiveResponse;

    return data.daily.temperature_2m_max.filter(
        (value): value is number => value !== null
    );
}

/**
 * Average daily high for the given date (YYYY-MM-DD): the mean over the last
 * 10 years, using a window of ±3 days around the same calendar day.
 */
export function useClimateAverage(date: string | null) {
    const [average, setAverage] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!date) return;

        const controller = new AbortController();
        const cacheKey = `weathercast:climate-high:35.69,51.42:${date.slice(5)}`;

        async function fetchAverage(day: string) {
            try {
                setLoading(true);
                setError(null);

                const cached = readCache(cacheKey);

                if (cached !== null) {
                    setAverage(cached);
                    return;
                }

                const [year, month, dayOfMonth] = day.split("-").map(Number);

                const requests = Array.from({ length: YEARS }, (_, index) => {
                    const center = Date.UTC(year - 1 - index, month - 1, dayOfMonth);

                    return fetchHighs(
                        toIsoDate(center - WINDOW_DAYS * DAY_MS),
                        toIsoDate(center + WINDOW_DAYS * DAY_MS),
                        controller.signal
                    );
                });

                const highs = (await Promise.all(requests)).flat();

                if (highs.length === 0) throw new Error("No climate data.");

                const mean = highs.reduce((sum, value) => sum + value, 0) / highs.length;

                writeCache(cacheKey, mean);
                setAverage(mean);
            } catch {
                if (!controller.signal.aborted) {
                    setError("Unable to load climate averages.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void fetchAverage(date);
        return () => controller.abort();
    }, [date]);

    return { average, loading, error };
}