"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

import type { DailyItem } from "@/hooks/useWeather";
import { dayOfMonth, fullDate, weekdayInitial } from "@/lib/dayLabels";

const VISIBLE_DAYS = 8;

type DayPickerProps = {
    days: DailyItem[];
    selectedDate: string;
    todayDate: string;
    onSelect: (date: string) => void;
};

function dayClassName(selected: boolean, isToday: boolean, past: boolean): string {
    if (selected) {
        return isToday
            ? "bg-[#5ac8fa] font-medium text-white"
            : "bg-white font-medium text-slate-900";
    }

    if (isToday) return "font-medium text-[#5ac8fa] hover:bg-white/10";

    return past ? "text-white/50 hover:bg-white/10" : "text-white hover:bg-white/10";
}

export default function DayPicker({
    days,
    selectedDate,
    todayDate,
    onSelect,
}: DayPickerProps) {
    const index = Math.max(
        days.findIndex((day) => day.date === selectedDate),
        0
    );
    const start = Math.min(
        Math.max(index - 1, 0),
        Math.max(days.length - VISIBLE_DAYS, 0)
    );
    const visible = days.slice(start, start + VISIBLE_DAYS);

    const move = (step: number) => {
        const next = days[index + step];

        if (next) onSelect(next.date);
    };

    return (
        <div className="border-b border-white/10 px-4 pb-3">
            <div className="grid grid-cols-8 text-center">
                {visible.map((day) => (
                    <span
                        key={day.date}
                        className="py-1 text-sm font-semibold text-white/70"
                    >
                        {weekdayInitial(day.date)}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-8 text-center">
                {visible.map((day) => (
                    <button
                        key={day.date}
                        type="button"
                        aria-label={fullDate(day.date)}
                        aria-pressed={day.date === selectedDate}
                        onClick={() => onSelect(day.date)}
                        className={`mx-auto flex size-9 items-center justify-center rounded-full text-lg ${dayClassName(
                            day.date === selectedDate,
                            day.date === todayDate,
                            day.date < todayDate
                        )}`}
                    >
                        {dayOfMonth(day.date)}
                    </button>
                ))}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    aria-label="Previous day"
                    disabled={index === 0}
                    onClick={() => move(-1)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40"
                >
                    <CaretLeft size={16} weight="bold" />
                </button>

                <p className="text-center text-base font-medium">
                    {fullDate(selectedDate)}
                </p>

                <button
                    type="button"
                    aria-label="Next day"
                    disabled={index >= days.length - 1}
                    onClick={() => move(1)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40"
                >
                    <CaretRight size={16} weight="bold" />
                </button>
            </div>
        </div>
    );
}