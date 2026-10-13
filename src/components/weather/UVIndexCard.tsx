import { Sun } from "@phosphor-icons/react";

import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { CARD_LABEL, CARD_TEXT, CARD_VALUE } from "@/lib/cardText";

const UV_GRADIENT =
    "linear-gradient(to right, #4cd964 0%, #c6e04a 20%, #f5c042 40%, #f08a3c 60%, #e63e50 80%, #d335ea 100%)";

type UVIndexCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

function getUvLevel(value: number) {
    if (value < 3) {
        return {
            label: "Low",
            description: "Low UV levels.",
        };
    }

    if (value < 6) {
        return {
            label: "Moderate",
            description: "Protection may be needed.",
        };
    }

    if (value < 8) {
        return {
            label: "High",
            description: "Protection is recommended.",
        };
    }

    if (value < 11) {
        return {
            label: "Very High",
            description: "Extra sun protection is needed.",
        };
    }

    return {
        label: "Extreme",
        description: "Avoid prolonged sun exposure.",
    };
}

export default function UVIndexCard({
    current,
    loading,
    error,
    className,
}: UVIndexCardProps) {
    const uvIndex = current?.uvIndex ?? null;
    const level = uvIndex === null ? null : getUvLevel(uvIndex);
    const position =
        uvIndex === null ? 0 : Math.min(Math.max((uvIndex / 11) * 100, 0), 100);

    return (
        <WeatherCard
            title="UV INDEX"
            icon={<Sun size={16} weight="fill" />}
            className={className}
            bodyClassName="flex flex-col justify-between"
        >
            {loading && (
                <p className="text-xs text-white/70">
                    Loading UV index...
                </p>
            )}

            {error && (
                <p role="alert" className="text-xs text-white/80">
                    {error}
                </p>
            )}

            {!loading && !error && uvIndex !== null && level && (
                <>
                    <div>
                        <p className={`${CARD_VALUE} tabular-nums`}>
                            {Math.round(uvIndex)}
                        </p>

                        <p className={`mt-[3cqw] text-white/80 ${CARD_LABEL}`}>
                            {level.label}
                        </p>
                    </div>

                    <div
                        className="relative h-[3.3cqw] rounded-full"
                        style={{ backgroundImage: UV_GRADIENT }}
                        role="img"
                        aria-label={`UV index ${uvIndex} out of 11`}
                    >
                        <span
                            className="absolute top-1/2 size-[6cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                            style={{ left: `${position}%` }}
                        />
                    </div>

                    <p className={`text-white/80 ${CARD_TEXT}`}>
                        {level.description}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}
