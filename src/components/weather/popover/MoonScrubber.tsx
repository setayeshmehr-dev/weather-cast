"use client";

import { useMemo, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import type { LocalClock } from "@/lib/localClock";

const HOUR_MS = 3_600_000;
const PX_PER_HOUR = 2.8;
// Ticks rendered on each side of the center.
const SPAN_HOURS = 64;
// About two months in each direction.
const MAX_OFFSET = 24 * 60;

type Tick = {
    key: number;
    left: number;
    strong: boolean;
    label: string | null;
    today: boolean;
};

type MoonScrubberProps = {
    /** "Now" at the start of the current local hour (UTC ms). */
    baseMs: number;
    /** Hours from "now"; it is continuous while dragging. */
    offsetHours: number;
    onOffsetChange: (offsetHours: number) => void;
    clock: LocalClock;
    timeZone: string;
    /** Local date of today ("YYYY-MM-DD"). */
    todayKey: string;
};

export default function MoonScrubber({
    baseMs,
    offsetHours,
    onOffsetChange,
    clock,
    timeZone,
    todayKey,
}: MoonScrubberProps) {
    const drag = useRef<{ x: number; offset: number } | null>(null);

    const formatters = useMemo(
        () => ({
            key: new Intl.DateTimeFormat("en-CA", {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }),
            weekday: new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }),
        }),
        [timeZone]
    );

    // Ticks sit on whole local hours; their position follows the exact time.
    const exact = baseMs + offsetHours * HOUR_MS;
    const aligned = baseMs + Math.round(offsetHours) * HOUR_MS;

    const ticks: Tick[] = [];

    for (let step = -SPAN_HOURS; step <= SPAN_HOURS; step++) {
        const ms = aligned + step * HOUR_MS;
        const minutes = clock.minutesOf(ms);

        if (minutes % 60 !== 0) continue;

        const hour = minutes / 60;

        if (hour % 3 !== 0) continue;

        ticks.push({
            key: Math.round((ms - baseMs) / HOUR_MS),
            left: ((ms - exact) / HOUR_MS) * PX_PER_HOUR,
            strong: hour === 0,
            label:
                hour === 12 ? formatters.weekday.format(ms).toUpperCase() : null,
            today: hour === 12 && formatters.key.format(ms) === todayKey,
        });
    }

    const clamp = (value: number) => Math.min(Math.max(value, -MAX_OFFSET), MAX_OFFSET);

        const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        // Only the primary button drags (a right click would open the menu and
        // the release would never arrive).
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, offset: offsetHours };
    };

    // On release the time settles on the nearest hour.
    const handleRelease = () => {
        if (!drag.current) return;

        drag.current = null;
        onOffsetChange(Math.round(offsetHours));
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;

        // The button was released somewhere we did not hear about.
        if (event.pointerType === "mouse" && event.buttons === 0) {
            handleRelease();
            return;
        }

        const hours = (drag.current.x - event.clientX) / PX_PER_HOUR;

        onOffsetChange(clamp(drag.current.offset + hours));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 24 : 1;
        const current = Math.round(offsetHours);

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            onOffsetChange(clamp(current - step));
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            onOffsetChange(clamp(current + step));
        }
    };

    return (
        <div
            role="slider"
            tabIndex={0}
            aria-label="Date and time of the moon"
            aria-valuemin={-MAX_OFFSET}
            aria-valuemax={MAX_OFFSET}
            aria-valuenow={Math.round(offsetHours)}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handleRelease}
            onPointerCancel={handleRelease}
            onLostPointerCapture={handleRelease}
            onContextMenu={(event) => event.preventDefault()}
            className="relative h-18 cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing"
        >
            <div className="absolute inset-0 overflow-hidden mask-[linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
                <div className="absolute top-0 left-1/2 h-full w-0">
                    {ticks.map((tick) => (
                        <span
                            key={tick.key}
                            className={`absolute top-3 w-px -translate-x-1/2 ${
                                tick.strong ? "h-8 bg-white" : "h-6 bg-white/35"
                            }`}
                            style={{ left: tick.left }}
                        />
                    ))}

                    {ticks.map(
                        (tick) =>
                            tick.label && (
                                <span
                                    key={`label-${tick.key}`}
                                    className={`absolute top-11 -translate-x-1/2 text-xs font-medium ${
                                        tick.today
                                            ? "font-semibold text-white"
                                            : "text-white/70"
                                    }`}
                                    style={{ left: tick.left }}
                                >
                                    {tick.today ? "TODAY" : tick.label}
                                </span>
                            )
                    )}
                </div>
            </div>

            <svg
                width={14}
                height={10}
                viewBox="0 0 14 10"
                className="absolute top-0 left-1/2 -translate-x-1/2"
                aria-hidden="true"
            >
                <path
                    d="M0 0 H14 L7 10 Z"
                    fill={Math.round(offsetHours) === 0 ? "#5ac8fa" : "#ffffff"}
                />
            </svg>
        </div>
    );
}