"use client";

import WeatherCard from "@/components/weather/WeatherCard";
import WeatherIcon from "@/components/weather/WeatherIcon";
import type { CurrentWeather, ForecastItem } from "@/hooks/useWeather";
import { getWeatherIcon } from "@/hooks/useWeather";

function formatTime(time: string): string {
    return time.slice(11, 16);
}

type HourlyForecastProps = {
    current: CurrentWeather | null;
    forecast: ForecastItem[];
    loading: boolean;
    error: string | null;
};

export default function HourlyForecast({
    current,
    forecast,
    loading,
    error,
}: HourlyForecastProps) {
    return (
        <WeatherCard
            title="HOURLY FORECAST"
            divided
        >
            {loading && (
                <p className="py-4 text-sm text-white/70">
                    Loading forecast...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="py-4 text-sm text-white/80"
                >
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="scrollbar-hide flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth pb-2">
                    {current && (
                        <div className="flex w-14 shrink-0 snap-start flex-col items-center gap-3">
                            <span className="whitespace-nowrap text-sm text-white/80">
                                Now
                            </span>

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
                                className="flex w-14 shrink-0 snap-start flex-col items-center gap-3"
                            >
                                <span className="whitespace-nowrap text-sm text-white/80">
                                    {formatTime(item.time)}
                                </span>

                                <WeatherIcon
                                    slug={slug}
                                    label={label}
                                />

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
        </WeatherCard>
    );
}