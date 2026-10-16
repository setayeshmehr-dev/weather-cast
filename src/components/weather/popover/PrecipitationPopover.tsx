"use client";

import { Drop } from "@phosphor-icons/react";
import { useState } from "react";

import DayChart from "@/components/weather/popover/DayChart";
import DayPicker from "@/components/weather/popover/DayPicker";
import DetailPopover from "@/components/weather/popover/DetailPopover";
import HourlyBars from "@/components/weather/popover/HourlyBars";
import { PopoverHeadline, PopoverSection } from "@/components/weather/popover/Parts";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import { hourFraction, hoursOfDay, weekdayLong } from "@/lib/dayLabels";

const CHANCE_TICKS = [0, 20, 40, 60, 80, 100];
const SKY = "#4cc2ff";

const formatMm = (value: number) => (value < 0.05 ? "0" : value.toFixed(1));

type PrecipitationPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function PrecipitationPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: PrecipitationPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;
    const [date, setDate] = useState(initialDate);

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const isToday = day.date === todayDate;
    const hours = hoursOfDay(details, day.date);

    const rain = hours.map((hour) => hour.precipitation);
    const total = rain.reduce((sum, value) => sum + value, 0);
    const nowHour = isToday ? hourFraction(current.time) : null;

    const summary = isToday
        ? `There has been ${formatMm(current.precipitationLast24h)} mm of precipitation in the last 24 hours. Today's total precipitation will be ${formatMm(total)} mm.`
        : `${weekdayLong(day.date)}'s total precipitation will be ${formatMm(total)} mm.`;

    return (
        <DetailPopover
            anchor={anchor}
            title="Precipitation"
            icon={<Drop size={18} weight="fill" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={formatMm(total)}
                unit="mm"
                caption="Total for the day"
            />

            <div className="px-4 pb-4">
                <HourlyBars
                    values={rain}
                    nowHour={nowHour}
                    ariaLabel={`Hourly precipitation for ${weekdayLong(day.date)}`}
                />
            </div>

            <PopoverSection
                title="Chance of Precipitation"
                subtitle={`${isToday ? "Today" : weekdayLong(day.date)}'s chance: ${Math.round(day.precipitationChance)}%`}
            >
                <DayChart
                    values={hours.map((hour) => hour.precipitationChance)}
                    ticks={CHANCE_TICKS}
                    formatTick={(value) => `${value}%`}
                    colorAt={() => SKY}
                    height={110}
                    fade
                    nowHour={nowHour}
                    ariaLabel="Chance of precipitation by hour"
                />

                <p className="mt-3 text-sm text-white/60">
                    The daily chance of precipitation tends to be higher than the
                    chance for each hour.
                </p>
            </PopoverSection>

            {isToday && (
                <PopoverSection title="Precipitation Totals">
                    <div className="flex flex-col gap-3">
                        <div className="border-b border-white/10 pb-3">
                            <p className="text-xs font-medium tracking-wide text-white/60">
                                LAST 24 HOURS
                            </p>
                            <p className="flex justify-between text-lg font-semibold">
                                Precipitation
                                <span>{formatMm(current.precipitationLast24h)} mm</span>
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium tracking-wide text-white/60">
                                NEXT 24 HOURS
                            </p>
                            <p className="flex justify-between text-lg font-semibold">
                                Precipitation
                                <span>{formatMm(current.precipitationNext24h)} mm</span>
                            </p>
                        </div>
                    </div>
                </PopoverSection>
            )}

            <PopoverSection title="Daily Summary">
                <p className="text-base leading-snug text-white/90">{summary}</p>
            </PopoverSection>

            <PopoverSection title="About Precipitation Intensity">
                <p className="text-base leading-snug text-white/90">
                    Intensity describes how much rain or snow falls per hour, and
                    so how heavy it feels. A drizzle or a light shower is Light,
                    steady rain is Moderate, and a downpour or a heavy snowstorm is
                    Heavy. The same scale is used for sleet and mixed
                    precipitation.
                </p>
            </PopoverSection>
        </DetailPopover>
    );
}