
"use client";

import { Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useFormat } from "@/hooks/useFormat";
import WeatherVideo from "@/components/weather/WeatherVideo";
import type { CitySummary } from "@/hooks/useCitySummaries";
import type { City } from "@/lib/cities";
import { getWeatherBackground } from "@/lib/weatherBackground";
import { getWeatherVideoName } from "@/lib/weatherVideo";

const PLACEHOLDER_BACKGROUND =
    "linear-gradient(160deg, #3b4a63 0%, #566580 100%)";

function localTime(summary: CitySummary, now: number | null): string {
    if (now === null) return summary.time.slice(11, 16);

    return new Date(now + summary.utcOffsetSeconds * 1000)
        .toISOString()
        .slice(11, 16);
}

function Bone({ className }: { className: string }) {
    return (
        <span
            className={`block animate-pulse rounded-md bg-white/25 ${className}`}
        />
    );
}

type CityCardProps = {
    city: City;
    summary: CitySummary | undefined;
    now: number | null;
    selected: boolean;
    canRemove: boolean;
    onSelect: () => void;
    onRemove: () => void;
    suppressClick?: boolean;
    compact?: boolean;
};

export default function CityCard({
    city,
    summary,
    now,
    selected,
    canRemove,
    onSelect,
    onRemove,
    suppressClick = false,
    compact = false,
}: CityCardProps) {
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const menuRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!menu) return;

        const close = () => setMenu(null);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const id = window.setTimeout(() => {
            document.addEventListener("keydown", handleKeyDown);
            window.addEventListener("blur", close);
        }, 0);

        return () => {
            window.clearTimeout(id);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("blur", close);
            document.body.style.overflow = originalOverflow;
        };
    }, [menu]);

    const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
        if (!canRemove) return;

        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
    };

    const handleDelete = () => {
        setMenu(null);
        onRemove();
    };

    const fmt = useFormat();

    return (
        <div className="relative h-full">
            <button
                type="button"
                onClick={() => {
                    if (suppressClick) return;
                    onSelect();
                }}
                onContextMenu={canRemove ? handleContextMenu : undefined}
                aria-current={selected ? "true" : undefined}
                aria-label={`${city.name}${summary ? `, ${summary.condition}` : ""}`}
                className={`relative isolate flex ${
                    compact ? "h-full" : "h-24"
                } w-full flex-col justify-between overflow-hidden rounded-2xl p-3 text-left text-white ${
                    selected ? "ring-3 ring-white/30" : ""
                }`}
                style={{
                    background: summary
                        ? getWeatherBackground(summary.weatherCode, summary.isDay)
                        : PLACEHOLDER_BACKGROUND,
                }}
            >
                {summary && (
                    <WeatherVideo
                        name={getWeatherVideoName(
                            summary.weatherCode,
                            summary.isDay,
                            summary.cloudCover,
                        )}
                        variant="card"
                        className="z-0"
                    />
                )}

                <span className="pointer-events-none absolute inset-0 z-10 bg-black/20" />

                <div className="relative z-20 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p
                            className={`truncate leading-tight font-semibold ${
                                compact ? "text-base" : "text-lg"
                            }`}
                        >
                            {city.name}
                        </p>

                        {summary ? (
                            <p className="text-xs text-white/80">
                                {localTime(summary, now)}
                            </p>
                        ) : (
                            <Bone className="mt-1.5 h-3 w-10" />
                        )}
                    </div>

                    {summary ? (
                        <p
                            className={`leading-none font-light ${
                                compact ? "text-3xl" : "text-4xl"
                            }`}
                        >
                            {fmt.temperature(summary.temperature)}°
                        </p>
                    ) : (
                        <Bone className="h-9 w-14 rounded-lg" />
                    )}
                </div>

                <div className="relative z-20 flex items-end justify-between gap-2 text-xs">
                    {summary ? (
                        <>
                            <span className="truncate">
                                {summary.condition}
                            </span>
                            <span className="shrink-0">
                                {`H:${fmt.temperature(summary.max)}° L:${fmt.temperature(summary.min)}°`}
                            </span>
                        </>
                    ) : (
                        <>
                            <Bone className="h-3 w-16" />
                            <Bone className="h-3 w-20" />
                        </>
                    )}
                </div>
            </button>

            {menu &&
                createPortal(
                    <>
                        <div
                            aria-hidden="true"
                            className="fixed inset-0 z-40 touch-none"
                            onPointerDown={() => setMenu(null)}
                            onContextMenu={(event) => event.preventDefault()}
                        />

                        <button
                            ref={menuRef}
                            type="button"
                            onClick={handleDelete}
                            onContextMenu={(event) => event.preventDefault()}
                            className="fixed z-50 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-colors duration-150 hover:bg-black/80 supports-backdrop-filter:bg-black/55 supports-backdrop-filter:backdrop-blur-md supports-backdrop-filter:hover:bg-black/65"
                            style={{
                                left: menu.x,
                                top: menu.y,
                                transform: "translate(8px, -50%)",
                            }}
                        >
                            <Trash size={14} weight="fill" />
                            Delete
                        </button>
                    </>,
                    document.body
                )}
        </div>
    );
}
