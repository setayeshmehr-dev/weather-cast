"use client";

import { useId } from "react";

import WeatherCard from "@/components/weather/WeatherCard";
import type {
    CurrentWeather,
    ForecastItem,
    SunEvent,
} from "@/hooks/useWeather";
import { CARD_VALUE } from "@/lib/cardText";

const MINUTES_PER_DAY = 1440;

// Size of the curve drawing; it scales to the width of the card.
const WIDTH = 144;
const HEIGHT = 56;
const HORIZON_Y = 30;
const MAX_UNIT = 20;

// The curve is sampled every 15 minutes.
const SAMPLE_STEP = 15;

function minutesOfDay(time: string): number {
    return Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
}

function formatTime(time: string): string {
    return time.slice(11, 16);
}

function isSunrise(item: ForecastItem): item is SunEvent {
    return item.kind === "sunrise";
}

function isSunset(item: ForecastItem): item is SunEvent {
    return item.kind === "sunset";
}

type SunEventIconProps = {
    direction: "up" | "down";
};

function SunEventIcon({ direction }: SunEventIconProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5 shrink-0"
            aria-hidden="true"
        >
            <path d="M2 13h12" />
            <path d="M4.5 13a3.5 3.5 0 0 1 7 0" />
            {direction === "up" ? (
                <path d="M8 5.5v-4M6.2 3.3 8 1.5l1.8 1.8" />
            ) : (
                <path d="M8 1.5v4M6.2 3.7 8 5.5l1.8-1.8" />
            )}
        </svg>
    );
}

type SunCurveProps = {
    sunrise: number;
    sunset: number;
    now: number;
};

/*
 * The curve is a cosine that crosses the horizon exactly at sunrise and sunset
 * and peaks at solar noon. It is an approximation of the sun's altitude, not
 * real astronomical data.
 * The SVG does not clip (overflow-visible): only the edge of the card does, so
 * the sun and its glow are never cut by the drawing itself.
 */
function SunCurve({ sunrise, sunset, now }: SunCurveProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const aboveId = `${id}-above`;
    const belowId = `${id}-below`;
    const glowId = `${id}-glow`;
    const dayId = `${id}-day`;
    const blurId = `${id}-blur`;

    const noon = (sunrise + sunset) / 2;
    const halfDay = (sunset - sunrise) / 2;
    const omega = (2 * Math.PI) / MINUTES_PER_DAY;
    const offset = Math.cos(omega * halfDay);
    const unit = Math.min(
        MAX_UNIT,
        (HEIGHT - HORIZON_Y - 3) / (1 + Math.abs(offset))
    );

    const pointAt = (minute: number) => {
        const altitude = Math.cos(omega * (minute - noon)) - offset;

        return {
            x: (minute / MINUTES_PER_DAY) * WIDTH,
            y: HORIZON_Y - altitude * unit,
            altitude,
        };
    };

    const path = Array.from(
        { length: MINUTES_PER_DAY / SAMPLE_STEP + 1 },
        (_, index) => {
            const { x, y } = pointAt(index * SAMPLE_STEP);

            return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
    ).join(" ");

    const sun = pointAt(now);
    const glowOpacity = sun.altitude > -0.15 ? 0.95 : 0.3;

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block w-full overflow-visible"
            role="img"
            aria-label="Sun position during the day"
        >
            <defs>
                <clipPath id={aboveId}>
                    <rect x={-20} y={-20} width={WIDTH + 40} height={HORIZON_Y + 20} />
                </clipPath>

                <clipPath id={belowId}>
                    <rect
                        x={-20}
                        y={HORIZON_Y}
                        width={WIDTH + 40}
                        height={HEIGHT - HORIZON_Y + 20}
                    />
                </clipPath>

                <radialGradient id={glowId}>
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                    <stop offset="45%" stopColor="#ffffff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </radialGradient>

                {/* The day line is brightest next to the sun. */}
                <linearGradient
                    id={dayId}
                    gradientUnits="userSpaceOnUse"
                    x1={sun.x - 45}
                    y1={0}
                    x2={sun.x + 45}
                    y2={0}
                >
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.3} />
                </linearGradient>

                <filter id={blurId} x="-10%" y="-60%" width="120%" height="220%">
                    <feGaussianBlur stdDeviation={2} />
                </filter>
            </defs>

            <circle
                cx={sun.x}
                cy={sun.y}
                r={24}
                fill={`url(#${glowId})`}
                opacity={glowOpacity}
            />

            <path
                d={path}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.35}
                strokeWidth={5}
                strokeLinecap="round"
                filter={`url(#${blurId})`}
                clipPath={`url(#${aboveId})`}
            />

            <path
                d={path}
                fill="none"
                stroke="#000000"
                strokeOpacity={0.28}
                strokeWidth={2.6}
                strokeLinecap="round"
                clipPath={`url(#${belowId})`}
            />

            <path
                d={path}
                fill="none"
                stroke={`url(#${dayId})`}
                strokeWidth={2.6}
                strokeLinecap="round"
                clipPath={`url(#${aboveId})`}
            />

            <line
                x1={0}
                y1={HORIZON_Y}
                x2={WIDTH}
                y2={HORIZON_Y}
                stroke="#ffffff"
                strokeOpacity={0.85}
                strokeWidth={1.2}
            />

            <circle cx={sun.x} cy={sun.y} r={5} fill="#1d2133" />

            <circle
                cx={sun.x}
                cy={sun.y}
                r={5}
                fill="#ffffff"
                clipPath={`url(#${aboveId})`}
            />

            <circle
                cx={sun.x}
                cy={sun.y}
                r={5.6}
                fill="none"
                stroke="#000000"
                strokeOpacity={0.3}
            />
        </svg>
    );
}

type SunriseCardProps = {
    current: CurrentWeather | null;
    forecast: ForecastItem[];
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function SunriseCard({
    current,
    forecast,
    loading,
    error,
    className,
}: SunriseCardProps) {
    const sunrise = forecast.find(isSunrise);
    const sunset = forecast.find(isSunset);
    const ready = current !== null && sunrise !== undefined && sunset !== undefined;

    // The next event is the sunrise when it is night, the sunset when it is day.
    const isNight = ready && sunrise.time < sunset.time;

    return (
        <WeatherCard
            title={isNight || !ready ? "SUNRISE" : "SUNSET"}
            icon={<SunEventIcon direction={isNight || !ready ? "up" : "down"} />}
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
                    <p className={CARD_VALUE}>
                        {formatTime(isNight ? sunrise.time : sunset.time)}
                    </p>

                    {/* Above the text, bleeding to the sides and bottom of the card. */}
                    <div className="pointer-events-none relative z-10 -mx-(--card-pad) -mb-(--card-pad)">
                        <SunCurve
                            sunrise={minutesOfDay(sunrise.time)}
                            sunset={minutesOfDay(sunset.time)}
                            now={minutesOfDay(current.time)}
                        />
                    </div>
                </>
            )}
        </WeatherCard>
    );
}