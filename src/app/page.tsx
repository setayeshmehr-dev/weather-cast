
"use client";

import HourlyForecast from "@/components/weather/HourlyForecast";
import WeatherCard from "@/components/weather/WeatherCard";
import { useWeather } from "@/hooks/useWeather";

const weatherCards = [
    { title: "WIND" },
    { title: "UV INDEX" },
    { title: "HUMIDITY" },
    { title: "PRESSURE" },
    { title: "VISIBILITY" },
    { title: "PRECIPITATION" },
    { title: "FEELS LIKE" },
    { title: "AIR QUALITY" },
    { title: "MOON PHASE" },
    {
        title: "CLIMATE AVERAGES",
        className: "sm:col-span-2 lg:col-span-1",
    },
    {
        title: "WEATHER MAP",
        className: "sm:col-span-2 lg:col-span-2",
        bodyClassName: "min-h-56 sm:min-h-64",
    },
];

export default function Home() {
    const { current, forecast, loading, error } = useWeather();

    return (
        <main className="min-h-screen bg-linear-to-b from-sky-700 to-slate-900 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <section className="my-8 flex flex-col items-center justify-center text-center text-white sm:my-10">
                    <h1 className="text-2xl font-medium capitalize sm:text-3xl">
                        Tehran
                    </h1>

                    {loading && (
                        <p className="mt-4 text-white/70">
                            Loading weather...
                        </p>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 text-white/80">
                            {error}
                        </p>
                    )}

                    {!loading && !error && current && (
                        <>
                            <p className="mt-2 text-6xl font-light sm:text-7xl">
                                {Math.round(current.temperature)}°
                            </p>

                            <p className="mt-2 text-base">
                                {current.condition}
                            </p>

                            <p className="mt-1 text-sm text-white/80">
                                H:{Math.round(current.max)}° L:{Math.round(current.min)}°
                            </p>
                        </>
                    )}
                </section>

                <HourlyForecast
                    current={current}
                    forecast={forecast}
                    loading={loading}
                    error={error}
                />

                <section
                    aria-label="Weather details"
                    className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 "
                >
                    {weatherCards.map((card) => (
                        <WeatherCard
                            key={card.title}
                            title={card.title}
                            className={card.className}
                            bodyClassName={card.bodyClassName}
                        />
                    ))}
                </section>
            </div>
        </main>
    );
}
