"use client";

import { useId, useMemo } from "react";
import type { ReactNode } from "react";

import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { getMoonInfo } from "@/lib/moon";
import type { MoonInfo } from "@/lib/moon";

// Default city (Tehran). Duplicated from the weather hooks until city management exists.
const LATITUDE = 35.69;
const LONGITUDE = 51.42;

// Soft dark patches that imitate the lunar maria: [cx, cy, rx, ry, opacity].
const MARIA: [number, number, number, number, number][] = [
    [34, 36, 13, 10, 0.16],
    [52, 30, 8, 7, 0.14],
    [58, 46, 10, 8, 0.15],
    [74, 38, 5, 4, 0.14],
    [26, 56, 10, 12, 0.12],
    [44, 62, 9, 7, 0.12],
    [60, 72, 7, 5, 0.1],
    [40, 80, 12, 4, 0.08],
];

// Small craters: [cx, cy, r].
const CRATERS: [number, number, number][] = [
    [50, 76, 4],
    [38, 20, 3],
    [68, 62, 3.5],
    [22, 40, 2.5],
    [64, 24, 2.5],
    [72, 74, 2.5],
];

// Lit part of the disk (waxing: right side). The terminator is an ellipse arc.
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
    const blurId = `${id}-moon-blur`;

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

                {detailed && (
                    <filter id={blurId}>
                        <feGaussianBlur stdDeviation={1.6} />
                    </filter>
                )}
            </defs>

            <circle cx={50} cy={50} r={48} fill="#5d6c9a" fillOpacity={0.55} />

            <g transform={waxing ? undefined : "translate(100 0) scale(-1 1)"}>
                <path
                    d={litPath(illumination)}
                    fill="#d3dcf5"
                    fillOpacity={0.9}
                />
            </g>

            {detailed && (
                <g clipPath={`url(#${clipId})`}>
                    <g filter={`url(#${blurId})`} fill="#1b2340">
                        {MARIA.map(([cx, cy, rx, ry, opacity]) => (
                            <ellipse
                                key={`${cx}-${cy}`}
                                cx={cx}
                                cy={cy}
                                rx={rx}
                                ry={ry}
                                fillOpacity={opacity}
                            />
                        ))}
                    </g>

                    <g
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={0.14}
                        strokeWidth={0.8}
                    >
                        {CRATERS.map(([cx, cy, r]) => (
                            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
                        ))}
                    </g>
                </g>
            )}

            <circle
                cx={50}
                cy={50}
                r={48}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.12}
                strokeWidth={0.8}
            />
        </svg>
    );
}

type MoonCardProps = {
    current: CurrentWeather | null;
    date: string | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function MoonCard({
    current,
    date,
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
            latitude: LATITUDE,
            longitude: LONGITUDE,
        });
    }, [current, date]);

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