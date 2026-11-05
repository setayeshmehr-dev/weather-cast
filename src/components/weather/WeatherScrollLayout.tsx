"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import {
    HERO_FULL_HEIGHT,
    HERO_GAP,
    HERO_STOP,
    getHeroProgress,
} from "@/lib/heroScroll";
import { pauseVideosWhileScrolling } from "@/lib/pauseVideos";
import { TOUCH_SCROLL, createSmoothScroll } from "@/lib/smoothScroll";

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

type Parts = {
    frame: HTMLElement;
    header: HTMLElement;
    body: HTMLElement;
    /** The element that receives clicks for the card (the detail trigger, if any). */
    trigger: HTMLElement;
};

type CardState = {
    card: HTMLElement;
    parts: Parts;
    /** Natural top of the card, from the top of the scrolled content (px). */
    contentTop: number;
    height: number;
    /** Bottom of the header and top of the body, inside the card. */
    headerEnd: number;
    bodyTop: number;
    padding: number;
    /** What is written on the card now, to skip identical writes. */
    shift: number;
    frameBottom: number;
    opacity: number;
    cut: number;
};

const partsCache = new WeakMap<HTMLElement, Parts | null>();

function getParts(card: HTMLElement): Parts | null {
    const cached = partsCache.get(card);

    if (cached !== undefined) return cached;

    const frame = card.querySelector<HTMLElement>("[data-card-frame]");
    const header = card.querySelector<HTMLElement>("[data-card-header]");
    const body = card.querySelector<HTMLElement>("[data-card-body]");

    const parts =
        frame && header && body
            ? {
                frame,
                header,
                body,
                trigger: card.closest<HTMLElement>('[role="button"]') ?? card,
            }
            : null;

    partsCache.set(card, parts);

    return parts;
}

/*
 * Measures the cards. This is done only when the size or the content changes, not on
 * every frame: during the scroll the positions are just calculated from these numbers.
 * Only the children of a card are moved, so its own box is always the natural one.
 */
function readCards(scroller: HTMLElement): CardState[] {
    const scrollerTop = scroller.getBoundingClientRect().top;
    const scrollTop = scroller.scrollTop;
    const cards: CardState[] = [];

    scroller
        .querySelectorAll<HTMLElement>("[data-weather-card]")
        .forEach((card) => {
            const parts = getParts(card);

            if (!parts) return;

            const rect = card.getBoundingClientRect();

            cards.push({
                card,
                parts,
                contentTop: rect.top - scrollerTop + scrollTop,
                height: rect.height,
                headerEnd: parts.header.offsetTop + parts.header.offsetHeight,
                bodyTop: parts.body.offsetTop,
                padding: parts.header.offsetTop,
                shift: 0,
                frameBottom: 0,
                opacity: 1,
                cut: 0,
            });
        });

    return cards;
}

function resetCard({ card, parts }: CardState): void {
    delete card.dataset.collapsed;

    card.style.visibility = "";
    parts.frame.style.top = "";
    parts.frame.style.bottom = "";
    parts.frame.style.opacity = "";
    parts.header.style.transform = "";
    parts.header.style.opacity = "";
    parts.trigger.style.pointerEvents = "";
    parts.body.style.clipPath = "";
    parts.body.style.removeProperty("mask-image");
    parts.body.style.removeProperty("-webkit-mask-image");
}

/*
 * Like an elevator reaching the top floor: once the top of a card reaches the stop
 * line, its ceiling (and header) stays there, while the floor keeps rising with the
 * scroll. The content rises with the floor and disappears under the header. When
 * only the header is left the card is a capsule: the floor stops, and further
 * scrolling fades the capsule while the next card takes its place.
 */
function applyCard(state: CardState, scrollTop: number): void {
    const { card, parts } = state;

    const top = state.contentTop - scrollTop;
    const shift = Math.max(HERO_STOP - top, 0);

    if (shift < 0.01) {
        if (card.dataset.collapsed !== undefined) resetCard(state);

        return;
    }

    const capsuleHeight = state.headerEnd + state.padding;
    const bottom = top + state.height;
    const capsuleBottom = top + shift + capsuleHeight;
    const floor = Math.max(bottom, capsuleBottom);

    // 0 until the card is a capsule, then 1 over the height of the capsule: the
    // next card (one gap below) reaches the stop line right when it is gone.
    const faded = Math.min(
        Math.max((capsuleBottom - bottom) / capsuleHeight, 0),
        1
    );

    const opacity = 1 - faded;
    const frameBottom = bottom - floor;
    const cut = shift + state.headerEnd - state.bodyTop;

    if (card.dataset.collapsed === undefined) {
        card.dataset.collapsed = "1";

        // The natural box of the card is partly hidden under the page header: clicks
        // go only to its header and to the visible part of its body.
        parts.trigger.style.pointerEvents = "none";
    }

    const hidden = faded >= 1;

    if (hidden !== (card.style.visibility === "hidden")) {
        card.style.visibility = hidden ? "hidden" : "";
    }

    const changed =
        Math.abs(shift - state.shift) > 0.1 ||
        Math.abs(frameBottom - state.frameBottom) > 0.1 ||
        Math.abs(opacity - state.opacity) > 0.004 ||
        Math.abs(cut - state.cut) > 0.1;

    if (!changed) return;

    state.shift = shift;
    state.frameBottom = frameBottom;
    state.opacity = opacity;
    state.cut = cut;

    parts.frame.style.top = `${shift}px`;
    parts.frame.style.bottom = `${frameBottom}px`;
    parts.frame.style.opacity = String(opacity);

    parts.header.style.transform = `translate3d(0, ${shift}px, 0)`;
    parts.header.style.opacity = String(opacity);

    // Everything above the bottom of the pinned header is hidden; right under it
    // the content fades.
    const mask = `linear-gradient(to bottom, transparent ${cut}px, #000 ${cut + HEADER_FADE}px)`;

    parts.body.style.clipPath = `inset(${Math.max(cut, 0)}px 0 0 0)`;
    parts.body.style.setProperty("mask-image", mask);
    parts.body.style.setProperty("-webkit-mask-image", mask);
}

/*
 * The page area: the header is fixed over the top, and the cards scroll below it.
 * The scroll position drives the header lines (CSS variables on the header only) and
 * the state of every card. The scrolling is done by createSmoothScroll, so these
 * effects are written in the same frame as the scroll position.
 */
export default function WeatherScrollLayout({
    hero,
    children,
}: WeatherScrollLayoutProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const heroRef = useRef<HTMLDivElement | null>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);
    const spacerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const heroElement = heroRef.current;
        const scroller = scrollerRef.current;
        const spacer = spacerRef.current;

        if (!heroElement || !scroller || !spacer) return;

        const touchScreen = window.matchMedia("(hover: none)").matches;

        let cards: CardState[] = [];
        let lastHero = "";
        let lastScrollTop = -1;
        let queued = 0;

        /*
         * The page can be only a little taller than the screen, so there may not be
         * enough scrolling for the first card to go all the way through the elevator.
         * The empty space at the end is made just tall enough for that, and is zero
         * when the page is long enough.
         */
        const fitScrollRange = () => {
            const first = scroller.querySelector<HTMLElement>(
                "[data-weather-card]"
            );

            if (!first) return;

            const needed =
                HERO_FULL_HEIGHT + HERO_GAP - HERO_STOP + first.offsetHeight + 2;
            const current = spacer.offsetHeight;
            const range = scroller.scrollHeight - scroller.clientHeight - current;
            const height = Math.max(Math.ceil(needed - range), 0);

            if (height !== current) spacer.style.height = `${height}px`;
        };

        const update = () => {
            const scrollTop = scroller.scrollTop;
            const progress = getHeroProgress(scrollTop);

            // The header lines change only during the first part of the scroll.
            const key = `${progress.highLow}|${progress.status}|${progress.temperature}|${progress.compact}`;

            if (key !== lastHero) {
                lastHero = key;

                heroElement.style.setProperty(
                    "--hero-high-low",
                    progress.highLow.toFixed(3)
                );
                heroElement.style.setProperty(
                    "--hero-status",
                    progress.status.toFixed(3)
                );
                heroElement.style.setProperty(
                    "--hero-temp",
                    progress.temperature.toFixed(3)
                );
                heroElement.style.setProperty(
                    "--hero-compact",
                    progress.compact.toFixed(3)
                );
            }

            for (const state of cards) applyCard(state, scrollTop);

        };

        const refresh = () => {
            fitScrollRange();
            cards = readCards(scroller);
            update();
        };

        const schedule = () => {
            if (queued !== 0) return;

            queued = requestAnimationFrame(() => {
                queued = 0;
                refresh();
            });
        };

        refresh();

        const destroyScroll = createSmoothScroll(scroller, update);

        // The cards move when the window is resized or the content changes height.
        const observer = new ResizeObserver(schedule);

        observer.observe(scroller);

        if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);

        return () => {
            destroyScroll();
            observer.disconnect();
            cancelAnimationFrame(queued);
        };
    }, []);

    return (
        <div ref={rootRef} className="absolute inset-0 z-10">
            <div
                ref={heroRef}
                className="pointer-events-none absolute inset-x-0 top-0 z-20"
                style={INITIAL_STYLE}
            >
                {hero}
            </div>

            <main
                ref={scrollerRef}
                className={`@container absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
                    TOUCH_SCROLL ? "touch-pinch-zoom" : ""
                }`}
                style={{ paddingTop: HERO_FULL_HEIGHT + HERO_GAP }}
            >
                {children}

                <div ref={spacerRef} aria-hidden="true" />
            </main>
        </div>
    );
}