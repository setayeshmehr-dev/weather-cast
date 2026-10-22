"use client";

import { useEffect, useState } from "react";

import { peekWeather, preloadWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";
import { preloadImage } from "@/lib/preloadVideo";
import { getWeatherVideoName, getWeatherVideoUrls } from "@/lib/weatherVideo";

// The loading screen never stays longer than this; after it the page opens with skeletons.
const BOOT_TIMEOUT_MS = 3500;

/**
 * True when the first screen can be shown: weather saved by an earlier visit is
 * enough (it appears at once and is refreshed behind the scenes); otherwise we wait
 * for the weather and the small poster of its background (not for the video).
 */
export function useBootReady(city: City, hydrated: boolean): boolean {
    const [prepared, setPrepared] = useState(false);

    const hasWeather = hydrated && Boolean(peekWeather(city.id)?.current);

    useEffect(() => {
        if (!hydrated || prepared || hasWeather) return;

        let cancelled = false;

        const finish = () => {
            if (!cancelled) setPrepared(true);
        };

        const timer = window.setTimeout(finish, BOOT_TIMEOUT_MS);

        preloadWeather(city)
            .then(({ current }) => {
                if (!current) return;

                const name = getWeatherVideoName(
                    current.weatherCode,
                    current.isDay,
                    current.cloudCover
                );

                return preloadImage(getWeatherVideoUrls(name).poster);
            })
            .catch(() => undefined)
            .then(finish);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [hydrated, prepared, hasWeather, city]);

    return prepared || hasWeather;
}