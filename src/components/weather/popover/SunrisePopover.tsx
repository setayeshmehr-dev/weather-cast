"use client";

import { SunHorizon } from "@phosphor-icons/react";
import { useId, useMemo, useState } from "react";
import type { PointerEvent } from "react";

import DetailPopover from "@/components/weather/popover/DetailPopover";
import { PopoverSection } from "@/components/weather/popover/Parts";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import { createLocalClock } from "@/lib/localClock";
import { getSunEvents, sunAltitude } from "@/lib/sun";

const WIDTH = 300;
const PLOT_TOP = 8;
const HEIGHT = 210;
const SAMPLE_STEP = 10;
const AXIS_HOURS = [0, 6, 12, 18];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function minutesOfIso(time: string): number {
    return Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
}

function clockText(minutes: number): string {
    const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;

    return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function Duration({ minutes }: { minutes: number }) {
    const rounded = Math.round(minutes);

    return (
        <>
            {Math.floor(rounded / 60)}
            <span className="text-[0.75em]">HR</span> {rounded % 60}
            <span className="text-[0.75em]">MIN</span>
        </>
    );
}

type SunrisePopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    latitude: number;
    longitude: number;
};

export default function SunrisePopover({
    anchor,
    onClose,
    details,
    current,
    latitude,
    longitude,
}: SunrisePopoverProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const curveId = `${id}-curve`;

    const [cursor, setCursor] = useState<number | null>(null);

    const today = details.days[details.todayIndex];
    const riseMinutes = minutesOfIso(today.sunrise);
    const setMinutes = minutesOfIso(today.sunset);
    const nowMinutes = minutesOfIso(current.time);

    const model = useMemo(() => {
        const clock = createLocalClock(current.timezone);
        const events = getSunEvents(today.date, latitude, longitude);
        const midnight =
            Date.parse(`${today.date}T00:00Z`) - current.utcOffsetSeconds * 1000;

        const altitudeAt = (minute: number) =>
            sunAltitude(midnight + minute * 60_000, latitude, longitude);

        const samples: { minute: number; altitude: number }[] = [];

        for (let minute = 0; minute <= 1440; minute += SAMPLE_STEP) {
            samples.push({ minute, altitude: altitudeAt(minute) });
        }

        const maxAbs = Math.max(...samples.map((sample) => Math.abs(sample.altitude)), 1);

        // Monthly averages of the sunrise and the sunset, and the longest day.
        const year = Number(today.date.slice(0, 4));
        const sums = MONTH_NAMES.map(() => ({ rise: 0, set: 0, count: 0 }));
        let longest = { minutes: 0, date: "" };

        for (let month = 0; month < 12; month++) {
            const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

            for (let day = 1; day <= days; day++) {
                const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = getSunEvents(date, latitude, longitude);

                if (dayEvents.sunrise === null || dayEvents.sunset === null) continue;

                sums[month].rise += clock.minutesOf(dayEvents.sunrise);
                sums[month].set += clock.minutesOf(dayEvents.sunset);
                sums[month].count++;

                const length = (dayEvents.sunset - dayEvents.sunrise) / 60_000;

                if (length > longest.minutes) longest = { minutes: length, date };
            }
        }

        const months = sums.map((sum) => ({
            rise: sum.count ? sum.rise / sum.count : 0,
            set: sum.count ? sum.set / sum.count : 0,
        }));

        return {
            clock,
            events,
            altitudeAt,
            samples,
            maxAbs,
            months,
            longest,
            dawn: events.firstLight === null ? null : clock.minutesOf(events.firstLight),
            dusk: events.lastLight === null ? null : clock.minutesOf(events.lastLight),
        };
    }, [today, current.timezone, current.utcOffsetSeconds, latitude, longitude]);

    const { clock, events, altitudeAt, samples, maxAbs, months, longest, dawn, dusk } = model;

    const plotBottom = PLOT_TOP + HEIGHT;
    const middle = PLOT_TOP + HEIGHT / 2;
    const x = (minute: number) => (minute / 1440) * WIDTH;
    const y = (altitude: number) => middle - (altitude / maxAbs) * (HEIGHT / 2 - 10);

    const path = samples
        .map(
            (sample, index) =>
                `${index === 0 ? "M" : "L"} ${x(sample.minute).toFixed(1)} ${y(sample.altitude).toFixed(1)}`
        )
        .join(" ");

    const daylight = setMinutes - riseMinutes;

    // Three dots between first light and sunrise, and between sunset and last light.
    const twilightDots: number[] = [];

    if (dawn !== null) {
        for (let step = 1; step <= 3; step++) {
            twilightDots.push(dawn + ((riseMinutes - dawn) * step) / 4);
        }
    }

    if (dusk !== null) {
        for (let step = 1; step <= 3; step++) {
            twilightDots.push(setMinutes + ((dusk - setMinutes) * step) / 4);
        }
    }

    const periodAt = (minute: number): string => {
        if (minute >= riseMinutes && minute <= setMinutes) return "DAY";
        if (dawn !== null && minute >= dawn && minute < riseMinutes) return "TWILIGHT";
        if (dusk !== null && minute > setMinutes && minute <= dusk) return "TWILIGHT";

        return "NIGHT";
    };

    const next =
        cursor === null
            ? null
            : cursor < riseMinutes
                ? { label: "Sunrise", minutes: riseMinutes - cursor }
                : cursor < setMinutes
                    ? { label: "Sunset", minutes: setMinutes - cursor }
                    : { label: "Sunrise", minutes: riseMinutes + 1440 - cursor };

    const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const fraction = (event.clientX - rect.left) / rect.width;

        setCursor(Math.round(Math.min(Math.max(fraction, 0), 1) * 1439));
    };

    const nowAltitude = altitudeAt(nowMinutes);
    const cursorAltitude = cursor === null ? 0 : altitudeAt(cursor);

    const minRise = Math.min(...months.map((month) => month.rise));
    const maxSet = Math.max(...months.map((month) => month.set));
    const monthSpan = Math.max(maxSet - minRise, 1);

    const longestMonth = longest.date ? Number(longest.date.slice(5, 7)) - 1 : 0;
    const longestDay = longest.date ? Number(longest.date.slice(8, 10)) : 0;

    return (
        <DetailPopover
            anchor={anchor}
            title="Sunrise"
            icon={<SunHorizon size={18} weight="regular" />}
            onClose={onClose}
        >
            <div className="px-4 pt-4 pb-3">
                <p className="h-5 text-sm font-semibold tracking-wide text-white/60">
                    {cursor === null ? "\u00a0" : periodAt(cursor)}
                </p>
                <p className="text-[44px] leading-none font-medium">
                    {cursor === null ? clockText(riseMinutes) : clockText(cursor)}
                </p>
                <p className="mt-1 text-sm font-medium text-white/60">
                    {next ? (
                        <>
                            {next.label}: <Duration minutes={next.minutes} />
                        </>
                    ) : (
                        <>
                            Total daylight: <Duration minutes={daylight} />
                        </>
                    )}
                </p>
            </div>

            <div className="px-4 pb-3">
                <div
                    className="touch-pan-y rounded-xl border border-white/10 bg-white/[0.04] px-2 pt-2"
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        handlePointer(event);
                    }}
                    onPointerMove={(event) => {
                        if (event.buttons === 1 || event.pointerType === "mouse") {
                            handlePointer(event);
                        }
                    }}
                    onPointerUp={() => setCursor(null)}
                    onPointerCancel={() => setCursor(null)}
                    onPointerLeave={() => setCursor(null)}
                >
                    <svg
                        viewBox={`0 0 ${WIDTH} ${plotBottom + 20}`}
                        className="block w-full select-none"
                        role="img"
                        aria-label="Altitude of the sun during the day"
                    >
                        <defs>
                            <linearGradient
                                id={curveId}
                                gradientUnits="userSpaceOnUse"
                                x1={0}
                                y1={PLOT_TOP}
                                x2={0}
                                y2={plotBottom}
                            >
                                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>

                        {[0, 1, 2, 3, 4, 5].map((line) => (
                            <line
                                key={line}
                                x1={0}
                                x2={WIDTH}
                                y1={PLOT_TOP + (line * HEIGHT) / 5}
                                y2={PLOT_TOP + (line * HEIGHT) / 5}
                                stroke="#ffffff"
                                strokeOpacity={0.08}
                            />
                        ))}

                        {AXIS_HOURS.slice(1).map((hour) => (
                            <line
                                key={hour}
                                x1={x(hour * 60)}
                                x2={x(hour * 60)}
                                y1={PLOT_TOP}
                                y2={plotBottom + 14}
                                stroke="#ffffff"
                                strokeOpacity={0.18}
                                strokeDasharray="2 3"
                            />
                        ))}

                        <line
                            x1={0}
                            x2={WIDTH}
                            y1={y(0)}
                            y2={y(0)}
                            stroke="#ffffff"
                            strokeOpacity={0.55}
                            strokeWidth={3}
                        />

                        <path
                            d={path}
                            fill="none"
                            stroke={`url(#${curveId})`}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {twilightDots.map((minute) => (
                            <circle
                                key={minute}
                                cx={x(minute)}
                                cy={y(altitudeAt(minute))}
                                r={2.4}
                                fill="#ffffff"
                                fillOpacity={0.85}
                            />
                        ))}

                        <circle
                            cx={x(nowMinutes)}
                            cy={y(nowAltitude)}
                            r={7}
                            fill={nowAltitude > 0 ? "#ffffff" : "#2b2c31"}
                            stroke="#ffffff"
                            strokeOpacity={0.9}
                            strokeWidth={1.5}
                        />

                        {cursor !== null && (
                            <>
                                <line
                                    x1={x(cursor)}
                                    x2={x(cursor)}
                                    y1={PLOT_TOP}
                                    y2={plotBottom}
                                    stroke="#ffffff"
                                    strokeWidth={1.5}
                                />
                                <circle
                                    cx={x(cursor)}
                                    cy={y(cursorAltitude)}
                                    r={8}
                                    fill="#ffffff"
                                />
                            </>
                        )}

                        {AXIS_HOURS.map((hour) => (
                            <text
                                key={hour}
                                x={x(hour * 60) + 4}
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
            </div>

            <ul className="px-4 pb-4">
                {[
                    ["First Light", events.firstLight === null ? "–" : clock.format(events.firstLight)],
                    ["Sunrise Today", clockText(riseMinutes)],
                    ["Sunset Today", clockText(setMinutes)],
                    ["Last Light", events.lastLight === null ? "–" : clock.format(events.lastLight)],
                ].map(([label, value]) => (
                    <li
                        key={label}
                        className="flex justify-between border-t border-white/10 py-3 text-lg first:border-t-0"
                    >
                        <span className="font-medium">{label}</span>
                        <span className="font-semibold text-white/60">{value}</span>
                    </li>
                ))}

                <li className="flex justify-between border-t border-white/10 py-3 text-lg">
                    <span className="font-medium">Total Daylight</span>
                    <span className="font-semibold text-white/60">
                        <Duration minutes={daylight} />
                    </span>
                </li>
            </ul>

            <PopoverSection
                title="Sunrise and Sunset Averages"
                subtitle={undefined}
            >
                <p className="-mt-2 mb-3 text-sm font-medium text-white/60">
                    Longest daylight: <Duration minutes={longest.minutes} />{" "}
                    {MONTH_NAMES[longestMonth]} {longestDay}
                </p>

                <ul>
                    {months.map((month, index) => (
                        <li
                            key={MONTH_NAMES[index]}
                            className="flex items-center gap-3 border-t border-white/10 py-2.5 text-lg first:border-t-0"
                        >
                            <span className="w-10 shrink-0 font-semibold">
                                {MONTH_NAMES[index]}
                            </span>
                            <span className="w-12 shrink-0 text-right text-white/50">
                                {clockText(month.rise)}
                            </span>

                            <div className="relative h-1.5 flex-1 rounded-full bg-black/25">
                                <div
                                    className="absolute inset-y-0 rounded-full bg-[#5ac8fa]"
                                    style={{
                                        left: `${((month.rise - minRise) / monthSpan) * 100}%`,
                                        width: `${((month.set - month.rise) / monthSpan) * 100}%`,
                                    }}
                                />
                            </div>

                            <span className="w-12 shrink-0 font-semibold">
                                {clockText(month.set)}
                            </span>
                        </li>
                    ))}
                </ul>
            </PopoverSection>
        </DetailPopover>
    );
}
