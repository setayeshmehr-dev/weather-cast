"use client";

import { useId, useMemo } from "react";
import type { ReactNode } from "react";

import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { WIDE_TEXT } from "@/lib/cardText";
import { getMoonInfo } from "@/lib/moon";
import type { MoonInfo } from "@/lib/moon";

const MOON_IMAGE = "/images/moon.webp";

// Mirrors a drawing horizontally inside the 100x100 box.
const MIRROR = "translate(100 0) scale(-1 1)";

/*
 * Lit part of the disk for the header icon (lit on the right): the limb is a
 * semicircle and the terminator an ellipse arc.
 */
function crescentPath(illumination: number): string {
    const radiusX = 48 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 1 : 0;

    return `M 50 2 A 48 48 0 0 1 50 98 A ${radiusX.toFixed(2)} 48 0 0 ${sweep} 50 2 Z`;
}

/*
 * Lit region used in the shadow mask: the terminator ellipse followed by
 * everything on its right, far beyond the disk. Since the limb is never part of
 * the shape, blurring it softens only the terminator (and never dims the limb).
 */
function litRegion(illumination: number): string {
    const radiusX = 48 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 0 : 1;

    return `M 50 2 A ${radiusX.toFixed(2)} 48 0 0 ${sweep} 50 98 L 50 112 L 130 112 L 130 -12 L 50 -12 Z`;
}

type MoonGlyphProps = {
    illumination: number;
    litOnRight: boolean;
};

// Simple vector icon for the card header.
function MoonGlyph({ illumination, litOnRight }: MoonGlyphProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            className="size-3.5 shrink-0"
            aria-hidden="true"
        >
            <circle
                cx={50}
                cy={50}
                r={45}
                fill="none"
                stroke="currentColor"
                strokeWidth={8}
            />

            <g transform={litOnRight ? undefined : MIRROR}>
                <path d={crescentPath(illumination)} fill="currentColor" />
            </g>
        </svg>
    );
}

type MoonDiskProps = {
    illumination: number;
    litOnRight: boolean;
    southern: boolean;
    className?: string;
};

function MoonDisk({
    illumination,
    litOnRight,
    southern,
    className,
}: MoonDiskProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const clipId = `${id}-moon-clip`;
    const maskId = `${id}-moon-mask`;
    const softId = `${id}-moon-soft`;
    const sphereId = `${id}-moon-sphere`;
    const haloId = `${id}-moon-halo`;

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

                {/* Soft terminator: the lit region is blurred inside the shadow mask. */}
                <filter id={softId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation={1.8} />
                </filter>

                <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x={-20}
                    y={-20}
                    width={140}
                    height={140}
                >
                    <rect x={-20} y={-20} width={140} height={140} fill="#ffffff" />

                    <g
                        filter={`url(#${softId})`}
                        transform={litOnRight ? undefined : MIRROR}
                    >
                        <path d={litRegion(illumination)} fill="#000000" />
                    </g>
                </mask>

                {/* Limb darkening: the edge of the sphere is darker than its center. */}
                <radialGradient id={sphereId}>
                    <stop offset="55%" stopColor="#000000" stopOpacity={0} />
                    <stop offset="100%" stopColor="#000000" stopOpacity={0.5} />
                </radialGradient>

                <radialGradient id={haloId}>
                    <stop offset="70%" stopColor="#cfd8ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#cfd8ff" stopOpacity={0} />
                </radialGradient>
            </defs>

            <circle
                cx={50}
                cy={50}
                r={60}
                fill={`url(#${haloId})`}
                opacity={0.15 + 0.7 * illumination}
            />

            <g clipPath={`url(#${clipId})`}>
                <image
                    href={MOON_IMAGE}
                    x={-8}
                    y={-8}
                    width={115}
                    height={115}
                    preserveAspectRatio="xMidYMid slice"
                    transform={southern ? "rotate(180 50 50)" : undefined}
                />

                {/* The unlit side is dimmed, not black, so the surface stays faintly visible. */}
                <rect
                    x={-20}
                    y={-20}
                    width={140}
                    height={140}
                    fill="#070b1c"
                    fillOpacity={0.8}
                    mask={`url(#${maskId})`}
                />

                <circle cx={50} cy={50} r={48} fill={`url(#${sphereId})`} />
            </g>

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

    // In the northern hemisphere a waxing moon is lit on its right; in the
    // southern hemisphere it is lit on its left (and the moon looks upside down).
    const southern = latitude < 0;
    const waxing = moon ? moon.phase < 0.5 : true;
    const litOnRight = waxing !== southern;

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
                            <span className="text-[0.8em] uppercase">
                                {fullMoonDays === 1 ? "day" : "days"}
                            </span>
                        </>
                    ),
            },
        ]
        : [];

    return (
        <WeatherCard
            skeleton="wide"
            title={moon?.name ?? "MOON PHASE"}
            icon={
                moon ? (
                    <MoonGlyph
                        illumination={moon.illumination}
                        litOnRight={litOnRight}
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
                <div className="grid h-full grid-cols-[minmax(0,1fr)_34cqw] gap-x-[4.3cqw]">
                    <dl className={`flex h-full flex-col ${WIDE_TEXT}`}>
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
                        litOnRight={litOnRight}
                        southern={southern}
                        className="aspect-square w-full self-center overflow-visible"
                    />
                </div>
            )}
        </WeatherCard>
    );
}