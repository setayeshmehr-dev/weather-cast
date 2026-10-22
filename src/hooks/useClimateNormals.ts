"use client";

import { useEffect, useState } from "react";

import type { City } from "@/lib/cities";
import { fetchJson } from "@/lib/fetchJson";

export type ClimateNormals = {
    /** Average daily high around this date (°C). */
    averageHigh: number;
    /** Lower and upper edge of the normal temperature, per hour of the day (°C). */
    low: number[];
    high: number[];
    rangeMin: number;
    rangeMax: number;
};

type ArchiveResponse = {
    hourly: {
        time: string[];
        temperature_2m: (number | null)[];
    };
};

type NormalsState = {
    key: string;
    data: ClimateNormals | null;
    error: string | null;
};

const YEARS = 10;
const WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_PERCENTILE = 0.1;
const HIGH_PERCENTILE = 0.9;

function toIsoDate(time: number): string {
    return new Date(time).toISOString().slice(0, 10);
}

function percentile(sorted: number[], fraction: number): number {
    const position = (sorted.length - 1) * fraction;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function isNormals(value: unknown): value is ClimateNormals {
    if (typeof value !== "object" || value === null) return false;

    const item = value as Record<string, unknown>;

    return (
        typeof item.averageHigh === "number" &&
        Array.isArray(item.low) &&
        item.low.length === 24 &&
        Array.isArray(item.high) &&
        item.high.length === 24 &&
        typeof item.rangeMin === "number" &&
        typeof item.rangeMax === "number"
    );
}

function readCache(key: string): ClimateNormals | null {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);

        return isNormals(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function writeCache(key: string, value: ClimateNormals): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage can be unavailable (private mode, quota); the cache is optional.
    }
}

async function fetchWindow(
    latitude: number,
    longitude: number,
    start: string,
    end: string,
    signal: AbortSignal
): Promise<ArchiveResponse["hourly"]> {
    const api =
        "https://archive-api.open-meteo.com/v1/archive" +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&start_date=${start}&end_date=${end}` +
        "&hourly=temperature_2m&timezone=auto";

    const data = await fetchJson<ArchiveResponse>(api, {
        signal,
        timeoutMs: 15_000,
        retries: 1,
    });

    return data.hourly;
}

/**
 * Normal temperatures for a date (YYYY-MM-DD): hour by hour over the last
 * 10 years, in a window of ±3 days around the same calendar day.
 */
export function useClimateNormals(date: string | null, city: City) {
    const { id, latitude, longitude } = city;
    const key = date ? `${id}|${date}` : null;

    const [state, setState] = useState<NormalsState | null>(null);

    useEffect(() => {
        if (!date || !key) return;

        const controller = new AbortController();
        const cacheKey = `weathercast:climate-normals:${id}:${date.slice(5)}`;

        async function fetchNormals(stateKey: string, day: string) {
            try {
                const cached = readCache(cacheKey);

                if (cached !== null) {
                    setState({ key: stateKey, data: cached, error: null });
                    return;
                }

                const [year, month, dayOfMonth] = day.split("-").map(Number);

                const windows = await Promise.all(
                    Array.from({ length: YEARS }, (_, index) => {
                        const center = Date.UTC(year - 1 - index, month - 1, dayOfMonth);

                        return fetchWindow(
                            latitude,
                            longitude,
                            toIsoDate(center - WINDOW_DAYS * DAY_MS),
                            toIsoDate(center + WINDOW_DAYS * DAY_MS),
                            controller.signal
                        );
                    })
                );

                const byHour: number[][] = Array.from({ length: 24 }, () => []);
                const dailyMax = new Map<string, number>();

                for (const window of windows) {
                    window.time.forEach((stamp, index) => {
                        const value = window.temperature_2m[index];

                        if (value === null || value === undefined) return;

                        byHour[Number(stamp.slice(11, 13))].push(value);

                        const dayKey = stamp.slice(0, 10);

                        dailyMax.set(
                            dayKey,
                            Math.max(dailyMax.get(dayKey) ?? -Infinity, value)
                        );
                    });
                }

                if (byHour.some((list) => list.length === 0) || dailyMax.size === 0) {
                    throw new Error("No climate data.");
                }

                const sorted = byHour.map((list) => [...list].sort((a, b) => a - b));
                const low = sorted.map((list) => percentile(list, LOW_PERCENTILE));
                const high = sorted.map((list) => percentile(list, HIGH_PERCENTILE));
                const maxima = [...dailyMax.values()];

                const data: ClimateNormals = {
                    averageHigh:
                        maxima.reduce((sum, value) => sum + value, 0) / maxima.length,
                    low,
                    high,
                    rangeMin: Math.min(...low),
                    rangeMax: Math.max(...high),
                };

                writeCache(cacheKey, data);
                setState({ key: stateKey, data, error: null });
            } catch {
                if (!controller.signal.aborted) {
                    setState({
                        key: stateKey,
                        data: null,
                        error: "Unable to load climate averages.",
                    });
                }
            }
        }

        void fetchNormals(key, date);

        return () => controller.abort();
    }, [date, key, id, latitude, longitude]);

    const result = key !== null && state !== null && state.key === key ? state : null;

    return {
        data: result?.data ?? null,
        loading: result === null,
        error: result?.error ?? null,
    };
}