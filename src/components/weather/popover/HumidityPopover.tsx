"use client";

import { Waves } from "@phosphor-icons/react";
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
import { interpolateColor } from "@/lib/colorScale";
import type { ColorStop } from "@/lib/colorScale";
import {
    bareLabel,
    hourFraction,
    hoursOfDay,
    relativeLabel,
    sentenceLabel,
    weekdayLong,
} from "@/lib/dayLabels";

const TICKS = [0, 20, 40, 60, 80, 100];

const HUMIDITY_STOPS: ColorStop[] = [
    [0, [76, 150, 90]],
    [40, [60, 140, 190]],
    [70, [64, 120, 240]],
    [100, [155, 107, 255]],
];

const humidityColor = (value: number) => interpolateColor(HUMIDITY_STOPS, value);

function known(values: (number | null)[]): number[] {
    return values.filter((value): value is number => value !== null);
}

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

type HumidityPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function HumidityPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: HumidityPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const previous = index > 0 ? details.days[index - 1] : null;
    const isToday = day.date === todayDate;

    const hours = hoursOfDay(details, day.date);
    const values = hours.map((hour) => hour.relativeHumidity);
    const average = mean(known(values));
    const dewPoints = known(hours.map((hour) => hour.dewPoint));
    const previousAverage = previous
        ? mean(known(hoursOfDay(details, previous.date).map((hour) => hour.relativeHumidity)))
        : 0;

    const shownHumidity = isToday ? (current.relativeHumidity ?? average) : average;
    const shownDewPoint = isToday ? current.dewPoint : mean(dewPoints);

    const dewRange = dewPoints.length
        ? ` The dew point is ${Math.round(Math.min(...dewPoints))}° to ${Math.round(Math.max(...dewPoints))}°.`
        : "";

    const summary = `${isToday ? "Today" : weekdayLong(day.date)}, the average humidity ${isToday ? "is" : "will be"} ${Math.round(average)}%.${dewRange}`;

    const scaleMax = Math.max(average, previousAverage, 1);

    return (
        <DetailPopover
            anchor={anchor}
            title="Humidity"
            icon={<Waves size={18} weight="regular" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={String(Math.round(shownHumidity))}
                unit="%"
                caption={
                    shownDewPoint === null
                        ? "Dew point unavailable"
                        : `Dew point: ${Math.round(shownDewPoint)}°`
                }
            />

            <div className="px-4 pb-4">
                <DayChart
                    values={values}
                    ticks={TICKS}
                    formatTick={(tick) => `${tick}%`}
                    colorAt={humidityColor}
                    height={190}
                    topSlots={4}
                    nowHour={isToday ? hourFraction(current.time) : null}
                    renderTop={(hour) => (
                        <span>
                            {values[hour] === null || values[hour] === undefined
                                ? "–"
                                : `${Math.round(values[hour] as number)}%`}
                        </span>
                    )}
                    ariaLabel={`Humidity chart for ${weekdayLong(day.date)}`}
                />
            </div>

            <PopoverSection title="Daily Summary">
                <p className="text-base leading-snug text-white/90">{summary}</p>
            </PopoverSection>

            {previous && (
                <PopoverSection title="Daily Comparison">
                    <p className="text-base text-white/90">
                        {`The average humidity ${sentenceLabel(day.date, todayDate)} is ${compare(average, previousAverage)} ${bareLabel(previous.date, todayDate)}.`}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <BarRow
                            label={relativeLabel(day.date, todayDate)}
                            value={average}
                            max={scaleMax}
                            display={`${Math.round(average)}%`}
                            highlight
                        />
                        <BarRow
                            label={relativeLabel(previous.date, todayDate)}
                            value={previousAverage}
                            max={scaleMax}
                            display={`${Math.round(previousAverage)}%`}
                        />
                    </div>
                </PopoverSection>
            )}

            <PopoverSection title="About Relative Humidity">
                <p className="text-base leading-snug text-white/90">
                    Relative humidity compares the moisture in the air with the most
                    the air could hold at its current temperature. Warm air holds
                    more moisture, so the same air feels drier in the afternoon and
                    more humid at night. Values close to 100% mean dew or fog may
                    form.
                </p>
            </PopoverSection>

            <PopoverSection title="About Dew Point">
                <p className="text-base leading-snug text-white/90">
                    The dew point is the temperature the air would have to cool to
                    before dew starts to form. It is a good measure of how muggy it
                    feels: the higher it is, the stickier the air. When the dew
                    point reaches the air temperature, the relative humidity is
                    100%.
                </p>
            </PopoverSection>
        </DetailPopover>
    );
}