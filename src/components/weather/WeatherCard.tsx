"use client";

import type { PointerEvent, ReactNode } from "react";

import CardSkeleton from "@/components/weather/CardSkeleton";
import type { CardSkeletonVariant } from "@/components/weather/CardSkeleton";
import { useWeatherLoading } from "@/components/weather/WeatherLoadingContext";

type WeatherCardProps = {
    title: ReactNode;
    icon?: ReactNode;
    divided?: boolean;
    flush?: boolean;
    /** Overrides the dashboard loading state (from the context). */
    loading?: boolean;
    /** Shape of the loading skeleton; "none" keeps the content visible while loading. */
    skeleton?: CardSkeletonVariant | "none";
    className?: string;
    bodyClassName?: string;
    /** Drawn over the card, outside its clipped body (for example scroll arrows). */
    overlay?: ReactNode;
    onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
    children?: ReactNode;
};

/*
 * The glass frame, the header and the body are separate layers: while the page scrolls
 * WeatherScrollLayout moves the header, shrinks the frame and clips the body (see there),
 * without changing the size of the card in the grid.
 */
export default function WeatherCard({
    title,
    icon,
    divided = false,
    flush = false,
    loading,
    skeleton = "stat",
    className = "",
    bodyClassName = "",
    overlay,
    onPointerEnter,
    onPointerLeave,
    children,
}: WeatherCardProps) {
    const dashboardLoading = useWeatherLoading();
    const showSkeleton = (loading ?? dashboardLoading) && skeleton !== "none";

    const bodySpacing = flush ? "" : divided ? "pt-3" : "mt-3";

    return (
        <section
            data-weather-card=""
            aria-label={typeof title === "string" ? title : "Weather card"}
            aria-busy={showSkeleton}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            className={`group/card relative isolate flex min-h-0 min-w-0 flex-col p-(--card-pad) text-white [--card-pad:12px] @min-[624px]:[--card-pad:10px] ${className}`}
        >
            <div
                data-card-frame=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 bottom-0 -z-10 rounded-[18px] border border-white/20 bg-black/10 backdrop-blur-lg"
            />

            <h2
                data-card-header=""
                className={`pointer-events-auto relative z-10 flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60 will-change-transform ${
                    divided ? "border-b border-white/15 pb-2" : ""
                }`}
            >
                {icon}
                {title}
            </h2>

            <div
                data-card-body=""
                className={`pointer-events-auto @container min-h-0 flex-1 overflow-hidden ${bodySpacing} ${bodyClassName}`}
            >
                {showSkeleton && <CardSkeleton variant={skeleton} />}

                <div className={showSkeleton ? "hidden" : "contents"}>
                    {children}
                </div>
            </div>

            {overlay && (
                <div className="contents group-data-collapsed/card:hidden">
                    {overlay}
                </div>
            )}
        </section>
    );
}