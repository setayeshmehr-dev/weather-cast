"use client";

import { X } from "@phosphor-icons/react";

import type { CitySummary } from "@/hooks/useCitySummaries";
import type { City } from "@/lib/cities";
import { getWeatherBackground } from "@/lib/weatherBackground";

const PLACEHOLDER_BACKGROUND =
    "linear-gradient(160deg, #3b4a63 0%, #566580 100%)";

function localTime(summary: CitySummary, now: number | null): string {
    if (now === null) return summary.time.slice(11, 16);

    return new Date(now + summary.utcOffsetSeconds * 1000)
        .toISOString()
        .slice(11, 16);
}

type CityCardProps = {
    city: City;
    summary: CitySummary | undefined;
    now: number | null;
    selected: boolean;
    canRemove: boolean;
    onSelect: () => void;
    onRemove: () => void;
};

export default function CityCard({
    city,
    summary,
    now,
    selected,
    canRemove,
    onSelect,
    onRemove,
}: CityCardProps) {
    return (
        <div className="group relative">
            <button
                type="button"
                onClick={onSelect}
                aria-current={selected ? "true" : undefined}
                className={`flex h-24 w-full flex-col justify-between rounded-2xl p-3 text-left text-white ${
                    selected ? "ring-2 ring-white/70" : ""
                }`}
                style={{
                    background: summary
                        ? getWeatherBackground(summary.weatherCode, summary.isDay)
                        : PLACEHOLDER_BACKGROUND,
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-lg leading-tight font-semibold">
                            {city.name}
                        </p>
                        <p className="text-xs text-white/80">
                            {summary ? localTime(summary, now) : "\u00a0"}
                        </p>
                    </div>

                    <p className="text-4xl leading-none font-light">
                        {summary ? `${Math.round(summary.temperature)}°` : "--°"}
                    </p>
                </div>

                <div className="flex items-end justify-between gap-2 text-xs">
                    <span className="truncate">{summary?.condition ?? ""}</span>
                    <span className="shrink-0">
                        {summary
                            ? `H:${Math.round(summary.max)}° L:${Math.round(summary.min)}°`
                            : ""}
                    </span>
                </div>
            </button>

            {canRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${city.name}`}
                    className="absolute -top-1.5 -left-1.5 hidden size-5 items-center justify-center rounded-full bg-black/60 text-white group-focus-within:flex group-hover:flex hover:bg-black/80"
                >
                    <X size={11} weight="bold" />
                </button>
            )}
        </div>
    );
}