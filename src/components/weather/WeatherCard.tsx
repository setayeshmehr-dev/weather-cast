"use client";

import type { CSSProperties, ReactNode } from "react";

import CardSkeleton from "@/components/weather/CardSkeleton";
import type { CardSkeletonVariant } from "@/components/weather/CardSkeleton";
import { useWeatherLoading } from "@/components/weather/WeatherLoadingContext";

/*
 * While the page scrolls, the scroll layout sets these variables on the card (see
 * WeatherScrollLayout): the header is pinned under the page header, the glass frame
 * shrinks from below, and the card fades once it is only a capsule.
 *
 * `willChange` is set so the browser promotes these layers to the GPU and avoids
 * repainting them every frame — this is what removes the jank.
 */
const FRAME_STYLE: CSSProperties = {
    top: "var(--card-shift, 0px)",
    bottom: "var(--card-bottom, 0px)",
    opacity: "var(--card-opacity, 1)",
    willChange: "top, bottom, opacity",
};

const HEADER_STYLE: CSSProperties = {
    transform: "translateY(var(--card-shift, 0px))",
    opacity: "var(--card-opacity, 1)",
    willChange: "transform, opacity",
};

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
    children?: ReactNode;
};

export default function WeatherCard({
    title,
    icon,
    divided = false,
    flush = false,
    loading,
    skeleton = "stat",
    className = "",
    bodyClassName = "",
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
            className={`relative isolate  flex min-h-0 min-w-0 flex-col p-(--card-pad) text-white [--card-pad:12px] @min-[624px]:[--card-pad:10px] ${className}`}
        >
            {/* The glass frame: a separate layer, so it can shrink without moving the grid. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute  inset-x-0 -z-10 rounded-[18px] border border-white/20 bg-black/10 backdrop-blur-md"
                style={FRAME_STYLE}
            />

            <h2
                data-card-header=""
                style={HEADER_STYLE}
                className={`pointer-events-auto relative z-10 flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60 ${
                    divided ? "border-b border-white/15 pb-2" : ""
                }`}
            >
                {icon}
                {title}
            </h2>

            <div
                data-card-body=""
                className={`pointer-events-auto @container min-h-0 flex-1 overflow-hidden ${bodySpacing} ${bodyClassName}`}
                style={{ willChange: "clip-path" }}
            >
                {showSkeleton && <CardSkeleton variant={skeleton} />}

                <div className={showSkeleton ? "hidden" : "contents"}>
                    {children}
                </div>
            </div>
        </section>
    );
}