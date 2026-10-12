"use client";

import { useEffect, useState } from "react";

import type { City } from "@/lib/cities";

type ArchiveResponse = {
    daily: {
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

async function fetchHighs(
    latitude: number,
    longitude: number,
    start: string,
    end: string,
    signal: AbortSignal
): Promise<number[]> {
    const api =
        "https://archive-api.open-meteo.com/v1/archive" +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&start_date=${start}&end_date=${end}` +
        "&daily=temperature_2m_max&timezone=auto";

    const response = await fetch(api, { signal });
    if (!response.ok) throw new Error("Failed to fetch climate data.");

    const data = (await response.json()) as ArchiveResponse;

    return data.daily.temperature_2m_max.filter(
        (value): value is number => value !== null
    );
}

/**
 * Average daily high for the given date (YYYY-MM-DD) in the given city: the mean
 * over the last 10 years, using a window of ±3 days around the same calendar day.
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

                const requests = Array.from({ length: YEARS }, (_, index) => {
                    const center = Date.UTC(year - 1 - index, month - 1, dayOfMonth);

                    return fetchHighs(
                        latitude,
                        longitude,
                        toIsoDate(center - WINDOW_DAYS * DAY_MS),
                        toIsoDate(center + WINDOW_DAYS * DAY_MS),
                        controller.signal
                    );
                });

                const highs = (await Promise.all(requests)).flat();

                if (highs.length === 0) throw new Error("No climate data.");

                const mean = highs.reduce((sum, value) => sum + value, 0) / highs.length;

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