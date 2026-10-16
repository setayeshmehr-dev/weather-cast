"use client";

import { Wind } from "@phosphor-icons/react";
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
    weekdayLong,
} from "@/lib/dayLabels";
import { BEAUFORT, beaufortForce, meanDirection, windDirectionWords } from "@/lib/wind";
import { windDirectionName } from "@/lib/windDirection";

const SPEED_COLOR = "#4fd1d9";
const GUST_COLOR = "#3a8f86";

function mean(values: number[]): number {
    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
}

function compare(value: number, previous: number): string {
    const difference = Math.round(value) - Math.round(previous);

    if (difference >= 2) return "higher than";
    if (difference <= -2) return "lower than";
    return "similar to";
}

type WindArrowProps = {
    /** Meteorological direction: where the wind comes from. */
    direction: number;
};

// The arrow points where the wind is going to.
function WindArrow({ direction }: WindArrowProps) {
    return (
        <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            style={{ transform: `rotate(${direction + 180}deg)` }}
            aria-hidden="true"
        >
            <path
                d="M7 12 V2 M3 6 L7 2 L11 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

type WindPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function WindPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: WindPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const previous = index > 0 ? details.days[index - 1] : null;
    const isToday = day.date === todayDate;

    const hours = hoursOfDay(details, day.date);
    const speeds = hours.map((hour) => hour.windSpeed);
    const gusts = hours.map((hour) => hour.windGusts);

    const peakGust = Math.max(0, ...gusts);
    const previousPeakGust = previous
        ? Math.max(0, ...hoursOfDay(details, previous.date).map((hour) => hour.windGusts))
        : 0;

    const speed = isToday ? current.windSpeed : mean(speeds);
    const direction = isToday
        ? current.windDirection
        : meanDirection(hours.map((hour) => hour.windDirection));

    const lowSpeed = Math.round(Math.min(...speeds));
    const highSpeed = Math.round(Math.max(...speeds));
    const directionText = windDirectionWords(direction);

    const summary = isToday
        ? `Wind is currently ${Math.round(current.windSpeed)} km/h from the ${directionText}. Today, wind speeds are ${lowSpeed} to ${highSpeed} km/h, with gusts up to ${Math.round(peakGust)} km/h.`
        : `${weekdayLong(day.date)}, wind speeds will be ${lowSpeed} to ${highSpeed} km/h, mostly from the ${directionText}, with gusts up to ${Math.round(peakGust)} km/h.`;

    const scaleMax = Math.max(peakGust, previousPeakGust, 1);
    const activeForce = beaufortForce(speed);

    return (
        <DetailPopover
            anchor={anchor}
            title="Wind"
            icon={<Wind size={18} weight="regular" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={String(Math.round(speed))}
                unit="km/h"
                caption={`Gusts: ${Math.round(isToday ? current.windGusts : peakGust)} km/h`}
                extra={
                    <span className="text-2xl font-medium text-white/60">
                        {windDirectionName(direction)}
                    </span>
                }
            />

            <div className="px-4 pb-4">
                <DayChart
                    values={speeds}
                    ticks={niceTicks(0, Math.max(peakGust * 1.1, 10), 5)}
                    formatTick={(tick) => String(Math.round(tick))}
                    colorAt={() => SPEED_COLOR}
                    height={180}
                    fade
                    secondary={{ values: gusts, color: GUST_COLOR }}
                    nowHour={isToday ? hourFraction(current.time) : null}
                    renderTop={(hour) => (
                        <WindArrow direction={hours[hour]?.windDirection ?? 0} />
                    )}
                    ariaLabel={`Wind speed and gusts for ${weekdayLong(day.date)}`}
                />
            </div>

            <PopoverSection title="Daily Summary">
                <p className="text-base leading-snug text-white/90">{summary}</p>
            </PopoverSection>

            {previous && (
                <PopoverSection title="Daily Comparison">
                    <p className="text-base text-white/90">
                        {`The peak gust speed ${sentenceLabel(day.date, todayDate)} is ${compare(peakGust, previousPeakGust)} ${bareLabel(previous.date, todayDate)}.`}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <BarRow
                            label={relativeLabel(day.date, todayDate)}
                            value={peakGust}
                            max={scaleMax}
                            display={`${Math.round(peakGust)} km/h`}
                            highlight
                        />
                        <BarRow
                            label={relativeLabel(previous.date, todayDate)}
                            value={previousPeakGust}
                            max={scaleMax}
                            display={`${Math.round(previousPeakGust)} km/h`}
                        />
                    </div>
                </PopoverSection>
            )}

            <PopoverSection title="About Wind Speed and Gusts">
                <p className="text-base leading-snug text-white/90">
                    Wind speed is an average over a short period. Gusts are brief
                    bursts above that average, and one usually lasts less than 20
                    seconds. The arrows show where the wind is heading.
                </p>
            </PopoverSection>

            <PopoverSection title="Beaufort Scale">
                <table className="w-full text-left text-base">
                    <thead>
                        <tr className="text-sm font-semibold text-white/60">
                            <th className="pb-2 font-semibold">bft</th>
                            <th className="pb-2 font-semibold">Description</th>
                            <th className="pb-2 text-right font-semibold">km/h</th>
                        </tr>
                    </thead>

                    <tbody>
                        {BEAUFORT.map((level) => (
                            <tr
                                key={level.force}
                                className={`border-t border-white/10 ${
                                    level.force === activeForce ? "bg-white/10" : ""
                                }`}
                            >
                                <td className="py-2 pl-1">
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="size-3.5 rounded-full"
                                            style={{ backgroundColor: level.color }}
                                        />
                                        {level.force}
                                    </span>
                                </td>
                                <td className="py-2 text-white/70">{level.label}</td>
                                <td className="py-2 pr-1 text-right text-white/70">
                                    {level.range}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </PopoverSection>
        </DetailPopover>
    );
}