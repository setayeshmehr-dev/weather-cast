"use client";

import { Sun } from "@phosphor-icons/react";
import { useState } from "react";

import DayChart from "@/components/weather/popover/DayChart";
import DayPicker from "@/components/weather/popover/DayPicker";
import DetailPopover from "@/components/weather/popover/DetailPopover";
import {
    BarRow,
    PopoverHeadline,
    PopoverSection,
} from "@/components/weather/popover/Parts";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import {
    bareLabel,
    clock,
    hourFraction,
    hoursOfDay,
    relativeLabel,
    sentenceLabel,
    weekdayLong,
} from "@/lib/dayLabels";
import { uvColor, uvLevel } from "@/lib/uv";

const TICKS = Array.from({ length: 12 }, (_, value) => value);

const BANDS = [
    { value: 0, label: "Low" },
    { value: 3, label: "Moderate" },
    { value: 6, label: "High" },
    { value: 8, label: "Very High" },
    { value: 11, label: "Extreme" },
];

function compare(value: number, previous: number): string {
    const difference = Math.round(value) - Math.round(previous);

    if (difference >= 1) return "higher than";
    if (difference <= -1) return "lower than";
    return "similar to";
}

type UvPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function UvPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: UvPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const previous = index > 0 ? details.days[index - 1] : null;
    const isToday = day.date === todayDate;

    const hours = hoursOfDay(details, day.date);
    const values = hours.map((hour) => hour.uvIndex);
    const peak = Math.max(0, ...values);
    const previousPeak = previous
        ? Math.max(0, ...hoursOfDay(details, previous.date).map((hour) => hour.uvIndex))
        : 0;

    const value = isToday ? (current.uvIndex ?? 0) : peak;
    const strong = hours.filter((hour) => hour.uvIndex >= 3);
    const strongText =
        strong.length > 0
            ? `Levels of Moderate or higher are reached from ${clock(strong[0].time)} to ${clock(strong[strong.length - 1].time)}.`
            : "Levels stay Low all day.";

    const peakWord = compare(peak, previousPeak);

    return (
        <DetailPopover
            anchor={anchor}
            title="UV Index"
            icon={<Sun size={18} weight="regular" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={String(Math.round(value))}
                unit={uvLevel(value)}
                caption="World Health Organization UVI"
            />

            <div className="px-4 pb-4">
                <DayChart
                    values={values}
                    ticks={TICKS}
                    formatTick={(tick) => String(tick)}
                    tickFontSize={10}
                    colorAt={uvColor}
                    height={230}
                    bands={BANDS}
                    nowHour={isToday ? hourFraction(current.time) : null}
                    renderTop={(hour) => (
                        <span>{Math.round(hours[hour]?.uvIndex ?? 0)}</span>
                    )}
                    ariaLabel={`UV index chart for ${weekdayLong(day.date)}`}
                />

                <p className="mt-4 text-sm font-semibold">
                    {isToday ? `Now, ${clock(current.time)}` : weekdayLong(day.date)}
                </p>
                <p className="mt-1 text-base leading-snug text-white/90">
                    {isToday ? `${uvLevel(value)} levels currently. ` : ""}
                    {strongText}
                </p>
            </div>

            {previous && (
                <PopoverSection title="Daily Comparison">
                    <p className="text-base text-white/90">
                        {`The peak UV index ${sentenceLabel(day.date, todayDate)} is ${peakWord} ${bareLabel(previous.date, todayDate)}.`}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <BarRow
                            label={relativeLabel(day.date, todayDate)}
                            value={peak}
                            max={Math.max(peak, previousPeak, 1)}
                            display={String(Math.round(peak))}
                            highlight
                        />
                        <BarRow
                            label={relativeLabel(previous.date, todayDate)}
                            value={previousPeak}
                            max={Math.max(peak, previousPeak, 1)}
                            display={String(Math.round(previousPeak))}
                        />
                    </div>
                </PopoverSection>
            )}

            <PopoverSection title="About the UV Index">
                <p className="text-base leading-snug text-white/90">
                    The UV index, defined by the World Health Organization, rates how
                    strongly the sun&apos;s ultraviolet radiation can harm your skin.
                    The higher the number, the less time it takes to burn. From a
                    level of 3 (Moderate) upward, shade, sunscreen, a hat and
                    protective clothing are recommended.
                </p>
            </PopoverSection>
        </DetailPopover>
    );
}