import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { CARD_CAPTION, CARD_TEXT, CARD_VALUE } from "@/lib/cardText";

function formatMm(value: number): string {
    return value < 0.05 ? "0" : value.toFixed(1);
}

type PrecipitationCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function PrecipitationCard({
    current,
    loading,
    error,
    className,
}: PrecipitationCardProps) {
    return (
        <WeatherCard
            title="PRECIPITATION"
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
                        <p className={CARD_VALUE}>
                            {formatMm(current.precipitationLast24h)}
                            <span className="ml-[0.2em] text-[0.57em] text-white/80">
                                mm
                            </span>
                        </p>
                        <p className={`mt-[3cqw] ${CARD_CAPTION}`}>
                            in last 24h
                        </p>
                    </div>

                    <p className={CARD_TEXT}>
                        {current.precipitationNext24h < 0.05
                            ? "None expected in next 24h."
                            : `${formatMm(current.precipitationNext24h)} mm expected in next 24h.`}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}