"use client";

import type { ReactNode } from "react";

import type { CurrentWeather } from "@/hooks/useWeather";
import {
    HERO_LINE_HEIGHT,
    HERO_NAME_HEIGHT,
    HERO_TEMP_HEIGHT,
    HERO_TOP,
} from "@/lib/heroScroll";

// true: the line under the temperature is "Feels Like: 43°" (as in the reference);
// false: it is the weather condition ("Partly cloudy").
const SHOW_FEELS_LIKE = true;

type LineProps = {
    /** CSS variable (set by the scroll layout) with the share of the line still shown. */
    variable: string;
    height: number;
    /** "out": the line leaves (1 -> 0). "in": the line arrives (0 -> 1). */
    direction: "out" | "in";
    hidden?: boolean;
    children: ReactNode;
};

/*
 * A line that collapses with the scroll. Its opacity changes faster than its height,
 * so the text fades before it is cut off.
 */
function Line({ variable, height, direction, hidden, children }: LineProps) {
    const opacity =
        direction === "out"
            ? `clamp(0, calc(var(${variable}) * 2 - 0.6), 1)`
            : `clamp(0, calc(var(${variable}) * 2 - 0.8), 1)`;

    return (
        <div
            aria-hidden={hidden}
            className="flex w-full justify-center overflow-hidden"
            style={{ height: `calc(${height}px * var(${variable}))`, opacity }}
        >
            <div
                className="flex shrink-0 items-start justify-center"
                style={{ height, lineHeight: `${height}px` }}
            >
                {children}
            </div>
        </div>
    );
}

type HeroHeaderProps = {
    cityName: string;
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
};

export default function HeroHeader({
    cityName,
    current,
    loading,
    error,
    onRetry,
}: HeroHeaderProps) {
    const status = current
        ? SHOW_FEELS_LIKE
            ? { label: "Feels Like:", value: `${Math.round(current.feelsLike)}°` }
            : { label: "", value: current.condition }
        : null;

    return (
        <div
            className="flex flex-col items-center text-center text-white"
            style={{ paddingTop: HERO_TOP }}
        >
            <h1
                className="max-w-full truncate px-14 text-[34px]"
                style={{
                    height: HERO_NAME_HEIGHT,
                    lineHeight: `${HERO_NAME_HEIGHT}px`,
                }}
            >
                {cityName}
            </h1>

            {error ? (
                <div
                    role="alert"
                    className="mt-3 flex flex-col items-center gap-3 text-white/80"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={onRetry}
                        className="pointer-events-auto rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/25"
                    >
                        Try again
                    </button>
                </div>
            ) : loading || !current || !status ? (
                <p className="mt-3 text-white/70">Loading weather...</p>
            ) : (
                <>
                    <Line
                        variable="--hero-temp"
                        height={HERO_TEMP_HEIGHT}
                        direction="out"
                    >
                        <span className="text-[96px] font-extralight">
                            {Math.round(current.temperature)}°
                        </span>
                    </Line>

                    <Line
                        variable="--hero-status"
                        height={HERO_LINE_HEIGHT}
                        direction="out"
                    >
                        <span className="text-xl font-semibold">
                            {status.label && (
                                <span className="text-white/85">{status.label} </span>
                            )}
                            {status.value}
                        </span>
                    </Line>

                    <Line
                        variable="--hero-high-low"
                        height={HERO_LINE_HEIGHT}
                        direction="out"
                    >
                        <span className="text-xl font-semibold text-white/85">
                            H:{Math.round(current.max)}° L:{Math.round(current.min)}°
                        </span>
                    </Line>

                    {/* The one-line version: it replaces the big temperature and the status. */}
                    <Line
                        variable="--hero-compact"
                        height={HERO_LINE_HEIGHT}
                        direction="in"
                        hidden
                    >
                        <span className="flex items-center text-xl font-semibold">
                            {Math.round(current.temperature)}°
                            <span className="mx-3 h-5 w-0.5 rounded-full bg-white/90" />
                            {status.label && (
                                <span className="mr-1.5 text-white/85">{status.label}</span>
                            )}
                            {status.value}
                        </span>
                    </Line>
                </>
            )}
        </div>
    );
}