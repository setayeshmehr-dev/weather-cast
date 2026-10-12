"use client";

import { useEffect, useState } from "react";

import { getWeatherCondition } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";

export type CitySummary = {
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    condition: string;
    max: number;
    min: number;
    time: string;
    utcOffsetSeconds: number;
};

type ForecastResponse = {
    utc_offset_seconds: number;
    current: {
        time: string;
        temperature_2m: number;
        weather_code: number;
        is_day: number;
    };
    daily: {
        temperature_2m_max: number[];
        temperature_2m_min: number[];
    };
};

export function useCitySummaries(cities: City[]) {
    const key = cities.map((city) => city.id).join("|");
    const latitudes = cities.map((city) => city.latitude).join(",");
    const longitudes = cities.map((city) => city.longitude).join(",");

    const [summaries, setSummaries] = useState<Record<string, CitySummary>>({});

    useEffect(() => {
        const controller = new AbortController();
        const ids = key.split("|");

        async function fetchSummaries() {
            try {
                const api =
                    "https://api.open-meteo.com/v1/forecast" +
                    `?latitude=${latitudes}&longitude=${longitudes}` +
                    "&current=temperature_2m,weather_code,is_day" +
                    "&daily=temperature_2m_max,temperature_2m_min" +
                    "&forecast_days=1&timezone=auto";

                const response = await fetch(api, { signal: controller.signal });
                if (!response.ok) throw new Error("Failed to fetch city summaries.");

                // One location returns an object, several locations return an array.
                const json: unknown = await response.json();
                const items = (Array.isArray(json) ? json : [json]) as ForecastResponse[];

                const next: Record<string, CitySummary> = {};

                items.forEach((item, index) => {
                    next[ids[index]] = {
                        temperature: item.current.temperature_2m,
                        weatherCode: item.current.weather_code,
                        isDay: item.current.is_day === 1,
                        condition: getWeatherCondition(item.current.weather_code),
                        max: item.daily.temperature_2m_max[0],
                        min: item.daily.temperature_2m_min[0],
                        time: item.current.time,
                        utcOffsetSeconds: item.utc_offset_seconds,
                    };
                });

                setSummaries((previous) => ({ ...previous, ...next }));
            } catch {
                // Cards without data keep showing placeholders.
            }
        }

        void fetchSummaries();

        return () => controller.abort();
    }, [key, latitudes, longitudes]);

    return summaries;
}