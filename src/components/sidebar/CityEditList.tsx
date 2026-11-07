
"use client";

import { List, Minus } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { useLayoutEffect, useRef } from "react";

import CityCard from "@/components/sidebar/CityCard";
import { useDragReorder } from "@/hooks/useDragReorder";
import type { CitySummary } from "@/hooks/useCitySummaries";
import type { City } from "@/lib/cities";

const MOVE_MS = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type CityEditListProps = {
    cities: City[];
    selectedCity: City;
    summaries: Record<string, CitySummary>;
    now: number | null;
    onMove: (from: number, to: number) => void;
    onRemove: (id: string) => void;
};

export default function CityEditList({
    cities,
    selectedCity,
    summaries,
    now,
    onMove,
    onRemove,
}: CityEditListProps) {
    const rows = useRef(new Map<string, HTMLLIElement>());
    const tops = useRef(new Map<string, number>());

    const drag = useDragReorder(cities, onMove);

    const draggedCity = cities.find(
        (city) => city.id === drag.draggingId
    );

    const visibleCities = drag.draggingId
        ? cities.filter((city) => city.id !== drag.draggingId)
        : cities;

    const displayItems: (City | null)[] = [...visibleCities];

    if (drag.draggingId && drag.dropIndex !== null) {
        displayItems.splice(drag.dropIndex, 0, null);
    }

    useLayoutEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const next = new Map<string, number>();

        rows.current.forEach((element, id) => {
            next.set(id, element.offsetTop);
        });

        next.forEach((top, id) => {
            const element = rows.current.get(id);

            if (!element || reduceMotion) return;

            const before = tops.current.get(id);

            if (before === undefined) {
                element.animate(
                    [
                        { opacity: 0, transform: "scale(0.96)" },
                        { opacity: 1, transform: "scale(1)" },
                    ],
                    {
                        duration: 240,
                        easing: EASING,
                    }
                );

                return;
            }

            if (before === top) return;

            element.animate(
                [
                    { transform: `translateY(${before - top}px)` },
                    { transform: "translateY(0)" },
                ],
                {
                    duration: MOVE_MS,
                    easing: EASING,
                }
            );
        });

        tops.current = next;
    });

    return (
        <>
            <ul className="relative flex flex-col gap-4">
                {displayItems.map((city, index) => {
                    if (!city) {
                        return (
                            <li
                                key="drop-placeholder"
                                className="h-21 shrink-0 rounded-2xl border-2 border-dashed border-white/30 bg-white/5"
                            />
                        );
                    }

                    return (
                        <li
                            key={city.id}
                            ref={(element) => {
                                if (element) {
                                    rows.current.set(city.id, element);
                                } else {
                                    rows.current.delete(city.id);
                                }
                            }}
                            data-draggable-id={city.id}
                            className="flex flex-1 h-21 shrink-0 gap-2"
                        >
                            <div className=" flex w-6 shrink-0 items-center justify-center">
                                <button
                                    type="button"
                                    aria-label={`Delete ${city.name}`}
                                    onClick={() => onRemove(city.id)}
                                    className="flex aspect-square w-4 items-center justify-center rounded-full bg-red-700 text-white transition-colors hover:bg-red-600"
                                >
                                    <Minus size={13} weight="bold" />
                                </button>
                            </div>

                            <div className="min-w-0 flex-1">
                                <CityCard
                                    city={city}
                                    summary={summaries[city.id]}
                                    now={now}
                                    selected={city.id === selectedCity.id}
                                    canRemove={false}
                                    onSelect={() => {}}
                                    onRemove={() => {}}
                                    compact
                                />
                            </div>

                            <div className="flex w-6 shrink-0 items-center justify-center">
                                <button
                                    type="button"
                                    aria-label={`Reorder ${city.name}`}
                                    onPointerDown={(event) =>
                                        drag.onItemPointerDown(city.id, event)
                                    }
                                    className="flex h-full w-full touch-none cursor-grab items-center justify-center text-white/50 transition-colors hover:text-white active:cursor-grabbing"
                                >
                                    <List size={25} weight="regular" />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {draggedCity &&
                drag.pointerPosition &&
                drag.cardRect &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        className="pointer-events-none fixed z-9999"
                        style={{
                            left:
                                drag.pointerPosition.x -
                                drag.pointerOffset.x,
                            top:
                                drag.pointerPosition.y -
                                drag.pointerOffset.y,
                            width: drag.cardRect.width,
                            height: drag.cardRect.height,
                        }}
                    >
                        <div className="h-full scale-[1.02] opacity-95 shadow-2xl">
                            <CityCard
                                city={draggedCity}
                                summary={summaries[draggedCity.id]}
                                now={now}
                                selected={
                                    draggedCity.id === selectedCity.id
                                }
                                canRemove={false}
                                onSelect={() => {}}
                                onRemove={() => {}}
                                compact
                            />
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
