import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { CARD_TEXT, CARD_VALUE } from "@/lib/cardText";

type VisibilityCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

function getVisibilityDescription(km: number): string {
    if (km >= 16) return "Perfectly clear view.";
    if (km >= 8) return "Good visibility.";
    if (km >= 3) return "Visibility is reduced.";
    return "Visibility is very limited.";
}

function formatKm(km: number): string {
    return km < 10 ? km.toFixed(1) : String(Math.round(km));
}

export default function VisibilityCard({
    current,
    loading,
    error,
    className,
}: VisibilityCardProps) {
    const visibility = current?.visibility;

    const validVisibility =
        typeof visibility === "number" &&
        Number.isFinite(visibility) &&
        visibility >= 0;

    // Open-Meteo returns the visibility in meters.
    const km = validVisibility ? visibility / 1000 : null;

    return (
        <WeatherCard
            title="VISIBILITY"
            className={className}
            bodyClassName="flex flex-col justify-between"
        >
            {loading && (
                <p className="text-xs text-white/70">Loading visibility...</p>
            )}

            {error && (
                <p role="alert" className="text-xs text-white/80">
                    {error}
                </p>
            )}

            {!loading && !error && current && (
                <>
                    <p className={CARD_VALUE}>
                        {km === null ? (
                            "—"
                        ) : (
                            <>
                                {formatKm(km)}
                                <span className="ml-[0.2em] text-[0.57em] text-white/80">
                                    km
                                </span>
                            </>
                        )}
                    </p>

                    <p className={CARD_TEXT}>
                        {km === null
                            ? "Visibility data is unavailable."
                            : getVisibilityDescription(km)}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}