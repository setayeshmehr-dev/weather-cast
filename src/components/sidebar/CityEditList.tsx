
"use client";

import { CaretDown, CaretUp, Trash } from "@phosphor-icons/react";
import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import CityCard from "@/components/sidebar/CityCard";
import type { CitySummary } from "@/hooks/useCitySummaries";
import type { City } from "@/lib/cities";

const MOVE_MS = 340;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type RowButtonProps = {
    label: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
    children: ReactNode;
};

function RowButton({
    label,
    disabled,
    danger,
    onClick,
    children,
}: RowButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`flex min-h-0 aspect-square rounded-full items-center justify-center bg-white/10 text-white transition-colors duration-200 disabled:opacity-30 ${
                danger
                    ? "enabled:hover:bg-red-700"
                    : "enabled:hover:bg-white/25"
            }`}
        >
            {children}
        </button>
    );
}

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
        <ul className="relative flex flex-col gap-4">
            {cities.map((city, index) => (
                <li
                    key={city.id}
                    ref={(element) => {
                        if (element) {
                            rows.current.set(city.id, element);
                        } else {
                            rows.current.delete(city.id);
                        }
                    }}
                    className="flex h-21 gap-2"
                >
                    <div className="flex w-6 shrink-0 m-1 items-center justify-center">
                        <RowButton
                            label={`Delete ${city.name}`}
                            danger
                            onClick={() => onRemove(city.id)}
                        >
                            <Trash size={16} weight="bold" className="m-2" />
                        </RowButton>
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

                    <div className="flex w-6 shrink-0 flex-col justify-center gap-3">
                        <RowButton
                            label={`Move ${city.name} up`}
                            disabled={index === 0}
                            onClick={() => onMove(index, index - 1)}
                        >
                            <CaretUp size={16} weight="bold" />
                        </RowButton>

                        <RowButton
                            label={`Move ${city.name} down`}
                            disabled={index === cities.length - 1}
                            onClick={() => onMove(index, index + 1)}
                        >
                            <CaretDown size={16} weight="bold" />
                        </RowButton>
                    </div>
                </li>
            ))}
        </ul>
    );
}
