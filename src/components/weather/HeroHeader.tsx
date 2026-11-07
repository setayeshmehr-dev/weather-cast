
"use client";

import type { ReactNode } from "react";
import { useFormat } from "@/hooks/useFormat";

import type { CurrentWeather } from "@/hooks/useWeather";
import {
    HERO_LINE_HEIGHT,
    HERO_NAME_HEIGHT,
    HERO_TEMP_HEIGHT,
    HERO_TOP,
} from "@/lib/heroScroll";

type LineProps = {
    variable: string;
    height: number;
    direction: "out" | "in";
    hidden?: boolean;
    children: ReactNode;
};

function Line({
    variable,
    height,
    direction,
    hidden,
    children,
}: LineProps) {
    const opacity =
        direction === "out"
            ? `clamp(0, calc(var(${variable}) * 2 - 0.6), 1)`
            : `clamp(0, calc(var(${variable}) * 2 - 0.8), 1)`;

    return (
        <div
            aria-hidden={hidden}
            className="flex w-full justify-center overflow-hidden"
            style={{
                height: `calc(${height}px * var(${variable}))`,
                opacity,
                willChange: "height, opacity",
            }}
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
    const fmt = useFormat();

    return (
        <div
            className="flex flex-col items-center text-center text-white"
            style={{ paddingTop: HERO_TOP }}
        >
            <h1
                className="w-full max-w-full truncate px-14 text-[34px]"
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
            ) : loading || !current ? (
                <p className="mt-3 text-white/70">Loading weather...</p>
            ) : (
                <>
                    <Line
                        variable="--hero-temp"
                        height={HERO_TEMP_HEIGHT}
                        direction="out"
                    >
                        <span className="relative inline-block whitespace-nowrap text-[96px] font-extralight tabular-nums">
                            {fmt.temperature(current.temperature)}
                            <span
                                aria-hidden="true"
                                className="absolute left-full top-[0.08em] text-[0.55em] font-extralight leading-none"
                            >
                                °
                            </span>
                        </span>
                    </Line>

                    <Line
                        variable="--hero-status"
                        height={HERO_LINE_HEIGHT}
                        direction="out"
                    >
                        <span className="text-xl font-semibold text-white/90">
                            {current.condition}
                        </span>
                    </Line>

                    <Line
                        variable="--hero-high-low"
                        height={HERO_LINE_HEIGHT}
                        direction="out"
                    >
                        <span className="whitespace-nowrap text-xl font-semibold tabular-nums text-white/85">
                            H:{fmt.temperature(current.max)}° L:{fmt.temperature(current.min)}°
                        </span>
                    </Line>

                    <Line
                        variable="--hero-compact"
                        height={HERO_LINE_HEIGHT}
                        direction="in"
                        hidden
                    >
                        <span className="flex items-center whitespace-nowrap text-xl font-semibold tabular-nums">
                            {fmt.temperature(current.temperature)}°
                            <span className="mx-3 h-5 w-0.5 rounded-full bg-white/90" />
                            <span className="text-white/90">
                                {current.condition}
                            </span>
                        </span>
                    </Line>
                </>
            )}
        </div>
    );
}
