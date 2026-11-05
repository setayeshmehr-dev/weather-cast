"use client";

import { useEffect, useState } from "react";

import type { City } from "@/lib/cities";
import { fetchJson } from "@/lib/fetchJson";

type ArchiveResponse = {
    daily: {
        time: string[];
        temperature_2m_max: (number | null)[];
    };
};

type ClimateState = {
    key: string;
    average: number | null;
    error: string | null;
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

/*
 * Average daily high for the given date (YYYY-MM-DD) in the given city: the mean
 * over the last 10 years, using a window of ±3 days around the same calendar day.
 * One request for all the years (not one per year), then the windows are picked here.
 */
export function useClimateAverage(date: string | null, city: City) {
    const { id, latitude, longitude } = city;
    const key = date ? `${id}|${date}` : null;

    const [state, setState] = useState<ClimateState | null>(null);

    useEffect(() => {
        if (!date || !key) return;

        const controller = new AbortController();
        const cacheKey = `weathercast:climate-high:${id}:${date.slice(5)}`;

        async function fetchAverage(stateKey: string, day: string) {
            try {
                const cached = readCache(cacheKey);

                if (cached !== null) {
                    setState({ key: stateKey, average: cached, error: null });
                    return;
                }

                const [year, month, dayOfMonth] = day.split("-").map(Number);

                const api =
                    "https://archive-api.open-meteo.com/v1/archive" +
                    `?latitude=${latitude}&longitude=${longitude}` +
                    `&start_date=${year - YEARS}-01-01&end_date=${year - 1}-12-31` +
                    "&daily=temperature_2m_max&timezone=auto";

                const data = await fetchJson<ArchiveResponse>(api, {
                    signal: controller.signal,
                    timeoutMs: 20_000,
                    retries: 1,
                });

                const highs = new Map<string, number>();

                data.daily.time.forEach((time, index) => {
                    const value = data.daily.temperature_2m_max[index];

                    if (value !== null && value !== undefined) highs.set(time, value);
                });

                const values: number[] = [];

                for (let back = 1; back <= YEARS; back++) {
                    const center = Date.UTC(year - back, month - 1, dayOfMonth);

                    for (let offset = -WINDOW_DAYS; offset <= WINDOW_DAYS; offset++) {
                        const value = highs.get(toIsoDate(center + offset * DAY_MS));

                        if (value !== undefined) values.push(value);
                    }
                }

                if (values.length === 0) throw new Error("No climate data.");

                const mean =
                    values.reduce((sum, value) => sum + value, 0) / values.length;

                writeCache(cacheKey, mean);
                setState({ key: stateKey, average: mean, error: null });
            } catch {
                if (!controller.signal.aborted) {
                    setState({
                        key: stateKey,
                        average: null,
                        error: "Unable to load climate averages.",
                    });
                }
            }
        }

        void fetchAverage(key, date);

        return () => controller.abort();
    }, [date, key, id, latitude, longitude]);

    const result = key !== null && state !== null && state.key === key ? state : null;

    return {
        average: result?.average ?? null,
        loading: result === null,
        error: result?.error ?? null,
    };
}