
"use client";

import { useId, useMemo } from "react";
import type { ReactNode } from "react";

import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { getMoonInfo } from "@/lib/moon";
import type { MoonInfo } from "@/lib/moon";



function litPath(illumination: number): string {
    const radiusX = 48 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 1 : 0;

    return `M 50 2 A 48 48 0 0 1 50 98 A ${radiusX.toFixed(2)} 48 0 0 ${sweep} 50 2 Z`;
}

type MoonDiskProps = {
    illumination: number;
    waxing: boolean;
    detailed?: boolean;
    className?: string;
};

function MoonDisk({
    illumination,
    waxing,
    detailed = false,
    className,
}: MoonDiskProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const clipId = `${id}-moon-clip`;
    const phaseMaskId = `${id}-moon-phase`;
    const shadowId = `${id}-moon-shadow`;

    const phaseTransform = waxing
        ? undefined
        : "translate(100 0) scale(-1 1)";

    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            aria-hidden="true"
        >
            <defs>
                <clipPath id={clipId}>
                    <circle cx={50} cy={50} r={48} />
                </clipPath>

                <mask id={phaseMaskId}>
                    <rect width={100} height={100} fill="#fff" />
                    <path
                        d={litPath(illumination)}
                        fill="#000"
                        transform={phaseTransform}
                    />
                </mask>

                {detailed && (
                    <filter id={shadowId}>
                        <feGaussianBlur stdDeviation={1.6} />
                    </filter>
                )}
            </defs>

            <g clipPath={`url(#${clipId})`}>
                <image
                    href="/images/moon.webp"
                    x={-8}
                    y={-8}
                    width={115}
                    height={115}
                    preserveAspectRatio="xMidYMid slice"
                />

                <rect
                    width={100}
                    height={100}
                    fill="#010104"
                    fillOpacity={0.88}
                    mask={`url(#${phaseMaskId})`}
                    transform={phaseTransform}
                />
            </g>

            <circle
                cx={50}
                cy={50}
                r={48}
                fill="none"
                strokeOpacity={0.12}
                strokeWidth={0.8}
            />
        </svg>
    );
}

type MoonCardProps = {
    current: CurrentWeather | null;
    date: string | null;
    latitude: number;
    longitude: number;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function MoonCard({
    current,
    date,
    latitude,
    longitude,
    loading,
    error,
    className,
}: MoonCardProps) {
    const moon = useMemo<MoonInfo | null>(() => {
        if (!current || !date) return null;

        return getMoonInfo({
            nowMs:
                Date.parse(`${current.time}Z`) - current.utcOffsetSeconds * 1000,
            date,
            utcOffsetSeconds: current.utcOffsetSeconds,
            latitude,
            longitude,
        });
    }, [current, date, latitude, longitude]);

    const fullMoonDays = moon ? Math.round(moon.daysToFullMoon) : 0;

    const rows: { label: string; value: ReactNode }[] = moon
        ? [
            {
                label: "Illumination",
                value: `${Math.round(moon.illumination * 100)}%`,
            },
            {
                label: "Moonrise",
                value: moon.moonrise ?? "—",
            },
            {
                label: "Next Full Moon",
                value:
                    fullMoonDays === 0 ? (
                        "Today"
                    ) : (
                        <>
                            {fullMoonDays}{" "}
                            <span className="text-[10px] uppercase">
                                {fullMoonDays === 1 ? "day" : "days"}
                            </span>
                        </>
                    ),
            },
        ]
        : [];

    return (
        <WeatherCard
            title={moon?.name ?? "MOON PHASE"}
            icon={
                moon ? (
                    <MoonDisk
                        illumination={moon.illumination}
                        waxing={moon.phase < 0.5}
                        className="size-3.5 shrink-0"
                    />
                ) : undefined
            }
            className={className}
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

            {!loading && !error && moon && (
                <div className="grid h-full grid-cols-[minmax(0,1fr)_96px] gap-x-3">
                    <dl className="flex h-full flex-col text-xs">
                        {rows.map((row, index) => (
                            <div
                                key={row.label}
                                className={`flex flex-1 items-center justify-between ${
                                    index < rows.length - 1
                                        ? "border-b border-white/15"
                                        : ""
                                }`}
                            >
                                <dt className="font-medium">{row.label}</dt>
                                <dd className="text-white/50">{row.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <MoonDisk
                        illumination={moon.illumination}
                        waxing={moon.phase < 0.5}
                        detailed
                        className="size-24 self-center"
                    />
                </div>
            )}
        </WeatherCard>
    );
}
