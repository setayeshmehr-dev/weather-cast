
"use client";

import WeatherCard from "@/components/weather/WeatherCard";
import WeatherIcon from "@/components/weather/WeatherIcon";
import type { CurrentWeather, ForecastItem } from "@/hooks/useWeather";
import { getWeatherIcon } from "@/hooks/useWeather";
import { useFormat } from "@/hooks/useFormat";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import ScrollArrow from "@/components/weather/ScrollArrow";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

// The arrows stay this long after the pointer leaves, so a short detour does not hide them.
const HIDE_DELAY_MS = 450;

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

    const fmt = useFormat();

        const { scrollerRef, edges, scrollByPage } =
        useHorizontalScroll<HTMLDivElement>();

    const [hovered, setHovered] = useState(false);
    const hideTimer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(hideTimer.current), []);

    // Touch screens scroll with the finger: no arrows there.
    const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "touch") return;

        window.clearTimeout(hideTimer.current);
        setHovered(true);
    };

    const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "touch") return;

        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(
            () => setHovered(false),
            HIDE_DELAY_MS
        );
    };

    return (
                <WeatherCard
            title="HOURLY FORECAST"
            divided
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            overlay={
                <>
                    <ScrollArrow
                        side="left"
                        visible={hovered && edges.left}
                        top={edges.center}
                        onClick={() => scrollByPage(-1)}
                    />
                    <ScrollArrow
                        side="right"
                        visible={hovered && edges.right}
                        top={edges.center}
                        onClick={() => scrollByPage(1)}
                    />
                </>
            }
        >
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
                <div ref={scrollerRef} className="scrollbar-hide flex snap-x snap-mandatory gap-1 overflow-x-auto pb-2">
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
                                {fmt.temperature(current.temperature)}°
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

                                <WeatherIcon slug={slug} label={label} />

                                <span className="text-lg font-medium">
                                    {isHour
                                        ? `${fmt.temperature(item.temperature)}°`
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
