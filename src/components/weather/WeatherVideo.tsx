"use client";

import { useEffect, useRef, useState } from "react";

import { useVideoPolicy } from "@/hooks/useVideoPolicy";
import { getWeatherVideoUrls } from "@/lib/weatherVideo";

// Card videos start loading this long after the page has finished loading.
const CARD_DELAY_MS = 1200;

type WeatherVideoProps = {
    name: string;
    variant: "page" | "card";
    className?: string;
    onLoadedChange?: (loadedSrc: string | null) => void;
};

export default function WeatherVideo({
    name,
    variant,
    className = "",
    onLoadedChange,
}: WeatherVideoProps) {
    const urls = getWeatherVideoUrls(name);
    const isPage = variant === "page";
    const src = isPage ? urls.page : urls.card;
    const poster = isPage ? urls.poster : urls.cardPoster;

    const policy = useVideoPolicy();
    const allowed = isPage ? policy !== "none" : policy === "all";

    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // The page video is always wanted; card videos wait until they are visible
    // and the page has settled.
    const [inView, setInView] = useState(isPage);
    const [settled, setSettled] = useState(isPage);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const [failedPoster, setFailedPoster] = useState<string | null>(null);

    useEffect(() => {
        if (isPage) return;

        const element = containerRef.current;

        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { rootMargin: "100px" },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [isPage]);

    useEffect(() => {
        if (isPage) return;

        let timer: number | undefined;

        const start = () => {
            timer = window.setTimeout(() => setSettled(true), CARD_DELAY_MS);
        };

        if (document.readyState === "complete") {
            start();
        } else {
            window.addEventListener("load", start, { once: true });
        }

        return () => {
            window.removeEventListener("load", start);
            window.clearTimeout(timer);
        };
    }, [isPage]);

    const shouldLoad = allowed && inView && settled;

    // Pause when the video is out of view or the tab is hidden (saves CPU and battery).
    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;

        const update = () => {
            if (inView && !document.hidden) {
                void video.play().catch(() => undefined);
            } else {
                video.pause();
            }
        };

        update();
        document.addEventListener("visibilitychange", update);

        return () => document.removeEventListener("visibilitychange", update);
    }, [inView, shouldLoad, src]);

    return (
        <div ref={containerRef} className={`overflow-hidden ${className}`}>
            {failedPoster !== poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={poster}
                    alt=""
                    loading={isPage ? "eager" : "lazy"}
                    decoding="async"
                    onError={() => setFailedPoster(poster)}
                    className="absolute inset-0 size-full object-cover"
                />
            )}

            {shouldLoad && (
                <video
                    key={src}
                    ref={videoRef}
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={isPage ? "auto" : "metadata"}
                    aria-hidden="true"
                    tabIndex={-1}
                    onCanPlay={() => {
                        setLoadedSrc(src);
                        onLoadedChange?.(src);
                    }}
                    onError={() => {
                        setLoadedSrc((previous) =>
                            previous === src ? null : previous,
                        );
                        onLoadedChange?.(null);
                    }}
                    className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
                        loadedSrc === src ? "opacity-100" : "opacity-0"
                    }`}
                />
            )}
        </div>
    );
}
