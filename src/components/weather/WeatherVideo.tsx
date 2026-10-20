"use client";

import { useEffect, useRef, useState } from "react";

import { useVideoPolicy } from "@/hooks/useVideoPolicy";
import { getWeatherVideoUrls } from "@/lib/weatherVideo";

// Card videos start loading this long after the page has finished loading.
const CARD_DELAY_MS = 1200;

// Duration of the cross-fade between two videos (matches duration-700 below).
const FADE_MS = 700;

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
    const wantedSrcRef = useRef(src);
    const fadeTimer = useRef<number | undefined>(undefined);

    // The page video is always wanted; card videos wait until they are visible
    // and the page has settled.
    const [inView, setInView] = useState(isPage);
    const [settled, setSettled] = useState(isPage);

    // The video on screen, the one fading out, and the one that failed to load.
    const [activeSrc, setActiveSrc] = useState<string | null>(null);
    const [leavingSrc, setLeavingSrc] = useState<string | null>(null);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    const [activePoster, setActivePoster] = useState(poster);
    const [failedPoster, setFailedPoster] = useState<string | null>(null);

    useEffect(() => {
        wantedSrcRef.current = src;
    }, [src]);

    useEffect(() => {
        return () => window.clearTimeout(fadeTimer.current);
    }, []);

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
        const updatePlayback = () => {
            const shouldPlay = inView && !document.hidden;

            containerRef.current?.querySelectorAll("video").forEach((video) => {
                if (shouldPlay) {
                    void video.play().catch(() => undefined);
                } else {
                    video.pause();
                }
            });
        };

        updatePlayback();

        document.addEventListener("visibilitychange", updatePlayback);

        return () => {
            document.removeEventListener("visibilitychange", updatePlayback);
        };
    }, [inView, shouldLoad, src, activeSrc, leavingSrc]);

    // The wanted video is mounted (invisible) next to the active one until it can
    // play, then it fades in on top while the old one stays underneath.
    const wantedSrc =
        shouldLoad && src !== activeSrc && src !== failedSrc ? src : null;

    const sources = allowed
        ? [leavingSrc, activeSrc, wantedSrc].filter(
            (value, index, list): value is string =>
                value !== null && list.indexOf(value) === index,
        )
        : [];

    const handleCanPlay = (videoSrc: string) => {
        if (videoSrc !== wantedSrcRef.current || videoSrc === activeSrc) return;

        setLeavingSrc(activeSrc);
        setActiveSrc(videoSrc);
        setActivePoster(poster);
        setFailedPoster(null);
        onLoadedChange?.(videoSrc);

        window.clearTimeout(fadeTimer.current);
        fadeTimer.current = window.setTimeout(() => setLeavingSrc(null), FADE_MS);
    };

    const handleError = (videoSrc: string) => {
        if (videoSrc !== wantedSrcRef.current) return;

        setFailedSrc(videoSrc);

        // No video for this weather: show its poster instead of the old video.
        setActiveSrc(null);
        setLeavingSrc(null);
        setActivePoster(poster);
        onLoadedChange?.(null);
    };

    // Without videos (reduced motion, data saver...) the poster follows the weather.
    const shownPoster = allowed ? activePoster : poster;

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 h-full w-full overflow-hidden ${className}`}
        >
            {failedPoster !== shownPoster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={shownPoster}
                    alt=""
                    loading={isPage ? "eager" : "lazy"}
                    decoding="async"
                    onError={() => setFailedPoster(shownPoster)}
                    className="absolute inset-0 z-0 h-full w-full object-cover"
                />
            )}

            {sources.map((videoSrc) => {
                const role =
                    videoSrc === activeSrc
                        ? "active"
                        : videoSrc === leavingSrc
                            ? "leaving"
                            : "pending";

                return (
                    <video
                        key={videoSrc}
                        src={videoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload={isPage ? "auto" : "metadata"}
                        tabIndex={-1}
                        onCanPlay={() => handleCanPlay(videoSrc)}
                        onError={() => handleError(videoSrc)}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                            role === "leaving"
                                ? "z-0 opacity-100"
                                : role === "active"
                                    ? "z-10 opacity-100"
                                    : "z-10 opacity-0"
                        }`}
                    />
                );
            })}
        </div>
    );
}