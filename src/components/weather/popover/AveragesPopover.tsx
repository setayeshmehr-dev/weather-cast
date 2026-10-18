"use client";

import { ChartLineUp } from "@phosphor-icons/react";
import { useState } from "react";

import DetailPopover from "@/components/weather/popover/DetailPopover";
import NormalRangeChart from "@/components/weather/popover/NormalRangeChart";
import { PopoverSection } from "@/components/weather/popover/Parts";
import type { CurrentWeather, WeatherDetails } from "@/hooks/useWeather";
import type { ClimateNormals } from "@/hooks/useClimateNormals";
import { useMonthlyClimate } from "@/hooks/useMonthlyClimate";
import type { City } from "@/lib/cities";
import { hoursOfDay } from "@/lib/dayLabels";
import { rangeGradient } from "@/lib/temperatureColor";

type Tab = "temperature" | "precipitation";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

function Bone({ className }: { className: string }) {
    return <span className={`block animate-pulse rounded-md bg-white/20 ${className}`} />;
}

type AveragesPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    city: City;
    details: WeatherDetails;
    current: CurrentWeather;
    normals: ClimateNormals | null;
};

export default function AveragesPopover({
    anchor,
    onClose,
    city,
    details,
    current,
    normals,
}: AveragesPopoverProps) {
    const [tab, setTab] = useState<Tab>("temperature");
    const monthly = useMonthlyClimate(city);

    const today = details.days[details.todayIndex];
    const month = Number(today.date.slice(5, 7)) - 1;
    const day = Number(today.date.slice(8, 10));
    const todayHours = hoursOfDay(details, today.date).map((hour) => hour.temperature);

    const high = Math.round(current.max);
    const difference = normals ? high - Math.round(normals.averageHigh) : 0;

    const headline = !normals
        ? null
        : difference > 0
            ? `+${difference}° above average`
            : difference < 0
                ? `${difference}° below average`
                : "At the average";

    const rows = monthly.data;
    const scaleMin = rows ? Math.min(...rows.lows) : 0;
    const scaleMax = rows ? Math.max(...rows.highs) : 1;
    const scaleSpan = Math.max(scaleMax - scaleMin, 1);
    const maxRain = rows ? Math.max(...rows.rain, 1) : 1;

    return (
        <DetailPopover
            anchor={anchor}
            title="Averages"
            icon={<ChartLineUp size={18} weight="regular" />}
            onClose={onClose}
        >
            <div role="tablist" className="mx-4 mt-1 flex rounded-xl bg-white/10 p-1">
                {(["temperature", "precipitation"] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={tab === option}
                        onClick={() => setTab(option)}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize ${
                            tab === option
                                ? "bg-white/25 text-white"
                                : "text-white/70 hover:text-white"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {tab === "temperature" && (
                <>
                    <div className="px-4 pt-4 pb-3">
                        {headline ? (
                            <>
                                <p className="text-2xl font-semibold">{headline}</p>
                                <p className="mt-0.5 text-sm font-medium text-white/60">
                                    Average high: {Math.round(normals!.averageHigh)}°
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Bone className="h-7 w-48" />
                                <Bone className="h-4 w-28" />
                            </div>
                        )}
                    </div>

                    <div className="px-4 pb-3">
                        {normals ? (
                            <NormalRangeChart
                                today={todayHours}
                                low={normals.low}
                                high={normals.high}
                                ariaLabel="Today's temperature compared with the normal range"
                            />
                        ) : (
                            <Bone className="h-48 w-full rounded-xl" />
                        )}

                        {normals && (
                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
                                <span className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-linear-to-b from-[#e3e58a] to-[#8ee3d4]" />
                                    Today
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-[#5f9aa0]" />
                                    Normal Range ({Math.round(normals.rangeMin)}° to{" "}
                                    {Math.round(normals.rangeMax)}°)
                                </span>
                            </div>
                        )}
                    </div>

                    {normals && (
                        <PopoverSection title="Summary">
                            <p className="text-base leading-snug text-white/90">
                                {`For ${MONTHS[month]} ${day}, the normal temperature range is ${Math.round(normals.rangeMin)}° to ${Math.round(normals.rangeMax)}°, and the average high is ${Math.round(normals.averageHigh)}°. Today's high temperature is ${high}°.`}
                            </p>
                        </PopoverSection>
                    )}

                    <PopoverSection
                        title="Monthly Averages"
                        subtitle={
                            rows
                                ? `For ${MONTHS[month]}, the average daily low is ${Math.round(rows.lows[month])}°, and the average daily high is ${Math.round(rows.highs[month])}°.`
                                : undefined
                        }
                    >
                        {monthly.error && (
                            <p className="text-sm text-white/70">{monthly.error}</p>
                        )}

                        {monthly.loading && (
                            <div className="flex flex-col gap-3">
                                {MONTHS.map((name) => (
                                    <Bone key={name} className="h-6 w-full" />
                                ))}
                            </div>
                        )}

                        {rows && (
                            <ul>
                                {MONTHS.map((name, index) => (
                                    <li
                                        key={name}
                                        className="flex items-center gap-3 border-t border-white/10 py-2.5 text-lg first:border-t-0"
                                    >
                                        <span className="w-10 shrink-0 font-semibold">
                                            {name.slice(0, 3)}
                                        </span>
                                        <span className="w-9 shrink-0 text-right text-white/50">
                                            {Math.round(rows.lows[index])}°
                                        </span>

                                        <div className="relative h-1.5 flex-1 rounded-full bg-black/25">
                                            <div
                                                className="absolute inset-y-0 min-w-1 rounded-full"
                                                style={{
                                                    left: `${((rows.lows[index] - scaleMin) / scaleSpan) * 100}%`,
                                                    width: `${((rows.highs[index] - rows.lows[index]) / scaleSpan) * 100}%`,
                                                    backgroundImage: rangeGradient(
                                                        rows.lows[index],
                                                        rows.highs[index]
                                                    ),
                                                }}
                                            />
                                        </div>

                                        <span className="w-9 shrink-0 font-semibold">
                                            {Math.round(rows.highs[index])}°
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PopoverSection>
                </>
            )}

            {tab === "precipitation" && (
                <>
                    <div className="px-4 pt-4 pb-3">
                        {rows ? (
                            <>
                                <p className="text-2xl font-semibold">
                                    {Math.round(rows.rain[month])} mm
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-white/60">
                                    Average precipitation in {MONTHS[month]}
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Bone className="h-7 w-32" />
                                <Bone className="h-4 w-44" />
                            </div>
                        )}
                    </div>

                    <PopoverSection title="Monthly Averages">
                        {monthly.error && (
                            <p className="text-sm text-white/70">{monthly.error}</p>
                        )}

                        {monthly.loading && (
                            <div className="flex flex-col gap-3">
                                {MONTHS.map((name) => (
                                    <Bone key={name} className="h-6 w-full" />
                                ))}
                            </div>
                        )}

                        {rows && (
                            <ul>
                                {MONTHS.map((name, index) => (
                                    <li
                                        key={name}
                                        className={`flex items-center gap-3 border-t border-white/10 py-2.5 text-lg first:border-t-0 ${
                                            index === month ? "rounded-lg bg-white/5" : ""
                                        }`}
                                    >
                                        <span className="w-10 shrink-0 pl-1 font-semibold">
                                            {name.slice(0, 3)}
                                        </span>

                                        <div className="relative h-1.5 flex-1 rounded-full bg-black/25">
                                            <div
                                                className="absolute inset-y-0 left-0 min-w-1 rounded-full bg-[#5ac8fa]"
                                                style={{
                                                    width: `${(rows.rain[index] / maxRain) * 100}%`,
                                                }}
                                            />
                                        </div>

                                        <span className="w-16 shrink-0 pr-1 text-right font-semibold">
                                            {Math.round(rows.rain[index])} mm
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PopoverSection>
                </>
            )}
        </DetailPopover>
    );
}