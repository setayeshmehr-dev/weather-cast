"use client";

import { Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";

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
}: CityCardProps) {
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const menuRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!menu) return;

        const close = () => setMenu(null);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };

        /*
         * Lock body scroll while the Delete menu is open. The overlay
         * catches all pointer events (so the sidebar's own scrollable area
         * is also blocked — wheel/touch events land on the overlay, not on
         * the scroll container below). Setting `overflow: hidden` on body
         * is the belt-and-suspenders for page-level scroll.
         *
         * We snapshot the original inline style and restore it on cleanup
         * so we don't clobber any other inline `overflow` set elsewhere.
         */
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Defer attaching the keydown/blur listeners by one tick so the
        // same right-click gesture that opened the menu doesn't immediately
        // dismiss it via a stray event.
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

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    if (suppressClick) return;
                    onSelect();
                }}
                onContextMenu={canRemove ? handleContextMenu : undefined}
                aria-current={selected ? "true" : undefined}
                aria-label={`${city.name}${summary ? `, ${summary.condition}` : ""}`}
                className={`relative isolate flex h-24 w-full flex-col justify-between overflow-hidden rounded-2xl p-3 text-left text-white ${
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
                        <p className="truncate text-lg leading-tight font-semibold">
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
                        <p className="text-4xl leading-none font-light">
                            {Math.round(summary.temperature)}°
                        </p>
                    ) : (
                        <Bone className="h-9 w-14 rounded-lg" />
                    )}
                </div>

                <div className="relative z-20 flex items-end justify-between gap-2 text-xs">
                    {summary ? (
                        <>
                            <span className="truncate">{summary.condition}</span>
                            <span className="shrink-0">
                                {`H:${Math.round(summary.max)}° L:${Math.round(summary.min)}°`}
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

            {/*
             * Right-click "Delete" menu with modal-style behavior.
             *
             * Two layers are rendered into a portal on document.body:
             *
             *   1. An invisible overlay (`fixed inset-0 z-40`) that catches
             *      ALL pointer events anywhere on the page — left-click,
             *      right-click, touch, wheel — until the menu is dismissed.
             *      `touch-none` (touch-action: none) prevents touch scroll
             *      from passing through to the sidebar's scrollable area.
             *      `onContextMenu` is prevented so the browser's native
             *      right-click menu doesn't pop up on top of our Delete button.
             *
             *   2. The Delete button itself (`fixed z-50`), one z-layer
             *      above the overlay. Pointer events on the button call
             *      `handleDelete`; pointer events anywhere else land on the
             *      overlay and dismiss the menu.
             *
             * Body scroll is also locked via `document.body.style.overflow
             * = "hidden"` in the useEffect above — that catches any
             * keyboard-driven scroll (Page Down, Space) that the overlay
             * wouldn't intercept.
             */}
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