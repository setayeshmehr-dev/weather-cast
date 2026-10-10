"use client";

import HourlyForecast from "@/components/weather/HourlyForecast";
import TenDayForecast from "@/components/weather/TenDayForecast";
import WeatherCard from "@/components/weather/WeatherCard";
import { useWeather } from "@/hooks/useWeather";

/*
 * Breakpoints (viewport):
 *  - below 656px      : 2 columns, fluid cells (mobile)
 *  - 656px and above  : 4 columns, fixed 144px cells
 *  - 976px and above  : 6 columns, fixed 144px cells
 * The order here (with the 10-day card first) is the mobile order.
 * Larger layouts place cards explicitly.
 */
const tenDayClassName =
    "col-span-2 row-span-3 min-[656px]:col-start-1 min-[656px]:row-start-1";

const weatherCards = [
    {
        title: "WEATHER MAP",
        className:
            "col-span-2 row-span-2 min-[656px]:col-start-3 min-[656px]:row-start-1 min-[976px]:col-start-5",
    },
    {
        title: "AIR QUALITY",
        className:
            "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-3 min-[976px]:row-start-1",
    },
    {
        title: "WIND",
        className:
            "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-4 min-[976px]:row-start-2",
    },
    {
        title: "MOON PHASE",
        className:
            "col-span-2 min-[656px]:col-start-1 min-[656px]:row-start-4",
    },
    {
        title: "UV INDEX",
        className:
            "min-[656px]:col-start-1 min-[656px]:row-start-5 min-[976px]:col-start-3 min-[976px]:row-start-3",
    },
    {
        title: "SUNRISE",
        className:
            "min-[656px]:col-start-2 min-[656px]:row-start-5 min-[976px]:col-start-4 min-[976px]:row-start-3",
    },
    {
        title: "FEELS LIKE",
        className:
            "min-[656px]:col-start-3 min-[656px]:row-start-5 min-[976px]:col-start-5 min-[976px]:row-start-3",
    },
    {
        title: "PRECIPITATION",
        className:
            "min-[656px]:col-start-4 min-[656px]:row-start-5 min-[976px]:col-start-6 min-[976px]:row-start-3",
    },
    {
        title: "VISIBILITY",
        className:
            "min-[656px]:col-start-1 min-[656px]:row-start-6 min-[976px]:col-start-4 min-[976px]:row-start-4",
    },
    {
        title: "HUMIDITY",
        className:
            "min-[656px]:col-start-2 min-[656px]:row-start-6 min-[976px]:col-start-3 min-[976px]:row-start-4",
    },
    {
        title: "PRESSURE",
        className:
            "min-[656px]:col-start-3 min-[656px]:row-start-6 min-[976px]:col-start-5 min-[976px]:row-start-4",
    },
    {
        title: "CLIMATE AVERAGES",
        className:
            "min-[656px]:col-start-4 min-[656px]:row-start-6 min-[976px]:col-start-6 min-[976px]:row-start-4",
    },
];

export default function Home() {
    const { current, forecast, daily, loading, error } = useWeather();

    return (
        <main className="min-h-screen bg-linear-to-b from-sky-700 to-slate-900 px-4 py-6">
            <div className="@container mx-auto w-full min-[656px]:max-w-156 min-[976px]:max-w-236">
                <section className="my-8 flex flex-col items-center justify-center text-center text-white sm:my-10">
                    <h1 className="text-[34px] leading-tight capitalize">
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
                            <p className="mt-1 text-[96px] leading-none font-extralight">
                                {Math.round(current.temperature)}°
                            </p>

                            <p className="mt-2 text-xl">
                                {current.condition}
                            </p>

                            <p className="text-xl">
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
                    className="grid [--cols:2] [--gap:12px] [--cell:calc((100cqw-var(--gap))/2)] min-[656px]:[--cols:4] min-[656px]:[--gap:16px] min-[656px]:[--cell:144px] min-[976px]:[--cols:6]"
                    style={{
                        gridTemplateColumns: "repeat(var(--cols), var(--cell))",
                        gridAutoRows: "var(--cell)",
                        gap: "var(--gap)",
                        marginTop: "var(--gap)",
                    }}
                >
                    <TenDayForecast
                        current={current}
                        daily={daily}
                        loading={loading}
                        error={error}
                        className={tenDayClassName}
                    />

                    {weatherCards.map((card) => (
                        <WeatherCard
                            key={card.title}
                            title={card.title}
                            className={card.className}
                        />
                    ))}
                </section>
            </div>
        </main>
    );
}