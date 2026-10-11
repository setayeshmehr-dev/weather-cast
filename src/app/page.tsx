
"use client";

import AirQualityCard from "@/components/weather/AirQualityCard";
import HourlyForecast from "@/components/weather/HourlyForecast";
import HumidityCard from "@/components/weather/HumidityCard";
import MapCard from "@/components/weather/MapCard";
import TenDayForecast from "@/components/weather/TenDayForecast";
import UVIndexCard from "@/components/weather/UVIndexCard";
import VisibilityCard from "@/components/weather/VisibilityCard";
import WeatherCard from "@/components/weather/WeatherCard";
import WindCard from "@/components/weather/WindCard";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useWeather } from "@/hooks/useWeather";

const tenDayClassName =
    "col-span-2 row-span-3 min-[656px]:col-start-1 min-[656px]:row-start-1";

const mapClassName =
    "col-span-2 row-span-2 min-[656px]:col-start-3 min-[656px]:row-start-1 min-[976px]:col-start-5";

const airQualityClassName =
    "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-3 min-[976px]:row-start-1";

const windClassName =
    "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-4 min-[656px]:-my-[calc(var(--cell)_*_0.08)] min-[976px]:row-start-2";

const visibilityClassName =
    "min-[656px]:col-start-1 min-[656px]:row-start-6 min-[976px]:col-start-4 min-[976px]:row-start-4";

const humidityClassName =
    "min-[656px]:col-start-2 min-[656px]:row-start-6 min-[976px]:col-start-3 min-[976px]:row-start-4";

const uvIndexClassName =
    "min-[656px]:col-start-1 min-[656px]:row-start-5 min-[976px]:col-start-3 min-[976px]:row-start-3";

const remainingCards = [
    {
        title: "MOON PHASE",
        className:
            "col-span-2 min-[656px]:col-start-1 min-[656px]:row-start-4",
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
    const {
        airQuality,
        loading: airQualityLoading,
        error: airQualityError,
    } = useAirQuality();

    return (
        <main className="min-h-screen bg-linear-to-b from-sky-700 to-slate-900 px-4 py-6">
            <div className="@container mx-auto w-full min-[656px]:max-w-[624px] min-[976px]:max-w-[944px]">
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
                    className="grid [--cols:2] [--gap:12px] [--cell:calc((100cqw_-_var(--gap))_/_2)] min-[656px]:[--cols:4] min-[656px]:[--gap:16px] min-[656px]:[--cell:144px] min-[976px]:[--cols:6]"
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

                    <MapCard className={mapClassName} />

                    <AirQualityCard
                        airQuality={airQuality}
                        loading={airQualityLoading}
                        error={airQualityError}
                        className={airQualityClassName}
                    />

                    <WindCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={windClassName}
                    />

                    <VisibilityCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={visibilityClassName}
                    />

                    <HumidityCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={humidityClassName}
                    />

                    <UVIndexCard className={uvIndexClassName} />

                    {remainingCards.map((card) => (
                        <WeatherCard
                            key={card.title}
                            title={card.title}
                            className={card.className}
                        />
                    ))}
                </section>

                <footer className="mt-6 text-center text-xs text-white/60">
                    <p>
                        Weather data by{" "}
                        <a
                            href="https://open-meteo.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                        >
                            Open-Meteo.com
                        </a>
                    </p>
                    <p>Air quality data: CAMS ENSEMBLE via Open-Meteo</p>
                </footer>
            </div>
        </main>
    );
}
