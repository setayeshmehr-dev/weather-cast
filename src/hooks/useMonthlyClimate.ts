"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";

import type { City } from "@/lib/cities";

/** 12 values each: January to December. */
export type MonthlyClimate = {
    /** Average daily low (°C). */
    lows: number[];
    /** Average daily high (°C). */
    highs: number[];
    /** Average monthly precipitation (mm). */
    rain: number[];
};

type ArchiveResponse = {
    daily: {
        time: string[];
        temperature_2m_max: (number | null)[];
        temperature_2m_min: (number | null)[];
        precipitation_sum: (number | null)[];
    };
};

type MonthlyState = {
    key: string;
    data: MonthlyClimate | null;
    error: string | null;
};

const YEARS = 5;

function isMonthly(value: unknown): value is MonthlyClimate {
    if (typeof value !== "object" || value === null) return false;

    const item = value as Record<string, unknown>;
    const twelve = (list: unknown) => Array.isArray(list) && list.length === 12;

    return twelve(item.lows) && twelve(item.highs) && twelve(item.rain);
}

function readCache(key: string): MonthlyClimate | null {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);

        return isMonthly(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function writeCache(key: string, value: MonthlyClimate): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage can be unavailable (private mode, quota); the cache is optional.
    }
}

async function fetchYear(
    latitude: number,
    longitude: number,
    year: number,
    signal: AbortSignal
): Promise<ArchiveResponse["daily"]> {
    const api =
        "https://archive-api.open-meteo.com/v1/archive" +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&start_date=${year}-01-01&end_date=${year}-12-31` +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto";

        const data = await fetchJson<ArchiveResponse>(api, {
        signal,
        timeoutMs: 15_000,
        retries: 1,
    });

    return data.daily;
}

/** Monthly climate of a city over the last 5 complete years. */
export function useMonthlyClimate(city: City) {
    const { id: key, latitude, longitude } = city;

    const [state, setState] = useState<MonthlyState | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const cacheKey = `weathercast:climate-monthly:${key}`;

        async function fetchMonthly() {
            try {
                const cached = readCache(cacheKey);

                if (cached !== null) {
                    setState({ key, data: cached, error: null });
                    return;
                }

                const lastYear = new Date().getFullYear() - 1;

                const years = await Promise.all(
                    Array.from({ length: YEARS }, (_, index) =>
                        fetchYear(latitude, longitude, lastYear - index, controller.signal)
                    )
                );

                const lowSums = Array<number>(12).fill(0);
                const highSums = Array<number>(12).fill(0);
                const lowCounts = Array<number>(12).fill(0);
                const highCounts = Array<number>(12).fill(0);
                const rainSums = Array<number>(12).fill(0);

                for (const daily of years) {
                    daily.time.forEach((date, index) => {
                        const month = Number(date.slice(5, 7)) - 1;
                        const low = daily.temperature_2m_min[index];
                        const high = daily.temperature_2m_max[index];

                        if (low !== null && low !== undefined) {
                            lowSums[month] += low;
                            lowCounts[month]++;
                        }

                        if (high !== null && high !== undefined) {
                            highSums[month] += high;
                            highCounts[month]++;
                        }

                        rainSums[month] += daily.precipitation_sum[index] ?? 0;
                    });
                }

                if (lowCounts.some((count) => count === 0)) {
                    throw new Error("No climate data.");
                }

                const data: MonthlyClimate = {
                    lows: lowSums.map((sum, month) => sum / lowCounts[month]),
                    highs: highSums.map((sum, month) => sum / highCounts[month]),
                    rain: rainSums.map((sum) => sum / YEARS),
                };

                writeCache(cacheKey, data);
                setState({ key, data, error: null });
            } catch {
                if (!controller.signal.aborted) {
                    setState({
                        key,
                        data: null,
                        error: "Unable to load monthly averages.",
                    });
                }
            }
        }

        void fetchMonthly();

        return () => controller.abort();
    }, [key, latitude, longitude]);

    const result = state !== null && state.key === key ? state : null;

    return {
        data: result?.data ?? null,
        loading: result === null,
        error: result?.error ?? null,
    };
}