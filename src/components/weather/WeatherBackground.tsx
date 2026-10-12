
"use client";

import { useEffect, useState } from "react";

type WeatherBackgroundProps = {
    weatherCode: number | null;
    isDay: boolean;
};

const weatherOptions = [
    { label: "Clear", key: "clear", codes: [0] },
    { label: "Mainly clear", key: "mainly-clear", codes: [1] },
    { label: "Partly cloudy", key: "partly-cloudy", codes: [2] },
    { label: "Overcast", key: "overcast", codes: [3] },
    { label: "Fog", key: "fog", codes: [45, 48] },
    { label: "Drizzle", key: "drizzle", codes: [51, 53, 55] },
    { label: "Freezing drizzle", key: "freezing-drizzle", codes: [56, 57] },
    { label: "Rain", key: "rain", codes: [61, 63, 65] },
    { label: "Freezing rain", key: "freezing-rain", codes: [66, 67] },
    { label: "Snow", key: "snow", codes: [71, 73, 75] },
    { label: "Snow grains", key: "snow-grains", codes: [77] },
    { label: "Rain showers", key: "rain-showers", codes: [80, 81, 82] },
    { label: "Snow showers", key: "snow-showers", codes: [85, 86] },
    { label: "Thunderstorm", key: "thunderstorm", codes: [95, 96, 99] },
];

const specialOptions = [
    { label: "Sunrise · Clear", filename: "sunrise-clear.webm" },
    { label: "Sunrise · Cloudy", filename: "sunrise-cloudy.webm" },
    { label: "Sunrise · Fog", filename: "sunrise-fog.webm" },
    { label: "Sunrise · Rain", filename: "sunrise-rain.webm" },
    { label: "Sunset · Clear", filename: "sunset-clear.webm" },
    { label: "Sunset · Cloudy", filename: "sunset-cloudy.webm" },
    { label: "Sunset · Fog", filename: "sunset-fog.webm" },
    { label: "Sunset · Rain", filename: "sunset-rain.webm" },
    { label: "Blue hour", filename: "blue-hour.webm" },
];

export default function WeatherBackground({
    weatherCode,
    isDay,
}: WeatherBackgroundProps) {
    const [testMode, setTestMode] = useState(false);
    const [testWeather, setTestWeather] = useState("clear");
    const [testPeriod, setTestPeriod] = useState<"day" | "night">("day");
    const [testSpecial, setTestSpecial] = useState("");
    const [loadedVideoSrc, setLoadedVideoSrc] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setTestMode(params.get("videoTest") === "1");
    }, []);

    const selectedWeather = weatherOptions.find((option) =>
        option.codes.includes(weatherCode ?? -1)
    );

    const weatherKey = testMode
        ? testWeather
        : selectedWeather?.key ?? "overcast";

    const period = testMode ? testPeriod : isDay ? "day" : "night";

    const filename = testMode && testSpecial
        ? testSpecial
        : `${weatherKey}-${period}.webm`;

    const videoSrc = `/videos/${filename}`;
    const videoAvailable = loadedVideoSrc === videoSrc;

    return (
        <>
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-linear-to-b from-sky-700 to-slate-900">
                <video
                    key={videoSrc}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                        videoAvailable ? "opacity-100" : "opacity-0"
                    }`}
                    src={videoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onCanPlay={() => setLoadedVideoSrc(videoSrc)}
                    onError={() =>
                        setLoadedVideoSrc((loadedSrc) =>
                            loadedSrc === videoSrc ? null : loadedSrc
                        )
                    }
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
                            onChange={(event) => {
                                setTestWeather(event.target.value);
                                setTestSpecial("");
                            }}
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
                            onChange={(event) => {
                                setTestPeriod(event.target.value as "day" | "night");
                                setTestSpecial("");
                            }}
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

                    <label className="flex flex-col gap-1">
                        Sunrise, sunset and other scenes
                        <select
                            value={testSpecial}
                            onChange={(event) => setTestSpecial(event.target.value)}
                            className="rounded-md bg-white/10 p-2 outline-none"
                        >
                            <option value="" className="bg-slate-900">
                                Use selected weather
                            </option>
                            {specialOptions.map((option) => (
                                <option
                                    key={option.filename}
                                    value={option.filename}
                                    className="bg-slate-900"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <p className="break-all text-xs text-white/70">
                        File: public/videos/{filename}
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
