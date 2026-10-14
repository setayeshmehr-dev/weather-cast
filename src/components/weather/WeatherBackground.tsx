"use client";

import { useEffect, useState } from "react";

type WeatherBackgroundProps = {
    weatherCode: number | null;
    isDay: boolean;
    cloudCover?: number | null;
};

const weatherOptions = [
    { label: "Clear / Mainly clear", key: "clear", codes: [0, 1] },
    { label: "Partly cloudy", key: "partly-cloudy", codes: [2] },
    { label: "Mostly cloudy", key: "mostly-cloudy", codes: [] },
    { label: "Overcast", key: "overcast", codes: [3] },
    { label: "Fog", key: "fog", codes: [45, 48] },
    {
        label: "Rain",
        key: "rain",
        codes: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
    },
    { label: "Snow", key: "snow", codes: [71, 73, 77, 85] },
    { label: "Heavy snow", key: "heavy-snow", codes: [75, 86] },
    { label: "Thunderstorm", key: "thunderstorm", codes: [95, 96, 99] },
];

function getVideoFilename(
    weatherCode: number | null,
    isDay: boolean,
    cloudCover?: number | null,
): string {
    const code = weatherCode ?? -1;

    if ([45, 48].includes(code)) return "overcast-day.webm";

    if ([95, 96, 99].includes(code)) return "thunderstorm.webm";

    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
        return "rain.webm";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        if (!isDay) return "snow-night.webm";

        return [75, 86].includes(code)
            ? "heavy-snow-day.webm"
            : "snow-day.webm";
    }

    if ([0, 1].includes(code)) {
        return isDay ? "clear-day.webm" : "clear-night.webm";
    }

    if (code === 2) {
        if (cloudCover != null && cloudCover >= 60) {
            return isDay
                ? "mostly-cloudy-day.webm"
                : "mostly-cloudy-night.webm";
        }

        return isDay
            ? "partly-cloudy-day.webm"
            : "partly-cloudy-night.webm";
    }

    if (code === 3) {
        return isDay ? "overcast-day.webm" : "overcast-night.webm";
    }

    return isDay ? "overcast-day.webm" : "overcast-night.webm";
}

function getTestVideoFilename(
    weather: string,
    period: "day" | "night",
): string {
    if (weather === "fog") return "overcast-day.webm";
    if (weather === "rain") return "rain.webm";
    if (weather === "thunderstorm") return "thunderstorm.webm";

    if (weather === "snow") {
        return period === "day" ? "snow-day.webm" : "snow-night.webm";
    }

    if (weather === "heavy-snow") {
        return period === "day" ? "heavy-snow-day.webm" : "snow-night.webm";
    }

    return `${weather}-${period}.webm`;
}

export default function WeatherBackground({
    weatherCode,
    isDay,
    cloudCover,
}: WeatherBackgroundProps) {
    const [testMode, setTestMode] = useState(false);
    const [testWeather, setTestWeather] = useState("clear");
    const [testPeriod, setTestPeriod] = useState<"day" | "night">("day");
    const [loadedVideoSrc, setLoadedVideoSrc] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setTestMode(params.get("videoTest") === "1");
    }, []);

    const filename = testMode
        ? getTestVideoFilename(testWeather, testPeriod)
        : getVideoFilename(weatherCode, isDay, cloudCover);

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
                            loadedSrc === videoSrc ? null : loadedSrc,
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

const BACKGROUNDS = {
    clearDay: "linear-gradient(160deg, #3f7fd0 0%, #86b9ee 100%)",
    clearNight: "linear-gradient(160deg, #0f1633 0%, #2b3068 100%)",
    partlyDay: "linear-gradient(160deg, #5b86b8 0%, #9bb6d6 100%)",
    partlyNight: "linear-gradient(160deg, #1b2447 0%, #3a4170 100%)",
    overcastDay: "linear-gradient(160deg, #64768f 0%, #8da0b8 100%)",
    overcastNight: "linear-gradient(160deg, #2a3042 0%, #444c63 100%)",
    fog: "linear-gradient(160deg, #7b8794 0%, #a5afba 100%)",
    rainDay: "linear-gradient(160deg, #4d5d73 0%, #6f8197 100%)",
    rainNight: "linear-gradient(160deg, #252d3d 0%, #3b465a 100%)",
    snowDay: "linear-gradient(160deg, #8fa6bf 0%, #c8d6e5 100%)",
    snowNight: "linear-gradient(160deg, #3c4a63 0%, #5d6d88 100%)",
    storm: "linear-gradient(160deg, #3a3350 0%, #5b4c78 100%)",
};

export function getWeatherBackground(code: number, isDay: boolean): string {
    if (code === 0 || code === 1) {
        return isDay ? BACKGROUNDS.clearDay : BACKGROUNDS.clearNight;
    }

    if (code === 2) {
        return isDay ? BACKGROUNDS.partlyDay : BACKGROUNDS.partlyNight;
    }

    if ([45, 48].includes(code)) return BACKGROUNDS.fog;

    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
    ) {
        return isDay ? BACKGROUNDS.rainDay : BACKGROUNDS.rainNight;
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return isDay ? BACKGROUNDS.snowDay : BACKGROUNDS.snowNight;
    }

    if ([95, 96, 99].includes(code)) return BACKGROUNDS.storm;

    return isDay ? BACKGROUNDS.overcastDay : BACKGROUNDS.overcastNight;
}