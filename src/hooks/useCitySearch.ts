"use client";

import { useEffect, useState } from "react";

import { createCity } from "@/lib/cities";
import type { City } from "@/lib/cities";

type GeocodingResult = {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
};

type GeocodingResponse = {
    results?: GeocodingResult[];
};

type SearchState = {
    query: string;
    results: City[];
    error: boolean;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const RESULT_COUNT = 15;
const NO_RESULTS: City[] = [];

export function useCitySearch(query: string) {
    const trimmed = query.trim();
    const active = trimmed.length >= MIN_QUERY_LENGTH;

    const [state, setState] = useState<SearchState>({
        query: "",
        results: NO_RESULTS,
        error: false,
    });

    useEffect(() => {
        if (!active) return;

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            try {
                const api =
                    "https://geocoding-api.open-meteo.com/v1/search" +
                    `?name=${encodeURIComponent(trimmed)}` +
                    `&count=${RESULT_COUNT}&language=en&format=json`;

                const response = await fetch(api, { signal: controller.signal });
                if (!response.ok) throw new Error("Failed to search cities.");

                const data = (await response.json()) as GeocodingResponse;

                const seen = new Set<string>();
                const results: City[] = [];

                for (const item of data.results ?? []) {
                    const city = createCity({
                        name: item.name,
                        admin: item.admin1,
                        country: item.country,
                        latitude: item.latitude,
                        longitude: item.longitude,
                    });

                    if (!seen.has(city.id)) {
                        seen.add(city.id);
                        results.push(city);
                    }
                }

                setState({ query: trimmed, results, error: false });
            } catch {
                if (!controller.signal.aborted) {
                    setState({ query: trimmed, results: NO_RESULTS, error: true });
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [active, trimmed]);

    // The state belongs to the query it was fetched for; anything else means "still loading".
    const settled = active && state.query === trimmed;

    return {
        results: settled ? state.results : NO_RESULTS,
        loading: active && !settled,
        error: settled && state.error,
    };
}