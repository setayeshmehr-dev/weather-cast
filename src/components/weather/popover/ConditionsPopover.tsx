"use client";

import { Cloud } from "@phosphor-icons/react";
import { useState } from "react";

import DayChart from "@/components/weather/popover/DayChart";
import DayPicker from "@/components/weather/popover/DayPicker";
import DetailPopover from "@/components/weather/popover/DetailPopover";
import {
    PopoverHeadline,
    PopoverSection,
    RangeRow,
} from "@/components/weather/popover/Parts";
import WeatherIcon from "@/components/weather/WeatherIcon";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import { getWeatherCondition, getWeatherIcon } from "@/hooks/useWeather";
import { niceTicks } from "@/lib/chart";
import {
    bareLabel,
    hourFraction,
    hoursOfDay,
    relativeLabel,
    sentenceLabel,
    weekdayLong,
} from "@/lib/dayLabels";
import { temperatureColor } from "@/lib/temperatureColor";

type Mode = "actual" | "feels";

const PRECIPITATION_TICKS = [0, 20, 40, 60, 80, 100];
const SKY = "#4cc2ff";

const formatMm = (value: number) => (value < 0.05 ? "0" : value.toFixed(1));

function compare(value: number, previous: number): string {
    const difference = Math.round(value) - Math.round(previous);

    if (difference >= 2) return "higher than";
    if (difference <= -2) return "lower than";
    return "similar to";
}

type ConditionsPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    details: WeatherDetails;
    current: CurrentWeather;
    initialDate: string;
};

export default function ConditionsPopover({
    anchor,
    onClose,
    details,
    current,
    initialDate,
}: ConditionsPopoverProps) {
    const todayDate = details.days[details.todayIndex].date;

    const [date, setDate] = useState(initialDate);
    const [mode, setMode] = useState<Mode>("actual");

    const index = Math.max(details.days.findIndex((item) => item.date === date), 0);
    const day = details.days[index];
    const previous = index > 0 ? details.days[index - 1] : null;
    const isToday = day.date === todayDate;
    const hours = hoursOfDay(details, day.date);

    const temperatures = hours.map((hour) =>
        mode === "actual" ? hour.temperature : hour.apparentTemperature
    );
    const feels = hours.map((hour) => hour.apparentTemperature);

    const low = Math.min(...temperatures);
    const high = Math.max(...temperatures);
    const ticks = niceTicks(low, high, 6);

    const feelsLow = Math.round(Math.min(...feels));
    const feelsHigh = Math.round(Math.max(...feels));
    const dayTotal = hours.reduce((sum, hour) => sum + hour.precipitation, 0);

    const condition = getWeatherCondition(
        isToday ? current.weatherCode : day.weatherCode
    ).toLowerCase();

    const feelsDifference = Math.abs(current.feelsLike - current.temperature);

    const forecast = isToday
        ? `${Math.round(current.temperature)}° now and ${condition}.` +
          (feelsDifference >= 1
              ? ` It feels like ${Math.round(current.feelsLike)}°.`
              : "") +
          ` Today's temperature range is from ${Math.round(day.min)}° to ${Math.round(day.max)}° and feels like ${feelsLow}° to ${feelsHigh}°.`
        : `Expect ${condition} ${sentenceLabel(day.date, todayDate)}. The temperature range is from ${Math.round(day.min)}° to ${Math.round(day.max)}° and feels like ${feelsLow}° to ${feelsHigh}°.`;

    const scaleMin = Math.min(day.min, previous?.min ?? day.min) - 1;
    const scaleMax = Math.max(day.max, previous?.max ?? day.max) + 1;

    return (
        <DetailPopover
            anchor={anchor}
            title="Conditions"
            icon={<Cloud size={18} weight="fill" />}
            onClose={onClose}
        >
            <DayPicker
                days={details.days}
                selectedDate={day.date}
                todayDate={todayDate}
                onSelect={setDate}
            />

            <PopoverHeadline
                value={`${Math.round(isToday ? current.temperature : day.max)}°`}
                caption={`H:${Math.round(day.max)}° L:${Math.round(day.min)}°`}
                extra={
                    <WeatherIcon
                        slug={
                            isToday
                                ? getWeatherIcon(current.weatherCode, current.isDay)
                                : getWeatherIcon(day.weatherCode, true)
                        }
                        label="Weather"
                        size={38}
                    />
                }
            />

            <div className="px-4">
                <DayChart
                    values={temperatures}
                    ticks={ticks}
                    formatTick={(value) => `${Math.round(value)}°`}
                    colorAt={temperatureColor}
                    nowHour={isToday ? hourFraction(current.time) : null}
                    markers={[
                        { index: temperatures.indexOf(high), label: "H" },
                        { index: temperatures.indexOf(low), label: "L" },
                    ]}
                    renderTop={(hour) => (
                        <WeatherIcon
                            slug={getWeatherIcon(
                                hours[hour]?.weatherCode ?? 3,
                                hours[hour]?.isDay ?? true
                            )}
                            label="Hourly weather"
                            size={22}
                        />
                    )}
                    ariaLabel={`Temperature chart for ${weekdayLong(day.date)}`}
                />

                <div
                    role="tablist"
                    className="mt-3 flex rounded-xl bg-white/10 p-1"
                >
                    {(["actual", "feels"] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="tab"
                            aria-selected={mode === option}
                            onClick={() => setMode(option)}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                                mode === option
                                    ? "bg-white/25 text-white"
                                    : "text-white/70 hover:text-white"
                            }`}
                        >
                            {option === "actual" ? "Actual" : "Feels Like"}
                        </button>
                    ))}
                </div>

                <p className="mt-3 pb-4 text-sm text-white/70">
                    {mode === "actual"
                        ? "The actual temperature."
                        : "How the temperature feels, with wind and humidity taken into account."}
                </p>
            </div>

            <PopoverSection
                title="Chance of Precipitation"
                subtitle={`${isToday ? "Today" : weekdayLong(day.date)}'s chance: ${Math.round(day.precipitationChance)}%`}
            >
                <DayChart
                    values={hours.map((hour) => hour.precipitationChance)}
                    ticks={PRECIPITATION_TICKS}
                    formatTick={(value) => `${value}%`}
                    colorAt={() => SKY}
                    height={110}
                    fade
                    nowHour={isToday ? hourFraction(current.time) : null}
                    ariaLabel="Chance of precipitation by hour"
                />

                <p className="mt-3 text-sm text-white/60">
                    The daily chance of precipitation tends to be higher than the
                    chance for each hour.
                </p>
            </PopoverSection>

            <PopoverSection title="Precipitation Totals">
                {isToday ? (
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
                ) : (
                    <div>
                        <p className="text-xs font-medium tracking-wide text-white/60">
                            {weekdayLong(day.date).toUpperCase()}
                        </p>
                        <p className="flex justify-between text-lg font-semibold">
                            Precipitation
                            <span>{formatMm(dayTotal)} mm</span>
                        </p>
                    </div>
                )}
            </PopoverSection>

            <PopoverSection title="Forecast">
                <p className="text-base leading-snug text-white/90">{forecast}</p>
            </PopoverSection>

            {previous && (
                <PopoverSection title="Daily Comparison">
                    <p className="text-base text-white/90">
                        {`The high temperature ${sentenceLabel(day.date, todayDate)} is ${compare(day.max, previous.max)} ${bareLabel(previous.date, todayDate)}.`}
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
                        <RangeRow
                            label={relativeLabel(day.date, todayDate)}
                            min={day.min}
                            max={day.max}
                            scaleMin={scaleMin}
                            scaleMax={scaleMax}
                            dot={isToday ? current.temperature : undefined}
                        />

                        <RangeRow
                            label={relativeLabel(previous.date, todayDate)}
                            min={previous.min}
                            max={previous.max}
                            scaleMin={scaleMin}
                            scaleMax={scaleMax}
                        />
                    </div>
                </PopoverSection>
            )}
        </DetailPopover>
    );
}