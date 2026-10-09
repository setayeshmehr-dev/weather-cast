
"use client";

import { useEffect, useState } from "react";
import type { CurrentWeather, ForecastItem } from "@/hooks/useWeather";
import { getWeatherIcon } from "@/hooks/useWeather";

function formatTime(time: string): string {
    return time.slice(11, 16);
}

function WeatherIcon({ slug, label }: { slug: string; label: string }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setSrc(null);

        import(`@meteocons/svg/fill/${slug}.svg`)
            .then((module) => {
                if (active) setSrc(module.default);
            })
            .catch(() => {
                import("@meteocons/svg/fill/overcast.svg")
                    .then((module) => {
                        if (active) setSrc(module.default);
                    })
                    .catch(() => {
                        if (active) setSrc(null);
                    });
            });

        return () => {
            active = false;
        };
    }, [slug]);

    if (!src) {
        return <span className="size-10 shrink-0" aria-hidden="true" />;
    }

    return (
        <img
            src={src}
            alt={label}
            width={40}
            height={40}
            className="size-10 shrink-0"
        />
    );
}

export default function HourlyForecast({
    current,
    forecast,
    loading,
    error,
}: {
    current: CurrentWeather | null;
    forecast: ForecastItem[];
    loading: boolean;
    error: string | null;
}) {
    return (
        <section
            aria-labelledby="hourly-forecast-title"
            className="w-full overflow-hidden rounded-2xl border border-white/20 bg-black/10 p-4 text-white backdrop-blur-lg"
        >
            <h2
                id="hourly-forecast-title"
                className="mb-4 text-sm font-medium tracking-wide text-white/60"
            >
                HOURLY FORECAST
            </h2>

            {loading && (
                <p className="py-4 text-sm text-white/70">
                    Loading forecast...
                </p>
            )}

            {error && (
                <p role="alert" className="py-4 text-sm text-white/80">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="scrollbar-hide flex gap-5 overflow-x-auto pb-2">
                    {current && (
                        <div className="flex min-w-12 shrink-0 flex-col items-center gap-3">
                            <span className="text-sm text-white/80">Now</span>

                            <WeatherIcon
                                slug={getWeatherIcon(
                                    current.weatherCode,
                                    current.isDay
                                )}
                                label="Current weather"
                            />

                            <span className="text-lg font-medium">
                                {Math.round(current.temperature)}°
                            </span>
                        </div>
                    )}

                    {forecast.map((item) => {
                        const isHour = item.kind === "hour";

                        const slug = isHour
                            ? getWeatherIcon(item.weatherCode, item.isDay)
                            : item.kind;

                        const label = isHour
                            ? "Hourly weather"
                            : item.kind === "sunrise"
                              ? "Sunrise"
                              : "Sunset";

                        return (
                            <div
                                key={`${item.kind}-${item.time}`}
                                className="flex min-w-12 shrink-0 flex-col items-center gap-3"
                            >
                                <span className="text-sm text-white/80">
                                    {formatTime(item.time)}
                                </span>

                                <WeatherIcon slug={slug} label={label} />

                                <span className="text-lg font-medium">
                                    {isHour
                                        ? `${Math.round(item.temperature)}°`
                                        : label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
