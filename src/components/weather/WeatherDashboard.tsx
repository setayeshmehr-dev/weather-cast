"use client";

import AirQualityCard from "@/components/weather/AirQualityCard";
import AveragesCard from "@/components/weather/AveragesCard";
import FeelsLikeCard from "@/components/weather/FeelsLikeCard";
import HourlyForecast from "@/components/weather/HourlyForecast";
import HumidityCard from "@/components/weather/HumidityCard";
import MapCard from "@/components/weather/MapCard";
import MoonCard from "@/components/weather/MoonCard";
import ConditionsPopover from "@/components/weather/popover/ConditionsPopover";
import DetailTrigger from "@/components/weather/popover/DetailTrigger";
import PressurePopover from "@/components/weather/popover/PressurePopover";
import UvPopover from "@/components/weather/popover/UvPopover";
import VisibilityPopover from "@/components/weather/popover/VisibilityPopover";
import PrecipitationCard from "@/components/weather/PrecipitationCard";
import PressureCard from "@/components/weather/PressureCard";
import SunriseCard from "@/components/weather/SunriseCard";
import TenDayForecast from "@/components/weather/TenDayForecast";
import UVIndexCard from "@/components/weather/UVIndexCard";
import VisibilityCard from "@/components/weather/VisibilityCard";
import WeatherBackground from "@/components/weather/WeatherBackground";
import { WeatherLoadingContext } from "@/components/weather/WeatherLoadingContext";
import WindCard from "@/components/weather/WindCard";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useClimateAverage } from "@/hooks/useClimateAverage";
import { useWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";

/*
 * Layout breakpoints are container queries on the width of the content column
 * (so they keep working when the sidebar takes space):
 *  - the column is capped at 624px from 624px of available width, and at 944px
 *    from 944px (the <main> container);
 *  - inside the column: below 624px = 2 columns (fluid cells, mobile),
 *    624px = 4 columns, 944px = 6 columns (fixed 144px cells).
 * The render order in the grid below is the mobile order (auto placement),
 * so keep it as is: wide cards first, then the small cards in pairs.
 * Larger layouts place every card explicitly.
 * Cards with a detail popover are wrapped in a DetailTrigger, which carries
 * the grid placement classes.
 */
const tenDayClassName =
    "col-span-2 row-span-3 @min-[624px]:col-start-1 @min-[624px]:row-start-1";

const mapClassName =
    "col-span-2 row-span-2 @min-[624px]:col-start-3 @min-[624px]:row-start-1 @min-[944px]:col-start-5";

const airQualityClassName =
    "col-span-2 @min-[624px]:col-start-3 @min-[624px]:row-start-3 @min-[944px]:row-start-1";

const windClassName =
    "col-span-2 @min-[624px]:col-start-3 @min-[624px]:row-start-4 @min-[624px]:-my-[calc(var(--cell)_*_0.08)] @min-[944px]:row-start-2";

const moonClassName =
    "col-span-2 @min-[624px]:col-start-1 @min-[624px]:row-start-4";

const uvIndexClassName =
    "@min-[624px]:col-start-1 @min-[624px]:row-start-5 @min-[944px]:col-start-3 @min-[944px]:row-start-3";

const sunriseClassName =
    "@min-[624px]:col-start-2 @min-[624px]:row-start-5 @min-[944px]:col-start-4 @min-[944px]:row-start-3";

const feelsLikeClassName =
    "@min-[624px]:col-start-3 @min-[624px]:row-start-5 @min-[944px]:col-start-5 @min-[944px]:row-start-3";

const precipitationClassName =
    "@min-[624px]:col-start-4 @min-[624px]:row-start-5 @min-[944px]:col-start-6 @min-[944px]:row-start-3";

const visibilityClassName =
    "@min-[624px]:col-start-1 @min-[624px]:row-start-6 @min-[944px]:col-start-4 @min-[944px]:row-start-4";

const humidityClassName =
    "@min-[624px]:col-start-2 @min-[624px]:row-start-6 @min-[944px]:col-start-3 @min-[944px]:row-start-4";

const pressureClassName =
    "@min-[624px]:col-start-3 @min-[624px]:row-start-6 @min-[944px]:col-start-5 @min-[944px]:row-start-4";

const averagesClassName =
    "@min-[624px]:col-start-4 @min-[624px]:row-start-6 @min-[944px]:col-start-6 @min-[944px]:row-start-4";

// Date of the clicked 10-day row (rows carry data-date), if any.
function clickedDate(target: HTMLElement): string | undefined {
    return target.closest<HTMLElement>("[data-date]")?.dataset.date;
}

type WeatherDashboardProps = {
    city: City;
};

export default function WeatherDashboard({ city }: WeatherDashboardProps) {
    const { current, forecast, daily, details, loading, error } = useWeather(city);
    const {
        airQuality,
        loading: airQualityLoading,
        error: airQualityError,
    } = useAirQuality(city);
    const todayDate = daily[0]?.date ?? null;
    const {
        average: climateAverage,
        loading: climateLoading,
        error: climateError,
    } = useClimateAverage(todayDate, city);

    // The detail popovers need the whole data set.
    const popoverReady = details !== null && current !== null && todayDate !== null;

    return (
        <WeatherLoadingContext.Provider value={loading}>
            <WeatherBackground
                weatherCode={current?.weatherCode ?? null}
                isDay={current?.isDay ?? true}
                cloudCover={current?.cloudCover ?? null}
            />

            <main className="@container relative z-10 px-4 py-6">
                <div className="@container mx-auto w-full @min-[624px]:max-w-156 @min-[944px]:max-w-236">
                    <section className="my-8 flex flex-col items-center justify-center text-center text-white sm:my-10">
                        <h1 className="text-[34px] leading-tight">
                            {city.name}
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

                    <DetailTrigger
                        label="Show hourly conditions"
                        disabled={!popoverReady}
                        popover={({ anchor, close }) =>
                            details && current && todayDate ? (
                                <ConditionsPopover
                                    anchor={anchor}
                                    onClose={close}
                                    details={details}
                                    current={current}
                                    initialDate={todayDate}
                                />
                            ) : null
                        }
                    >
                        <HourlyForecast
                            current={current}
                            forecast={forecast}
                            loading={loading}
                            error={error}
                        />
                    </DetailTrigger>

                    <section
                        aria-label="Weather details"
                        className="grid [--cols:2] [--gap:12px] [--cell:calc((100cqw-var(--gap))/2)] @min-[624px]:[--cols:4] @min-[624px]:[--gap:16px] @min-[624px]:[--cell:144px] @min-[944px]:[--cols:6]"
                        style={{
                            gridTemplateColumns: "repeat(var(--cols), var(--cell))",
                            gridAutoRows: "var(--cell)",
                            gap: "var(--gap)",
                            marginTop: "var(--gap)",
                        }}
                    >
                        <DetailTrigger
                            label="Show conditions for a day"
                            disabled={!popoverReady}
                            className={tenDayClassName}
                            popover={({ anchor, target, close }) =>
                                details && current && todayDate ? (
                                    <ConditionsPopover
                                        anchor={anchor}
                                        onClose={close}
                                        details={details}
                                        current={current}
                                        initialDate={clickedDate(target) ?? todayDate}
                                    />
                                ) : null
                            }
                        >
                            <TenDayForecast
                                current={current}
                                daily={daily}
                                loading={loading}
                                error={error}
                            />
                        </DetailTrigger>

                        <MapCard
                            city={city}
                            current={current}
                            className={mapClassName}
                        />

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
                            date={todayDate}
                            latitude={city.latitude}
                            longitude={city.longitude}
                            loading={loading}
                            error={error}
                            className={moonClassName}
                        />

                        <DetailTrigger
                            label="Show UV index details"
                            disabled={!popoverReady}
                            className={uvIndexClassName}
                            popover={({ anchor, close }) =>
                                details && current && todayDate ? (
                                    <UvPopover
                                        anchor={anchor}
                                        onClose={close}
                                        details={details}
                                        current={current}
                                        initialDate={todayDate}
                                    />
                                ) : null
                            }
                        >
                            <UVIndexCard
                                current={current}
                                loading={loading}
                                error={error}
                            />
                        </DetailTrigger>

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

                        <DetailTrigger
                            label="Show visibility details"
                            disabled={!popoverReady}
                            className={visibilityClassName}
                            popover={({ anchor, close }) =>
                                details && current && todayDate ? (
                                    <VisibilityPopover
                                        anchor={anchor}
                                        onClose={close}
                                        details={details}
                                        current={current}
                                        initialDate={todayDate}
                                    />
                                ) : null
                            }
                        >
                            <VisibilityCard
                                current={current}
                                loading={loading}
                                error={error}
                            />
                        </DetailTrigger>

                        <HumidityCard
                            current={current}
                            loading={loading}
                            error={error}
                            className={humidityClassName}
                        />

                        <DetailTrigger
                            label="Show pressure details"
                            disabled={!popoverReady}
                            className={pressureClassName}
                            popover={({ anchor, close }) =>
                                details && current && todayDate ? (
                                    <PressurePopover
                                        anchor={anchor}
                                        onClose={close}
                                        details={details}
                                        current={current}
                                        initialDate={todayDate}
                                    />
                                ) : null
                            }
                        >
                            <PressureCard
                                current={current}
                                loading={loading}
                                error={error}
                            />
                        </DetailTrigger>

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
                        <p>Location search: GeoNames via Open-Meteo</p>
                    </footer>
                </div>
            </main>
        </WeatherLoadingContext.Provider>
    );
}