"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import { smoothPath } from "@/lib/chart";

const WIDTH = 300;
const GUTTER = 46;
const PLOT_WIDTH = WIDTH - GUTTER;
const PLOT_TOP = 8;
const AXIS_HEIGHT = 20;
const AXIS_HOURS = [0, 6, 12, 18];

type Plotted = {
    x: number;
    y: number;
    hour: number;
};

type DayChartProps = {
    /** One value per hour of the day (index = hour). */
    values: (number | null)[];
    /** Y axis ticks, ascending; they set the range of the chart. */
    ticks: number[];
    formatTick: (value: number) => string;
    /** Color of the line and the area at a given value. */
    colorAt: (value: number) => string;
    height?: number;
    tickFontSize?: number;
    /** Fades the area toward the bottom. */
    fade?: boolean;
    /** Content shown above the plot for 12 two-hour slots. */
    renderTop?: (hour: number) => ReactNode;
    /** Current time as a fractional hour (today only). */
    nowHour?: number | null;
    markers?: { index: number; label: string }[];
    bands?: { value: number; label: string }[];
    ariaLabel: string;
};

function valueAt(values: (number | null)[], hour: number): number | null {
    const lower = Math.floor(hour);
    const upper = Math.min(lower + 1, values.length - 1);
    const a = values[lower];
    const b = values[upper];

    if (a === null || a === undefined) return null;
    if (b === null || b === undefined) return a;

    return a + (b - a) * (hour - lower);
}

export default function DayChart({
    values,
    ticks,
    formatTick,
    colorAt,
    height = 150,
    tickFontSize = 11,
    fade = false,
    renderTop,
    nowHour = null,
    markers = [],
    bands = [],
    ariaLabel,
}: DayChartProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const strokeId = `${id}-stroke`;
    const fillId = `${id}-fill`;

    const min = ticks[0];
    const max = ticks[ticks.length - 1];
    const span = max - min || 1;
    const plotBottom = PLOT_TOP + height;

    const x = (hour: number) => (hour / 24) * PLOT_WIDTH;
    const y = (value: number) => PLOT_TOP + (1 - (value - min) / span) * height;

    const points: Plotted[] = [];

    values.forEach((value, hour) => {
        if (value !== null && Number.isFinite(value)) {
            points.push({ x: x(hour), y: y(value), hour });
        }
    });

    if (points.length < 2) {
        return (
            <p className="px-4 text-sm text-white/60">No data for this day.</p>
        );
    }

    const line = smoothPath(points);
    const first = points[0];
    const last = points[points.length - 1];
    const area = `${line} L ${last.x.toFixed(2)} ${plotBottom} L ${first.x.toFixed(2)} ${plotBottom} Z`;

    const nowValue = nowHour === null ? null : valueAt(values, nowHour);
    const now =
        nowHour !== null && nowValue !== null
            ? { x: x(nowHour), y: y(nowValue) }
            : null;

    // Gradient stops, top (highest tick) to bottom.
    const stops = [...ticks].reverse().map((tick) => ({
        offset: (max - tick) / span,
        color: colorAt(tick),
    }));

    return (
        <div className="rounded-xl border border-white/10 bg-white/4 px-2 pt-2">
            {renderTop && (
                <div
                    className="mb-1 grid grid-cols-12 items-center text-center text-[11px] font-medium"
                    style={{ paddingRight: `${(GUTTER / WIDTH) * 100}%` }}
                >
                    {Array.from({ length: 12 }, (_, slot) => (
                        <div key={slot} className="flex justify-center">
                            {renderTop(slot * 2 + 1)}
                        </div>
                    ))}
                </div>
            )}

            <svg
                viewBox={`0 0 ${WIDTH} ${plotBottom + AXIS_HEIGHT}`}
                className="block w-full"
                role="img"
                aria-label={ariaLabel}
            >
                <defs>
                    <linearGradient
                        id={strokeId}
                        gradientUnits="userSpaceOnUse"
                        x1={0}
                        y1={PLOT_TOP}
                        x2={0}
                        y2={plotBottom}
                    >
                        {stops.map((stop) => (
                            <stop
                                key={stop.offset}
                                offset={`${stop.offset * 100}%`}
                                stopColor={stop.color}
                            />
                        ))}
                    </linearGradient>

                    <linearGradient
                        id={fillId}
                        gradientUnits="userSpaceOnUse"
                        x1={0}
                        y1={PLOT_TOP}
                        x2={0}
                        y2={plotBottom}
                    >
                        {stops.map((stop) => (
                            <stop
                                key={stop.offset}
                                offset={`${stop.offset * 100}%`}
                                stopColor={stop.color}
                                stopOpacity={fade ? 0.6 - 0.5 * stop.offset : 0.5}
                            />
                        ))}
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
                            fontSize={tickFontSize}
                            fontWeight={600}
                            fill="#ffffff"
                            fillOpacity={0.6}
                        >
                            {formatTick(tick)}
                        </text>
                    </g>
                ))}

                {bands.map((band) => (
                    <g key={band.label}>
                        <line
                            x1={0}
                            x2={PLOT_WIDTH}
                            y1={y(band.value)}
                            y2={y(band.value)}
                            stroke="#ffffff"
                            strokeOpacity={0.16}
                        />
                        <text
                            x={4}
                            y={y(band.value) - 5}
                            fontSize={10}
                            fontWeight={600}
                            fill="#ffffff"
                            fillOpacity={0.55}
                        >
                            {band.label}
                        </text>
                    </g>
                ))}

                {AXIS_HOURS.slice(1).map((hour) => (
                    <line
                        key={hour}
                        x1={x(hour)}
                        x2={x(hour)}
                        y1={PLOT_TOP}
                        y2={plotBottom + AXIS_HEIGHT - 6}
                        stroke="#ffffff"
                        strokeOpacity={0.15}
                        strokeDasharray="2 3"
                    />
                ))}

                <path d={area} fill={`url(#${fillId})`} />

                {now && (
                    <rect
                        x={0}
                        y={PLOT_TOP}
                        width={now.x}
                        height={height}
                        fill="#000000"
                        fillOpacity={0.22}
                    />
                )}

                <path
                    d={line}
                    fill="none"
                    stroke={`url(#${strokeId})`}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {markers.map((marker) => {
                    const point = points.find((item) => item.hour === marker.index);

                    if (!point) return null;

                    return (
                        <g key={`${marker.label}-${marker.index}`}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={3.4}
                                fill="#ffffff"
                                stroke="#1c2036"
                                strokeWidth={1.6}
                            />
                            <text
                                x={point.x}
                                y={point.y - 9}
                                textAnchor="middle"
                                fontSize={11}
                                fontWeight={700}
                                fill="#ffffff"
                                fillOpacity={0.75}
                            >
                                {marker.label}
                            </text>
                        </g>
                    );
                })}

                {now && (
                    <>
                        <line
                            x1={now.x}
                            x2={now.x}
                            y1={PLOT_TOP}
                            y2={plotBottom}
                            stroke="#ffffff"
                            strokeOpacity={0.85}
                        />
                        <circle
                            cx={now.x}
                            cy={now.y}
                            r={3.8}
                            fill="#ffffff"
                            stroke="#1c2036"
                            strokeWidth={1.8}
                        />
                    </>
                )}

                {AXIS_HOURS.map((hour) => (
                    <text
                        key={hour}
                        x={x(hour) + 4}
                        y={plotBottom + 14}
                        fontSize={11}
                        fontWeight={600}
                        fill="#ffffff"
                        fillOpacity={0.55}
                    >
                        {String(hour).padStart(2, "0")}
                    </text>
                ))}
            </svg>
        </div>
    );
}