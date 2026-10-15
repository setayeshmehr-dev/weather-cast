"use client";

import { Eye } from "@phosphor-icons/react";
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
import { niceTicks } from "@/lib/chart";
import {
    bareLabel,
    hourFraction,
    hoursOfDay,
    relativeLabel,
    sentenceLabel,
} from "@/lib/dayLabels";

function describe(km: number): string {
    if (km >= 16) return "Perfectly clear";
    if (km >= 8) return "Clear";
    if (km >= 3) return "Reduced";
    return "Very limited";
}

const formatKm = (km: number) => (km < 10 ? km.toFixed(1) : String(Math.round(km)));

function mean(values: number[]): number {
    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
}

function dayKm(details: WeatherDetails, date: string): (number | null)[] {
    return hoursOfDay(details, date).map((hour) =>
        hour.visibility === null ? null : hour.visibility / 1000
    );
}

function known(values: (number | null)[]): number[] {
    return values.filter((value): value is number => value !== null);
}

type VisibilityPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function VisibilityPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: VisibilityPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const previous = index > 0 ? details.days[index - 1] : null;
    const isToday = day.date === todayDate;

    const values = dayKm(details, day.date);
    const kms = known(values);
    const average = mean(kms);
    const lowest = kms.length ? Math.min(...kms) : 0;
    const highest = kms.length ? Math.max(...kms) : 0;
    const previousAverage = previous ? mean(known(dayKm(details, previous.date))) : 0;

    const currentKm =
        current.visibility === null ? average : current.visibility / 1000;
    const shown = isToday ? currentKm : average;

    const ratio = previousAverage > 0 ? average / previousAverage : 1;
    const comparison = ratio >= 1.1 ? "better than" : ratio <= 0.9 ? "worse than" : "similar to";

    const scaleMax = Math.max(average, previousAverage, 1);

    return (
        <DetailPopover
            anchor={anchor}
            title="Visibility"
            icon={<Eye size={18} weight="fill" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={formatKm(shown)}
                unit="km"
                caption={describe(shown)}
            />

            <div className="px-4 pb-4">
                <DayChart
                    values={values}
                    ticks={niceTicks(0, Math.max(10, highest * 1.1), 5)}
                    formatTick={(tick) => (tick === 0 ? "0 km" : String(tick))}
                    colorAt={() => "#ffffff"}
                    height={200}
                    fade
                    nowHour={isToday ? hourFraction(current.time) : null}
                    renderTop={(hour) => (
                        <span>
                            {values[hour] === null || values[hour] === undefined
                                ? "–"
                                : Math.round(values[hour] as number)}
                        </span>
                    )}
                    ariaLabel={`Visibility chart ${sentenceLabel(day.date, todayDate)}`}
                />
            </div>

            <PopoverSection title="Daily Summary">
                <p className="text-base leading-snug text-white/90">
                    {kms.length
                        ? `${isToday ? "Today" : sentenceLabel(day.date, todayDate)}, the visibility will be ${describe(average).toLowerCase()}, at ${formatKm(lowest)} to ${formatKm(highest)} km.`
                        : "No visibility data for this day."}
                </p>
            </PopoverSection>

            {previous && (
                <PopoverSection title="Daily Comparison">
                    <p className="text-base text-white/90">
                        {`Visibility ${sentenceLabel(day.date, todayDate)} is ${comparison} ${bareLabel(previous.date, todayDate)}.`}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <BarRow
                            label={relativeLabel(day.date, todayDate)}
                            value={average}
                            max={scaleMax}
                            display={`${formatKm(average)} km`}
                            highlight
                        />
                        <BarRow
                            label={relativeLabel(previous.date, todayDate)}
                            value={previousAverage}
                            max={scaleMax}
                            display={`${formatKm(previousAverage)} km`}
                        />
                    </div>
                </PopoverSection>
            )}
        </DetailPopover>
    );
}