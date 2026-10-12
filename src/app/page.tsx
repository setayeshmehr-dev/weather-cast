"use client";

import AirQualityCard from "@/components/weather/AirQualityCard";
import AveragesCard from "@/components/weather/AveragesCard";
import FeelsLikeCard from "@/components/weather/FeelsLikeCard";
import HourlyForecast from "@/components/weather/HourlyForecast";
import HumidityCard from "@/components/weather/HumidityCard";
import MapCard from "@/components/weather/MapCard";
import MoonCard from "@/components/weather/MoonCard";
import PrecipitationCard from "@/components/weather/PrecipitationCard";
import PressureCard from "@/components/weather/PressureCard";
import TenDayForecast from "@/components/weather/TenDayForecast";
import UVIndexCard from "@/components/weather/UVIndexCard";
import VisibilityCard from "@/components/weather/VisibilityCard";
import WeatherCard from "@/components/weather/WeatherCard";
import WindCard from "@/components/weather/WindCard";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useClimateAverage } from "@/hooks/useClimateAverage";
import { useWeather } from "@/hooks/useWeather";
import SunriseCard from "@/components/weather/SunriseCard";
import WeatherBackground from "@/components/weather/WeatherBackground";

/*
 * Breakpoints (viewport):
 *  - below 656px      : 2 columns, fluid cells (mobile)
 *  - 656px and above  : 4 columns, fixed 144px cells
 *  - 976px and above  : 6 columns, fixed 144px cells
 * The render order in the grid below is the mobile order (auto placement),
 * so keep it as is: wide cards first, then the small cards in pairs.
 * Larger layouts place every card explicitly.
 */
const tenDayClassName =
    "col-span-2 row-span-3 min-[656px]:col-start-1 min-[656px]:row-start-1";

const mapClassName =
    "col-span-2 row-span-2 min-[656px]:col-start-3 min-[656px]:row-start-1 min-[976px]:col-start-5";

const airQualityClassName =
    "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-3 min-[976px]:row-start-1";

const windClassName =
    "col-span-2 min-[656px]:col-start-3 min-[656px]:row-start-4 min-[656px]:-my-[calc(var(--cell)_*_0.08)] min-[976px]:row-start-2";

const moonClassName =
    "col-span-2 min-[656px]:col-start-1 min-[656px]:row-start-4";

const uvIndexClassName =
    "min-[656px]:col-start-1 min-[656px]:row-start-5 min-[976px]:col-start-3 min-[976px]:row-start-3";

const sunriseClassName =
    "min-[656px]:col-start-2 min-[656px]:row-start-5 min-[976px]:col-start-4 min-[976px]:row-start-3";

const feelsLikeClassName =
    "min-[656px]:col-start-3 min-[656px]:row-start-5 min-[976px]:col-start-5 min-[976px]:row-start-3";

const precipitationClassName =
    "min-[656px]:col-start-4 min-[656px]:row-start-5 min-[976px]:col-start-6 min-[976px]:row-start-3";

const visibilityClassName =
    "min-[656px]:col-start-1 min-[656px]:row-start-6 min-[976px]:col-start-4 min-[976px]:row-start-4";

const humidityClassName =
    "min-[656px]:col-start-2 min-[656px]:row-start-6 min-[976px]:col-start-3 min-[976px]:row-start-4";

const pressureClassName =
    "min-[656px]:col-start-3 min-[656px]:row-start-6 min-[976px]:col-start-5 min-[976px]:row-start-4";

const averagesClassName =
    "min-[656px]:col-start-4 min-[656px]:row-start-6 min-[976px]:col-start-6 min-[976px]:row-start-4";

export default function Home() {
    const { current, forecast, daily, loading, error } = useWeather();
    const {
        airQuality,
        loading: airQualityLoading,
        error: airQualityError,
    } = useAirQuality();
    const {
        average: climateAverage,
        loading: climateLoading,
        error: climateError,
    } = useClimateAverage(daily[0]?.date ?? null);

    return (

        <main className="relative isolate min-h-screen bg-linear-to-b from-sky-700 to-slate-900 px-4 py-6">
            <WeatherBackground
                weatherCode={current?.weatherCode ?? null}
                isDay={current?.isDay ?? true}
            />
            <div className="@container relative z-10 mx-auto w-full min-[656px]:max-w-156 min-[976px]:max-w-236">
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

                    <MapCard current={current} className={mapClassName} />

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

                    <MoonCard
                        current={current}
                        date={daily[0]?.date ?? null}
                        loading={loading}
                        error={error}
                        className={moonClassName}
                    />

                    <UVIndexCard className={uvIndexClassName} />
                    
                    <SunriseCard
                        current={current}
                        forecast={forecast}
                        loading={loading}
                        error={error}
                        className={sunriseClassName}
                    />

                    <FeelsLikeCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={feelsLikeClassName}
                    />

                    <PrecipitationCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={precipitationClassName}
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

                    <PressureCard
                        current={current}
                        loading={loading}
                        error={error}
                        className={pressureClassName}
                    />

                    <AveragesCard
                        today={current?.max ?? null}
                        average={climateAverage}
                        loading={loading || climateLoading}
                        error={error ?? climateError}
                        className={averagesClassName}
                    />
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
                    <p>Climate averages: ERA5 reanalysis via Open-Meteo</p>
                </footer>
            </div>
        </main>
    );
}