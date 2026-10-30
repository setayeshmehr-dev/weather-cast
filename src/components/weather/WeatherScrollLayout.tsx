"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import {
    HERO_FULL_HEIGHT,
    HERO_GAP,
    getHeroProgress,
} from "@/lib/heroScroll";

// Content sliding under a card header fades over this distance (px).
const HEADER_FADE = 12;

type WeatherScrollLayoutProps = {
    /** The header: it stays fixed at the top while the content scrolls. */
    hero: ReactNode;
    children: ReactNode;
};

// The header starts fully expanded (also on the server).
const INITIAL_STYLE = {
    "--hero-high-low": 1,
    "--hero-status": 1,
    "--hero-temp": 1,
    "--hero-compact": 0,
} as CSSProperties;

type CardMeasure = {
    card: HTMLElement;
    body: HTMLElement;
    trigger: HTMLElement;
    /** Position of the card inside the scroll content (independent of scroll). */
    naturalTop: number;
    naturalBottom: number;
    /** Bottom of the card header inside the card (offsetTop + height). */
    headerEnd: number;
    /** Top of the body inside the card (offsetTop). */
    bodyTop: number;
    /** Height of the capsule (header + padding top + padding bottom). */
    capsuleHeight: number;
};

function resetCard(m: CardMeasure): void {
    if (m.card.dataset.collapsed === undefined) return;
    delete m.card.dataset.collapsed;
    m.card.style.removeProperty("--card-shift");
    m.card.style.removeProperty("--card-bottom");
    m.card.style.removeProperty("--card-opacity");
    m.card.style.visibility = "";
    m.trigger.style.pointerEvents = "";
    m.body.style.clipPath = "";
    m.body.style.removeProperty("mask-image");
    m.body.style.removeProperty("-webkit-mask-image");
}

function applyCard(m: CardMeasure, top: number, bottom: number, stop: number): void {
    const shift = Math.max(stop - top, 0);

    if (shift < 0.01) {
        resetCard(m);
        return;
    }

    const capsuleBottom = top + shift + m.capsuleHeight;
    const floor = Math.max(bottom, capsuleBottom);
    const faded = Math.min(
        Math.max((capsuleBottom - bottom) / m.capsuleHeight, 0),
        1
    );

    m.card.dataset.collapsed = "1";
    m.card.style.setProperty("--card-shift", `${shift.toFixed(2)}px`);
    m.card.style.setProperty("--card-bottom", `${(bottom - floor).toFixed(2)}px`);
    m.card.style.setProperty("--card-opacity", (1 - faded).toFixed(3));
    m.card.style.visibility = faded >= 1 ? "hidden" : "";
    m.trigger.style.pointerEvents = "none";

    const cut = Math.max(shift + m.headerEnd - m.bodyTop, 0);
    const mask = `linear-gradient(to bottom, transparent ${cut.toFixed(2)}px, #000 ${(cut + HEADER_FADE).toFixed(2)}px)`;
    m.body.style.clipPath = `inset(${cut.toFixed(2)}px 0 0 0)`;
    m.body.style.setProperty("mask-image", mask);
    m.body.style.setProperty("-webkit-mask-image", mask);
}

/*
 * The page area: the header is fixed over the top, and the cards scroll below it.
 * Measurements are cached and only refreshed on mount, resize, or content change —
 * NOT on every scroll event. This removes layout thrashing and jank.
 */
export default function WeatherScrollLayout({
    hero,
    children,
}: WeatherScrollLayoutProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const root = rootRef.current;
        const scroller = scrollerRef.current;
        if (!root || !scroller) return;

        // Cached state — only `update()` runs on scroll, and it never reads layout.
        let measures: CardMeasure[] = [];
        let rootTop = 0;
        let frame = 0;

        const measureAll = () => {
            // Reset every card first so getBoundingClientRect() returns the natural box.
            for (const m of measures) resetCard(m);

            rootTop = root.getBoundingClientRect().top;
            const scrollTop = scroller.scrollTop;

            const next: CardMeasure[] = [];
            scroller
                .querySelectorAll<HTMLElement>("[data-weather-card]")
                .forEach((card) => {
                    const header = card.querySelector<HTMLElement>("[data-card-header]");
                    const body = card.querySelector<HTMLElement>("[data-card-body]");
                    if (!header || !body) return;

                    const rect = card.getBoundingClientRect();
                    const padding = header.offsetTop;
                    next.push({
                        card,
                        body,
                        trigger: card.closest<HTMLElement>('[role="button"]') ?? card,
                        // Convert viewport-relative position to content-relative position.
                        naturalTop: rect.top - rootTop + scrollTop,
                        naturalBottom: rect.bottom - rootTop + scrollTop,
                        headerEnd: header.offsetTop + header.offsetHeight,
                        bodyTop: body.offsetTop,
                        capsuleHeight: header.offsetTop + header.offsetHeight + padding,
                    });
                });
            measures = next;
        };

        const update = () => {
            frame = 0;

            const scrollTop = scroller.scrollTop;
            const progress = getHeroProgress(scrollTop);

            root.style.setProperty("--hero-high-low", progress.highLow.toFixed(3));
            root.style.setProperty("--hero-status", progress.status.toFixed(3));
            root.style.setProperty("--hero-temp", progress.temperature.toFixed(3));
            root.style.setProperty("--hero-compact", progress.compact.toFixed(3));

            // Cards stop at a fixed distance under the header.
            const stop = progress.bottom + HERO_GAP;

            for (const m of measures) {
                const top = m.naturalTop - scrollTop;
                const bottom = m.naturalBottom - scrollTop;
                applyCard(m, top, bottom, stop);
            }
        };

        const schedule = () => {
            if (frame === 0) frame = requestAnimationFrame(update);
        };

        const onResize = () => {
            measureAll();
            schedule();
        };

        // Initial measure + paint.
        measureAll();
        update();

        scroller.addEventListener("scroll", schedule, { passive: true });

        // Re-measure only when the scroll area or its content actually changes size.
        const observer = new ResizeObserver(onResize);
        observer.observe(scroller);
        if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);

        window.addEventListener("resize", onResize, { passive: true });
        window.addEventListener("orientationchange", onResize, { passive: true });

        return () => {
            scroller.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div ref={rootRef} className="absolute inset-0 z-10" style={INITIAL_STYLE}>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
                {hero}
            </div>

            <main
                ref={scrollerRef}
                className="@container absolute inset-0 overflow-y-auto px-4 pb-6"
                style={{ paddingTop: HERO_FULL_HEIGHT + HERO_GAP }}
            >
                {children}
            </main>
        </div>
    );
}