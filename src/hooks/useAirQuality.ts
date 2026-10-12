"use client";

import { useEffect, useState } from "react";

import type { City } from "@/lib/cities";

export type AirQuality = {
    index: number;
    label: string;
    trend: "better" | "worse" | "similar" | null;
};

type AirQualityResponse = {
    current: {
        time: string;
        european_aqi: number | null;
    };
    hourly: {
        time: string[];
        european_aqi: (number | null)[];
    };
};

type AirQualityState = {
    key: string;
    airQuality: AirQuality | null;
    error: string | null;
};

// Index difference (points) below which today counts as "similar to yesterday".
const SIMILAR_THRESHOLD = 5;

function getLabel(index: number): string {
    const value = Math.round(index);

    if (value <= 20) return "Good";
    if (value <= 40) return "Fair";
    if (value <= 60) return "Moderate";
    if (value <= 80) return "Poor";
    if (value <= 100) return "Very poor";
    return "Extremely poor";
}

function getTrend(now: number, before: number | null | undefined): AirQuality["trend"] {
    if (before === null || before === undefined) return null;

    const difference = now - before;

    if (Math.abs(difference) < SIMILAR_THRESHOLD) return "similar";
    return difference > 0 ? "worse" : "better";
}

export function useAirQuality(city: City) {
    const { id: key, latitude, longitude } = city;

    const [state, setState] = useState<AirQualityState | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAirQuality() {
            try {
                const api =
                    "https://air-quality-api.open-meteo.com/v1/air-quality" +
                    `?latitude=${latitude}&longitude=${longitude}` +
                    "&current=european_aqi" +
                    "&hourly=european_aqi" +
                    "&past_days=1&forecast_days=1&timezone=auto";

                const response = await fetch(api, { signal: controller.signal });
                if (!response.ok) throw new Error("Failed to fetch air quality.");

                const data = (await response.json()) as AirQualityResponse;
                const index = data.current.european_aqi;

                if (index === null || index === undefined) {
                    throw new Error("Air quality data is unavailable.");
                }

                const hourKey = `${data.current.time.slice(0, 13)}:00`;
                const hourIndex = data.hourly.time.indexOf(hourKey);
                const yesterday = hourIndex >= 24 ? data.hourly.european_aqi[hourIndex - 24] : null;

                setState({
                    key,
                    airQuality: {
                        index,
                        label: getLabel(index),
                        trend: getTrend(index, yesterday),
                    },
                    error: null,
                });
            } catch {
                if (!controller.signal.aborted) {
                    setState({
                        key,
                        airQuality: null,
                        error: "Unable to load air quality.",
                    });
                }
            }
        }

        void fetchAirQuality();

        return () => controller.abort();
    }, [key, latitude, longitude]);

    const result = state !== null && state.key === key ? state : null;

    return {
        airQuality: result?.airQuality ?? null,
        loading: result === null,
        error: result?.error ?? null,
    };
}