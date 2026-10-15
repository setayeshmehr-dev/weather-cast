import WeatherCard from "@/components/weather/WeatherCard";
import WeatherIcon from "@/components/weather/WeatherIcon";
import type { CurrentWeather, DailyItem } from "@/hooks/useWeather";
import { getWeatherIcon } from "@/hooks/useWeather";
import { temperatureColor } from "@/lib/temperatureColor";

// Rain chance (%) from which the blue percentage label is shown.
const MIN_CHANCE_TO_SHOW = 20;
function rangeGradient(min: number, max: number): string {
    const steps = 4;
    const colors = Array.from({ length: steps + 1 }, (_, i) =>
        temperatureColor(min + ((max - min) * i) / steps)
    );

    return `linear-gradient(to right, ${colors.join(", ")})`;
}

function formatDay(date: string, index: number): string {
    if (index === 0) return "Today";

    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
    });
}

type TenDayForecastProps = {
    current: CurrentWeather | null;
    daily: DailyItem[];
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function TenDayForecast({
    current,
    daily,
    loading,
    error,
    className,
}: TenDayForecastProps) {
    const weekMin = Math.min(...daily.map((day) => day.min));
    const weekMax = Math.max(...daily.map((day) => day.max));
    const span = weekMax - weekMin || 1;

    const position = (value: number) => ((value - weekMin) / span) * 100;

    return (
        <WeatherCard
            title="10-DAY FORECAST"
            divided
            flush
            skeleton="rows"
            className={className}
            bodyClassName="flex flex-col"
        >
            {loading && (
                <p className="py-4 text-sm text-white/70">
                    Loading forecast...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="py-4 text-sm text-white/80"
                >
                    {error}
                </p>
            )}

            {!loading && !error && (
                <ul className="flex min-h-0 flex-1 flex-col">
                    {daily.map((day, index) => {
                        const left = position(day.min);
                        const width = position(day.max) - left;

                        const dot =
                            index === 0 && current
                                ? position(
                                    Math.min(
                                        Math.max(current.temperature, day.min),
                                        day.max
                                    )
                                )
                                : null;

                        const isDay = index === 0 ? (current?.isDay ?? true) : true;
                        const showChance = day.precipitationChance >= MIN_CHANCE_TO_SHOW;

                        return (
                            <li
                                key={day.date}
                                data-popover-anchor
                                data-date={day.date}
                                className="grid flex-1 grid-cols-[56px_28px_38px_minmax(0,1fr)_28px] items-center gap-x-2 border-t border-white/15 text-base"
                            >
                                <span className="font-medium">
                                    {formatDay(day.date, index)}
                                </span>

                                <div className="flex flex-col items-center">
                                    <WeatherIcon
                                        slug={getWeatherIcon(day.weatherCode, isDay)}
                                        label="Daily weather"
                                        size={26}
                                    />

                                    {showChance && (
                                        <span className="-mt-1 text-[11px] leading-none font-semibold text-sky-400">
                                            {Math.round(day.precipitationChance)}%
                                        </span>
                                    )}
                                </div>

                                <span className="text-right font-medium text-white/40">
                                    {Math.round(day.min)}°
                                </span>

                                <div className="relative h-1 rounded-full bg-black/25">
                                    <div
                                        className="absolute inset-y-0 min-w-1 rounded-full"
                                        style={{
                                            left: `${left}%`,
                                            width: `${width}%`,
                                            backgroundImage: rangeGradient(day.min, day.max),
                                        }}
                                    />

                                    {dot !== null && (
                                        <span
                                            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                                            style={{ left: `${dot}%` }}
                                        />
                                    )}
                                </div>

                                <span className="text-right font-semibold">
                                    {Math.round(day.max)}°
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </WeatherCard>
    );
}