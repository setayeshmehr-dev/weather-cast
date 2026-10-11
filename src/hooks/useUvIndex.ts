
"use client";

import { useEffect, useState } from "react";

type UvIndexData = {
    current: {
        time: string;
    };
    hourly: {
        time: string[];
        uv_index: (number | null)[];
    };
};

export function useUvIndex() {
    const [uvIndex, setUvIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchUvIndex() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=35.69&longitude=51.42&current=temperature_2m&hourly=uv_index&forecast_days=1&timezone=Asia%2FTehran",
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch UV index.");
                }

                const data = (await response.json()) as UvIndexData;
                const currentHour = data.current.time.slice(0, 13);
                const index = data.hourly.time.findIndex(
                    (time) => time.slice(0, 13) === currentHour
                );
                const value = data.hourly.uv_index[index];

                if (index < 0 || value == null || !Number.isFinite(value)) {
                    throw new Error("UV index is unavailable.");
                }

                setUvIndex(value);
            } catch {
                if (!controller.signal.aborted) {
                    setError("Unable to load UV index.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchUvIndex();

        return () => controller.abort();
    }, []);

    return { uvIndex, loading, error };
}
