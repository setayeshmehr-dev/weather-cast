import WeatherCard from "@/components/weather/WeatherCard";
import type { AirQuality } from "@/hooks/useAirQuality";

const GAUGE_GRADIENT =
    "linear-gradient(to right, #3a8ff0 0%, #4cd964 22%, #c6e04a 45%, #f5c042 55%, #f08a3c 68%, #e63e50 82%, #8c1d2e 100%)";

const TREND_TEXT = {
    worse: "Air quality is worse than yesterday at about this time.",
    better: "Air quality is better than yesterday at about this time.",
    similar: "Air quality is similar to yesterday at about this time.",
};

type AirQualityCardProps = {
    airQuality: AirQuality | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function AirQualityCard({
    airQuality,
    loading,
    error,
    className,
}: AirQualityCardProps) {
    const position = airQuality
        ? Math.min(Math.max(airQuality.index, 0), 100)
        : 0;

    return (
        <WeatherCard
            title="AIR QUALITY"
            className={className}
            bodyClassName="flex flex-col justify-between"
        >
            {loading && (
                <p className="text-xs text-white/70">
                    Loading air quality...
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

            {!loading && !error && airQuality && (
                <>
                    <p className="text-xl leading-tight font-semibold">
                        {airQuality.label}
                    </p>

                    <div
                        className="relative h-1 rounded-full"
                        style={{ backgroundImage: GAUGE_GRADIENT }}
                    >
                        <span
                            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                            style={{ left: `${position}%` }}
                        />
                    </div>

                    <p className="text-xs leading-snug">
                        {airQuality.trend
                            ? TREND_TEXT[airQuality.trend]
                            : "Comparison with yesterday is not available."}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}