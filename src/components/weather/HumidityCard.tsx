import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { CARD_TEXT, CARD_VALUE } from "@/lib/cardText";

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

    return (
        <WeatherCard
            title="HUMIDITY"
            className={className}
            bodyClassName="flex flex-col justify-between"
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
                    <p className={CARD_VALUE}>
                        {validHumidity ? `${Math.round(humidity)}%` : "—"}
                    </p>

                    <p className={CARD_TEXT}>
                        {validDewPoint
                            ? `The dew point is ${Math.round(dewPoint)}° right now.`
                            : "Dew point data is unavailable."}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}