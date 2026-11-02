"use client";

import { useEffect, useState } from "react";

import { preloadWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";
import { preloadImage, preloadWeatherVideo } from "@/lib/preloadVideo";
import { getWeatherVideoName, getWeatherVideoUrls } from "@/lib/weatherVideo";

// A city is shown after this time even if it is not completely ready (the dashboard
// then shows its own loading or error state), so a switch can never get stuck.
const PREPARE_TIMEOUT_MS = 6000;

/** Loads the weather of a city and warms the poster and the video of its weather. */
async function prepareCity(city: City): Promise<void> {
    const work = (async () => {
        try {
            const { current } = await preloadWeather(city);

            if (!current) return;

            const name = getWeatherVideoName(
                current.weatherCode,
                current.isDay,
                current.cloudCover
            );
            const urls = getWeatherVideoUrls(name);

            await Promise.all([
                preloadImage(urls.poster),
                preloadWeatherVideo(urls.page),
            ]);
        } catch {
            // The dashboard shows the error of this city.
        }
    })();

    await Promise.race([
        work,
        new Promise<void>((resolve) =>
            window.setTimeout(resolve, PREPARE_TIMEOUT_MS)
        ),
    ]);
}

/*
 * The selected city changes at once (the sidebar highlights it), but the page keeps
 * showing the previous city until the new one is ready, whoever selected it. Then the
 * data, the poster and the video change together.
 */
export function useDisplayedCity(selected: City, hydrated: boolean) {
    const [displayed, setDisplayed] = useState<City>(selected);
    const [initialized, setInitialized] = useState(false);

    // The first city (the saved one) is shown at once: the boot screen covers its loading.
    if (hydrated && !initialized) {
        setInitialized(true);
        setDisplayed(selected);
    }

    useEffect(() => {
        if (!initialized || displayed.id === selected.id) return;

        let cancelled = false;

        void prepareCity(selected).then(() => {
            if (!cancelled) setDisplayed(selected);
        });

        return () => {
            cancelled = true;
        };
    }, [initialized, displayed.id, selected]);

    return {
        city: initialized ? displayed : selected,
        pending: initialized && displayed.id !== selected.id,
    };
}