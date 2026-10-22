"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import {
    HERO_FADE,
    HERO_FULL_HEIGHT,
    HERO_GAP,
    getHeroProgress,
} from "@/lib/heroScroll";

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

function clearFade(card: HTMLElement): void {
    if (card.dataset.heroFade === undefined) return;

    delete card.dataset.heroFade;
    card.style.removeProperty("mask-image");
    card.style.removeProperty("-webkit-mask-image");
}

/*
 * Cards fade out as they get close to the bottom of the header. The fade is a mask
 * on each card (not on the whole scroll area): a mask on an ancestor would stop
 * the blur of the cards from seeing the video behind them.
 */
function fadeCards(scroller: HTMLElement, cutoff: number): void {
    scroller.querySelectorAll<HTMLElement>("section").forEach((card) => {
        // Where, inside the card, the fade starts.
        const start = cutoff - card.getBoundingClientRect().top;

        if (start + HERO_FADE <= 0) {
            clearFade(card);
            return;
        }

        const mask = `linear-gradient(to bottom, transparent ${start}px, #000 ${start + HERO_FADE}px)`;

        card.dataset.heroFade = "1";
        card.style.setProperty("mask-image", mask);
        card.style.setProperty("-webkit-mask-image", mask);
    });
}

/*
 * The page area: the header is fixed over the top, and the cards scroll below it.
 * The scroll position drives a few CSS variables (shared with the header) that say
 * how much of each header line is still shown.
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

        let frame = 0;

        const update = () => {
            frame = 0;

            const progress = getHeroProgress(scroller.scrollTop);

            root.style.setProperty("--hero-high-low", progress.highLow.toFixed(3));
            root.style.setProperty("--hero-status", progress.status.toFixed(3));
            root.style.setProperty("--hero-temp", progress.temperature.toFixed(3));
            root.style.setProperty("--hero-compact", progress.compact.toFixed(3));

            fadeCards(scroller, root.getBoundingClientRect().top + progress.bottom);
        };

        const schedule = () => {
            if (frame === 0) frame = requestAnimationFrame(update);
        };

        update();

        scroller.addEventListener("scroll", schedule, { passive: true });

        // The cards move when the window is resized or the content changes height.
        const observer = new ResizeObserver(schedule);

        observer.observe(scroller);

        if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);

        return () => {
            scroller.removeEventListener("scroll", schedule);
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