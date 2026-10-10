
import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";

type VisibilityCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

function getVisibilityDescription(miles: number): string {
    if (miles >= 10) return "Perfectly clear view.";
    if (miles >= 5) return "Good visibility.";
    if (miles >= 2) return "Visibility is reduced.";
    return "Visibility is very limited.";
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

    const miles = validVisibility ? visibility / 1609.344 : null;

    return (
        <WeatherCard
            title="VISIBILITY"
            className={className}
            bodyClassName="flex flex-1 flex-col justify-between"
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
                    <p className="text-[25px]! leading-tight font-normal tracking-tight">
                        {miles === null ? "—" : `${Math.round(miles)} mi`}
                    </p>

                    <p className="text-[12px]! leading-relaxed text-white/90 sm:text-sm">
                        {miles === null
                            ? "Visibility data is unavailable."
                            : getVisibilityDescription(miles)}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}
