
"use client";

import type { ReactNode } from "react";

import CardSkeleton from "@/components/weather/CardSkeleton";
import type { CardSkeletonVariant } from "@/components/weather/CardSkeleton";
import { useWeatherLoading } from "@/components/weather/WeatherLoadingContext";

type WeatherCardProps = {
    title: ReactNode;
    icon?: ReactNode;
    divided?: boolean;
    flush?: boolean;
    loading?: boolean;
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
            aria-label={typeof title === "string" ? title : "Weather card"}
            aria-busy={showSkeleton}
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-white/20 bg-black/10 p-(--card-pad) text-white backdrop-blur-lg [--card-pad:12px] @min-[624px]:[--card-pad:10px] ${className}`}
        >
            <h2
                className={`flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60 ${
                    divided ? "border-b border-white/15 pb-2" : ""
                }`}
            >
                {icon}
                {title}
            </h2>

            <div
                className={`@container min-h-0 flex-1 ${bodySpacing} ${bodyClassName}`}
            >
                {showSkeleton && <CardSkeleton variant={skeleton} />}

                <div className={showSkeleton ? "hidden" : "contents"}>
                    {children}
                </div>
            </div>
        </section>
    );
}
