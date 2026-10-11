
"use client";

import { Sun } from "@phosphor-icons/react";
import WeatherCard from "@/components/weather/WeatherCard";
import { useUvIndex } from "@/hooks/useUvIndex";

const UV_GRADIENT =
    "linear-gradient(to right, #4cd964 0%, #c6e04a 20%, #f5c042 40%, #f08a3c 60%, #e63e50 80%, #d335ea 100%)";

type UVIndexCardProps = {
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
    className,
}: UVIndexCardProps) {
    const { uvIndex, loading, error } = useUvIndex();
    const level = uvIndex === null ? null : getUvLevel(uvIndex);
    const position = uvIndex === null
        ? 0
        : Math.min(Math.max((uvIndex / 11) * 100, 0), 100);

    return (
        <WeatherCard
            title="UV INDEX"
            icon={<Sun size={16} weight="fill" />}
            className={className}
            bodyClassName="flex flex-col justify-between"
        >
            {loading && (
                <p className="text-[12px] text-white/70">
                    Loading UV index...
                </p>
            )}

            {error && (
                <p role="alert" className="text-[12px] text-white/80">
                    {error}
                </p>
            )}

            {!loading && !error && uvIndex !== null && level && (
                <>
                    <div>
                        <p className="text-[25px] leading-tight font-normal tabular-nums">
                            {Math.round(uvIndex)}
                        </p>

                        <p className="mt-1 text-[12px] text-white/80">
                            {level.label}
                        </p>
                    </div>

                    <div
                        className="relative h-1 rounded-full"
                        style={{ backgroundImage: UV_GRADIENT }}
                        role="img"
                        aria-label={`UV index ${uvIndex} out of 11`}
                    >
                        <span
                            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                            style={{ left: `${position}%` }}
                        />
                    </div>

                    <p className="text-[12px] leading-snug text-white/80">
                        {level.description}
                    </p>
                </>
            )}
        </WeatherCard>
    );
}
