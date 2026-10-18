"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo } from "react";

import { getMoonGlyph } from "@/lib/moon";
import type { LocalClock } from "@/lib/localClock";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Lit part of a small icon (lit on the right).
function glyphPath(illumination: number): string {
    const radiusX = 10 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 1 : 0;

    return `M 12 2 A 10 10 0 0 1 12 22 A ${radiusX.toFixed(2)} 10 0 0 ${sweep} 12 2 Z`;
}

type MoonGlyphProps = {
    illumination: number;
    litOnRight: boolean;
};

function MoonGlyph({ illumination, litOnRight }: MoonGlyphProps) {
    return (
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <circle cx={12} cy={12} r={10} fill="#4b4e5b" />

            <g transform={litOnRight ? undefined : "translate(24 0) scale(-1 1)"}>
                <path d={glyphPath(illumination)} fill="#d8dae3" />
            </g>
        </svg>
    );
}

type MoonCalendarProps = {
    year: number;
    /** 0 to 11. */
    month: number;
    latitude: number;
    clock: LocalClock;
    /** Local date of today ("YYYY-MM-DD"). */
    todayKey: string;
    /** Local date of the selected instant ("YYYY-MM-DD"). */
    selectedKey: string;
    onSelect: (key: string) => void;
    onShift: (step: number) => void;
};

export default function MoonCalendar({
    year,
    month,
    latitude,
    clock,
    todayKey,
    selectedKey,
    onSelect,
    onShift,
}: MoonCalendarProps) {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const southern = latitude < 0;

    const days = useMemo(
        () =>
            Array.from({ length: dayCount }, (_, index) => {
                const day = index + 1;
                const noonUtc = Date.UTC(year, month, day, 12);
                const glyph = getMoonGlyph(noonUtc - clock.offsetMsAt(noonUtc));

                return {
                    day,
                    key: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                    weekday: (firstWeekday + index) % 7,
                    ...glyph,
                };
            }),
        [year, month, dayCount, firstWeekday, clock]
    );

    const title = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });

    return (
        <div>
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => onShift(-1)}
                    className="flex size-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15"
                >
                    <CaretLeft size={16} weight="bold" />
                </button>

                <p className="text-base font-semibold">{title}</p>

                <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => onShift(1)}
                    className="flex size-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15"
                >
                    <CaretRight size={16} weight="bold" />
                </button>
            </div>

            <div className="mt-3 grid grid-cols-7 text-center text-sm font-semibold text-white/60">
                {WEEKDAYS.map((weekday, index) => (
                    <span key={`${weekday}-${index}`}>{weekday}</span>
                ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
                {Array.from({ length: firstWeekday }, (_, index) => (
                    <span key={`empty-${index}`} />
                ))}

                {days.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        aria-label={item.key}
                        aria-pressed={item.key === selectedKey}
                        onClick={() => onSelect(item.key)}
                        className={`mx-auto flex w-full max-w-11 flex-col items-center gap-1 rounded-lg py-1.5 text-lg ${
                            item.key === selectedKey ? "bg-white/10" : "hover:bg-white/5"
                        } ${
                            item.key === todayKey
                                ? "font-semibold text-[#5ac8fa]"
                                : item.weekday === 0 || item.weekday === 6
                                    ? "text-white/50"
                                    : "text-white"
                        }`}
                    >
                        <span className="leading-none">{item.day}</span>
                        <MoonGlyph
                            illumination={item.illumination}
                            litOnRight={item.waxing !== southern}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}