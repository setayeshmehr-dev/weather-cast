"use client";

import { useState, useSyncExternalStore } from "react";

import WeatherVideo from "@/components/weather/WeatherVideo";
import { getWeatherVideoName, getWeatherVideoUrls } from "@/lib/weatherVideo";

type WeatherBackgroundProps = {
    weatherCode: number | null;
    isDay: boolean;
    cloudCover?: number | null;
};

const weatherOptions = [
    { label: "Clear / Mainly clear", key: "clear" },
    { label: "Partly cloudy", key: "partly-cloudy" },
    { label: "Mostly cloudy", key: "mostly-cloudy" },
    { label: "Overcast", key: "overcast" },
    { label: "Fog", key: "fog" },
    { label: "Rain", key: "rain" },
    { label: "Snow", key: "snow" },
    { label: "Heavy snow", key: "heavy-snow" },
    { label: "Thunderstorm", key: "thunderstorm" },
];

function getTestVideoName(weather: string, period: "day" | "night"): string {
    if (weather === "fog") return `overcast-${period}`;
    if (weather === "rain") return "rain";
    if (weather === "thunderstorm") return "thunderstorm";

    if (weather === "snow") {
        return period === "day" ? "snow-day" : "snow-night";
    }

    if (weather === "heavy-snow") {
        return period === "day" ? "heavy-snow-day" : "snow-night";
    }

    return `${weather}-${period}`;
}

// The test panel is enabled with ?videoTest=1 in the URL.
const subscribeNothing = () => () => undefined;
const getTestMode = () =>
    new URLSearchParams(window.location.search).get("videoTest") === "1";
const getServerTestMode = () => false;

export default function WeatherBackground({
    weatherCode,
    isDay,
    cloudCover,
}: WeatherBackgroundProps) {
    const testMode = useSyncExternalStore(
        subscribeNothing,
        getTestMode,
        getServerTestMode,
    );
    const [testWeather, setTestWeather] = useState("clear");
    const [testPeriod, setTestPeriod] = useState<"day" | "night">("day");
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

    const name = testMode
        ? getTestVideoName(testWeather, testPeriod)
        : getWeatherVideoName(weatherCode, isDay, cloudCover);

    const videoSrc = getWeatherVideoUrls(name).page;
    const videoAvailable = loadedSrc === videoSrc;

    return (
        <>
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-linear-to-b from-sky-700 to-slate-900">
                <WeatherVideo
                    name={name}
                    variant="page"
                    className="absolute inset-0"
                    onLoadedChange={setLoadedSrc}
                />

                <div className="absolute inset-0 bg-slate-950/35" />
            </div>

            {testMode && (
                <div className="fixed right-3 bottom-3 z-50 flex max-h-[80vh] w-72 flex-col gap-3 overflow-y-auto rounded-xl border border-white/20 bg-slate-950/90 p-4 text-sm text-white shadow-xl backdrop-blur-xl">
                    <h2 className="font-semibold">Background video tester</h2>

                    <label className="flex flex-col gap-1">
                        Weather condition
                        <select
                            value={testWeather}
                            onChange={(event) =>
                                setTestWeather(event.target.value)
                            }
                            className="rounded-md bg-white/10 p-2 outline-none"
                        >
                            {weatherOptions.map((option) => (
                                <option
                                    key={option.key}
                                    value={option.key}
                                    className="bg-slate-900"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        Time of day
                        <select
                            value={testPeriod}
                            onChange={(event) =>
                                setTestPeriod(
                                    event.target.value as "day" | "night",
                                )
                            }
                            className="rounded-md bg-white/10 p-2 outline-none"
                        >
                            <option value="day" className="bg-slate-900">
                                Day
                            </option>
                            <option value="night" className="bg-slate-900">
                                Night
                            </option>
                        </select>
                    </label>

                    <p className="text-xs break-all text-white/70">
                        File: public{videoSrc}
                    </p>

                    <p
                        className={
                            videoAvailable
                                ? "text-emerald-300"
                                : "text-amber-300"
                        }
                    >
                        {videoAvailable
                            ? "Video loaded"
                            : "Video missing or loading"}
                    </p>
                </div>
            )}
        </>
    );
}