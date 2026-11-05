"use client";

import { useId } from "react";
import { useFormat } from "@/hooks/useFormat";
import { smoothPath } from "@/lib/chart";


const WIDTH = 300;
const GUTTER = 46;
const PLOT_WIDTH = WIDTH - GUTTER;
const PLOT_TOP = 8;
const HEIGHT = 190;
const GRID_HOURS = [6, 12, 18];

type NormalRangeChartProps = {
    /** Temperature of today, one value per hour. */
    today: (number | null)[];
    /** Edges of the normal range, one value per hour. */
    low: number[];
    high: number[];
    ariaLabel: string;
};

export default function NormalRangeChart({
    today,
    low,
    high,
    ariaLabel,
}: NormalRangeChartProps) {
    const fmt = useFormat();
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const bandId = `${id}-band`;
    const lineId = `${id}-line`;

    const known = today.filter((value): value is number => value !== null);
    const everything = [...low, ...high, ...known];
    const ticks = fmt.temperatureTicks(Math.min(...everything), Math.max(...everything), 6);
    const min = ticks[0];
    const max = ticks[ticks.length - 1];
    const span = max - min || 1;
    const plotBottom = PLOT_TOP + HEIGHT;

    const x = (hour: number) => (hour / 24) * PLOT_WIDTH;
    const y = (value: number) => PLOT_TOP + (1 - (value - min) / span) * HEIGHT;

    const toPoints = (list: (number | null)[]) =>
        list.flatMap((value, hour) =>
            value === null ? [] : [{ x: x(hour), y: y(value) }]
        );

    const highPoints = toPoints(high);
    const lowPoints = toPoints(low).reverse();
    const todayPoints = toPoints(today);

    if (todayPoints.length < 2) return null;

    const band = `${smoothPath(highPoints)} ${smoothPath(lowPoints).replace(/^M/, "L")} Z`;
    const highest = Math.max(...known);
    const peakHour = today.indexOf(highest);

    return (
        <div className="relative rounded-xl border border-white/10 bg-white/4 px-2 pt-2">
            <div className="pointer-events-none absolute top-3 left-4">
                <p className="text-sm font-semibold">Today&apos;s High</p>
                <p className="text-3xl leading-tight font-medium">
                    {fmt.temperature(highest)}°
                </p>
            </div>

            <svg
                viewBox={`0 0 ${WIDTH} ${plotBottom + 8}`}
                className="block w-full"
                role="img"
                aria-label={ariaLabel}
            >
                <defs>
                    <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6fae9f" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#4f7fa5" stopOpacity={0.55} />
                    </linearGradient>

                    <linearGradient id={lineId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e3e58a" />
                        <stop offset="100%" stopColor="#8ee3d4" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => (
                    <g key={tick}>
                        <line
                            x1={0}
                            x2={PLOT_WIDTH}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke="#ffffff"
                            strokeOpacity={0.08}
                        />
                        <text
                            x={PLOT_WIDTH + 8}
                            y={y(tick)}
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight={600}
                            fill="#ffffff"
                            fillOpacity={0.6}
                        >
                            {fmt.temperature(tick)}°
                        </text>
                    </g>
                ))}

                {GRID_HOURS.map((hour) => (
                    <line
                        key={hour}
                        x1={x(hour)}
                        x2={x(hour)}
                        y1={PLOT_TOP}
                        y2={plotBottom}
                        stroke="#ffffff"
                        strokeOpacity={0.15}
                        strokeDasharray="2 3"
                    />
                ))}

                <path d={band} fill={`url(#${bandId})`} />

                <path
                    d={smoothPath(todayPoints)}
                    fill="none"
                    stroke={`url(#${lineId})`}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <circle
                    cx={x(peakHour)}
                    cy={y(highest)}
                    r={3.6}
                    fill="#ffffff"
                    stroke="#1c2036"
                    strokeWidth={1.6}
                />
            </svg>
        </div>
    );
}
