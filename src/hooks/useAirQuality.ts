"use client";

import { useEffect, useState } from "react";

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

export function useAirQuality() {
    const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAirQuality() {
            try {
                setLoading(true);
                setError(null);

                const api =
                    "https://air-quality-api.open-meteo.com/v1/air-quality" +
                    "?latitude=35.69&longitude=51.42" +
                    "&current=european_aqi" +
                    "&hourly=european_aqi" +
                    "&past_days=1&forecast_days=1&timezone=Asia%2FTehran";

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

                setAirQuality({
                    index,
                    label: getLabel(index),
                    trend: getTrend(index, yesterday),
                });
            } catch {
                if (!controller.signal.aborted) {
                    setError("Unable to load air quality.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void fetchAirQuality();
        return () => controller.abort();
    }, []);

    return { airQuality, loading, error };
}