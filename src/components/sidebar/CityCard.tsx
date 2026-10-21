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
    // Viewport coordinates of the right-click that opened the Delete menu.
    // `null` when the menu is closed.
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const menuRef = useRef<HTMLButtonElement | null>(null);

    // Close on Escape, on outside pointerdown, on blur, and on scroll.
    useEffect(() => {
        if (!menu) return;

        const close = () => setMenu(null);

        const handlePointerDown = (event: PointerEvent) => {
            // Pointer is on the menu itself — let the menu's own click
            // handler take it. Otherwise, this is an outside click → close.
            if (menuRef.current?.contains(event.target as Node)) return;
            close();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };

        // Defer attaching the listeners by one tick so the same right-click
        // gesture that opened the menu doesn't immediately close it (the
        // pointerdown that follows the contextmenu event would otherwise
        // trigger `handlePointerDown` and close the menu the instant it opens).
        const id = window.setTimeout(() => {
            document.addEventListener("pointerdown", handlePointerDown);
            document.addEventListener("keydown", handleKeyDown);
            window.addEventListener("blur", close);
            window.addEventListener("scroll", close, { passive: true });
        }, 0);

        return () => {
            window.clearTimeout(id);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("blur", close);
            window.removeEventListener("scroll", close);
        };
    }, [menu]);

    const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
        if (!canRemove) return;
        // Suppress the native browser context menu and open our Delete
        // affordance pinned to the exact viewport coordinates of the click.
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
                onClick={onSelect}
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
             * Right-click "Delete" affordance.
             *
             * Rendered via a portal into document.body so it isn't clipped by
             * the card's `overflow-hidden`. Pinned to the exact viewport
             * coordinates of the right-click (`event.clientX/clientY`), with a
             * small `translate(8px, -50%)` so the cursor lands just inside the
             * button's left edge and the button is vertically centered on the
             * click point — same UX as a native context menu.
             *
             * The frosted dark glass treatment matches the DetailPopover
             * aesthetic and stays readable over any weather video.
             */}
            {menu &&
                createPortal(
                    <button
                        ref={menuRef}
                        type="button"
                        onClick={handleDelete}
                        onPointerDown={(event) => event.stopPropagation()}
                        className="fixed z-50 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-colors duration-150 hover:bg-black/80 supports-[backdrop-filter]:bg-black/55 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:hover:bg-black/65"
                        style={{
                            left: menu.x,
                            top: menu.y,
                            transform: "translate(8px, -50%)",
                        }}
                    >
                        <Trash size={12} weight="light" />
                        Delete
                    </button>,
                    document.body
                )}
        </div>
    );
}