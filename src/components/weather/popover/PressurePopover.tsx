"use client";

import { Gauge } from "@phosphor-icons/react";
import { useState } from "react";

import DayChart from "@/components/weather/popover/DayChart";
import DayPicker from "@/components/weather/popover/DayPicker";
import DetailPopover from "@/components/weather/popover/DetailPopover";
import { PopoverHeadline, PopoverSection } from "@/components/weather/popover/Parts";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import { hourFraction, hoursOfDay, sentenceLabel, weekdayLong } from "@/lib/dayLabels";
import { niceTicks } from "@/lib/chart";

const PURPLE = "#c640f0";

function trendSymbol(values: (number | null)[], hour: number): string {
    const now = values[hour];
    const before = values[Math.max(hour - 3, 0)];

    if (now === null || now === undefined || before === null || before === undefined) {
        return "=";
    }

    const change = now - before;

    if (change >= 1) return "↑";
    if (change <= -1) return "↓";
    return "=";
}

type PressurePopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function PressurePopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: PressurePopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const isToday = day.date === todayDate;

    const values = hoursOfDay(details, day.date).map((hour) => hour.pressure);
    const known = values.filter((value): value is number => value !== null);

    const average = known.length
        ? known.reduce((sum, value) => sum + value, 0) / known.length
        : current.pressure;
    const lowest = known.length ? Math.min(...known) : current.pressure;
    const highest = known.length ? Math.max(...known) : current.pressure;

    const dayChange = known.length > 1 ? known[known.length - 1] - known[0] : 0;
    const dayTrend =
        dayChange >= 1 ? "rising" : dayChange <= -1 ? "falling" : "steady";
    const trend = isToday ? current.pressureTrend : dayTrend;

    const caption = trend.charAt(0).toUpperCase() + trend.slice(1);
    const shown = isToday ? current.pressure : average;

    const summary = isToday
        ? `Pressure is currently ${Math.round(current.pressure)} hPa and ${trend}. Today, the average pressure will be ${Math.round(average)} hPa, and the lowest pressure will be ${Math.round(lowest)} hPa.`
        : `${weekdayLong(day.date)}, the pressure will be ${trend}. The average pressure will be ${Math.round(average)} hPa, and the lowest pressure will be ${Math.round(lowest)} hPa.`;

    return (
        <DetailPopover
            anchor={anchor}
            title="Pressure"
            icon={<Gauge size={18} weight="regular" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={String(Math.round(shown))}
                unit="hPa"
                caption={caption}
            />

            <div className="px-4 pb-4">
                <DayChart
                    values={values}
                    ticks={niceTicks(lowest - 1, highest + 1, 6)}
                    formatTick={(tick) => String(Math.round(tick))}
                    colorAt={() => PURPLE}
                    height={200}
                    nowHour={isToday ? hourFraction(current.time) : null}
                    renderTop={(hour) => <span>{trendSymbol(values, hour)}</span>}
                    ariaLabel={`Pressure chart ${sentenceLabel(day.date, todayDate)}`}
                />
            </div>

            <PopoverSection title="Daily Summary">
                <p className="text-base leading-snug text-white/90">{summary}</p>
            </PopoverSection>

            <PopoverSection title="About Pressure">
                <p className="text-base leading-snug text-white/90">
                    Atmospheric pressure is the weight of the air above you, shown
                    here as sea-level pressure. Falling pressure often brings clouds
                    and rain, while rising pressure usually means clearer, calmer
                    weather. How fast it changes tells you more than the number
                    itself.
                </p>
            </PopoverSection>
        </DetailPopover>
    );
}