
"use client";

import HourlyForecast from "@/components/weather/HourlyForecast";
import { useWeather } from "@/hooks/useWeather";

export default function Home() {
    const { current, forecast, loading, error } = useWeather();

    return (
        <main className="min-h-screen bg-linear-to-b from-sky-700 to-slate-900 p-6">
            <section className="my-10 flex flex-col items-center justify-center text-white">
                <h1 className="text-3xl capitalize">Tehran</h1>

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
                        <p className="mt-2 text-6xl font-light">
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
        </main>
    );
}
