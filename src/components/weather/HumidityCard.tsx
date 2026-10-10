
import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";

type HumidityCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function HumidityCard({
    current,
    loading,
    error,
    className,
}: HumidityCardProps) {
    const humidity = current?.relativeHumidity;
    const dewPoint = current?.dewPoint;

    const validHumidity =
        typeof humidity === "number" && Number.isFinite(humidity);

    const validDewPoint =
        typeof dewPoint === "number" && Number.isFinite(dewPoint);

    const dewPointF = validDewPoint
        ? Math.round((dewPoint * 9) / 5 + 32)
        : null;

    return (
        <WeatherCard
            title="HUMIDITY"
            className={className}
            bodyClassName="flex flex-1 flex-col justify-between"
        >
            {loading && (
                <p className="text-xs text-white/70">Loading humidity...</p>
            )}

            {error && (
                <p role="alert" className="text-xs text-white/80">
                    {error}
                </p>
            )}

            {!loading && !error && current && (
                <>
                    <p className="text-[25px]! leading-tight font-normal tracking-tight">
                        {validHumidity ? `${Math.round(humidity)}%` : "—"}
                    </p>

                    <p className="text-[12px]! leading-relaxed text-white/90 sm:text-sm">
                        {dewPointF === null
                            ? "Dew point data is unavailable."
                            : `The dew point is ${dewPointF}° right now.`}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}
