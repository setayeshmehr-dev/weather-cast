import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";

// Heuristics for the explanation text (the API does not say why it feels different).
const WIND_THRESHOLD = 10; // km/h
const HUMIDITY_THRESHOLD = 60; // %

function describe(difference: number, current: CurrentWeather): string {
    if (difference <= -1) {
        return current.windSpeed >= WIND_THRESHOLD
            ? "Wind is making it feel cooler."
            : "It feels cooler than the actual temperature.";
    }

    if (difference >= 1) {
        return current.relativeHumidity !== null &&
            current.relativeHumidity >= HUMIDITY_THRESHOLD
            ? "Humidity is making it feel warmer."
            : "It feels warmer than the actual temperature.";
    }

    return "Similar to the actual temperature.";
}

type FeelsLikeCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function FeelsLikeCard({
    current,
    loading,
    error,
    className,
}: FeelsLikeCardProps) {
    const actual = current ? Math.round(current.temperature) : 0;
    const feelsLike = current ? Math.round(current.feelsLike) : 0;
    const difference = feelsLike - actual;

    // The track shows a window of 2.4x the difference (at least 6°).
    // Cooler: actual temperature on the right end; warmer: on the left end.
    const window = Math.max(Math.abs(difference) * 2.4, 6);
    const offset = (Math.abs(difference) / window) * 100;
    const tickPosition = difference > 0 ? 0 : difference < 0 ? 100 : 50;
    const pillPosition =
        difference > 0 ? offset : difference < 0 ? 100 - offset : 50;

    return (
        <WeatherCard
            title="FEELS LIKE"
            className={className}
            bodyClassName="flex flex-col justify-between"
        >
            {loading && (
                <p className="text-xs text-white/70">
                    Loading...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="text-xs text-white/80"
                >
                    {error}
                </p>
            )}

            {!loading && !error && current && (
                <>
                    <div>
                        <p className="text-[28px] leading-none">
                            {feelsLike}°
                        </p>
                        <p className="mt-1 text-xs font-semibold text-white/80">
                            Actual: {actual}°
                        </p>
                    </div>

                    <div className="relative h-3.5">
                        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/25" />

                        {difference !== 0 && (
                            <>
                                <div
                                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#6fcfc8]"
                                    style={{
                                        left: `${Math.min(pillPosition, tickPosition)}%`,
                                        width: `${Math.abs(pillPosition - tickPosition)}%`,
                                    }}
                                />

                                <div
                                    className="absolute top-1/2 flex h-3.5 -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-[#6fcfc8] px-1.5 text-[10px] leading-none font-bold text-white"
                                    style={{ left: `${pillPosition}%` }}
                                >
                                    {difference < 0 ? "↓" : "↑"}
                                    {Math.abs(difference)}°
                                </div>
                            </>
                        )}

                        <div
                            className="absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                            style={{ left: `${tickPosition}%` }}
                        />
                    </div>

                    <p className="text-xs leading-tight">
                        {describe(difference, current)}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}