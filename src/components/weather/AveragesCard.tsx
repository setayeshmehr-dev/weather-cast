import WeatherCard from "@/components/weather/WeatherCard";
import { CARD_LABEL, CARD_SMALL, CARD_VALUE } from "@/lib/cardText";

type AveragesCardProps = {
    today: number | null;
    average: number | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

function describe(difference: number): string {
    if (difference > 0) return "above average daily high";
    if (difference < 0) return "below average daily high";
    return "same as average daily high";
}

export default function AveragesCard({
    today,
    average,
    loading,
    error,
    className,
}: AveragesCardProps) {
    const ready = today !== null && average !== null;
    const difference = ready ? Math.round(today) - Math.round(average) : 0;
    const sign = difference > 0 ? "+" : "";

    return (
        <WeatherCard
            title="AVERAGES"
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

            {!loading && !error && ready && (
                <>
                    <div>
                        <p className={CARD_VALUE}>
                            {sign}
                            {difference}°
                        </p>
                        <p className={`mt-[3cqw] font-semibold ${CARD_LABEL}`}>
                            {describe(difference)}
                        </p>
                    </div>

                    <dl className={CARD_SMALL}>
                        <div className="flex justify-between">
                            <dt className="text-white/50">Today</dt>
                            <dd className="font-semibold">
                                H:{Math.round(today)}°
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-white/50">Average</dt>
                            <dd className="font-semibold">
                                H:{Math.round(average)}°
                            </dd>
                        </div>
                    </dl>
                </>
            )}
        </WeatherCard>
    );
}