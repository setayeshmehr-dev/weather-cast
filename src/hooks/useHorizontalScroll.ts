"use client";

import { useCallback, useRef, useState } from "react";

// One click scrolls this share of the visible width.
const PAGE_RATIO = 0.8;
const EDGE_EPSILON = 2;

type Edges = {
    /** There is more content on the left / on the right. */
    left: boolean;
    right: boolean;
    /** Vertical middle of the list, measured from the top of its card. */
    center: number | null;
};

const NO_EDGES: Edges = { left: false, right: false, center: null };

function easeOutCubic(progress: number): number {
    return 1 - (1 - progress) ** 3;
}

/*
 * Horizontal scrolling of a list with buttons: it tells on which sides there is more
 * to scroll, and scrolls by a page with a smooth animation of its own (the browser's
 * smooth scrolling is not used: it has a fixed speed and fights with snapping).
 */
export function useHorizontalScroll<T extends HTMLElement>() {
    const scrollerRef = useRef<T | null>(null);
    const frameRef = useRef(0);
    const targetRef = useRef<number | null>(null);
    const [edges, setEdges] = useState<Edges>(NO_EDGES);

    const cancel = useCallback(() => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
        targetRef.current = null;

        if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = "";
    }, []);

    // A callback ref: the list is mounted only after the data is loaded.
    const scrollerCallback = useCallback(
        (node: T) => {
            scrollerRef.current = node;

            let frame = 0;

            const measure = () => {
                const max = node.scrollWidth - node.clientWidth;
                const left = node.scrollLeft > EDGE_EPSILON;
                const right = node.scrollLeft < max - EDGE_EPSILON;

                const card = node.closest<HTMLElement>("[data-weather-card]");
                const box = node.getBoundingClientRect();
                const center = card
                    ? Math.round(
                        box.top - card.getBoundingClientRect().top + box.height / 2
                    )
                    : null;

                setEdges((previous) =>
                    previous.left === left &&
                    previous.right === right &&
                    previous.center === center
                        ? previous
                        : { left, right, center }
                );
            };

            const schedule = () => {
                if (frame !== 0) return;

                frame = requestAnimationFrame(() => {
                    frame = 0;
                    measure();
                });
            };

            // Scrolling by the wheel or the touch takes over from our animation.
            const onWheel = (event: WheelEvent) => {
                if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) cancel();
            };

            node.addEventListener("scroll", schedule, { passive: true });
            node.addEventListener("wheel", onWheel, { passive: true });
            node.addEventListener("pointerdown", cancel);

            const resizeObserver = new ResizeObserver(schedule);
            const mutationObserver = new MutationObserver(schedule);

            resizeObserver.observe(node);
            mutationObserver.observe(node, { childList: true });

            schedule();

            return () => {
                node.removeEventListener("scroll", schedule);
                node.removeEventListener("wheel", onWheel);
                node.removeEventListener("pointerdown", cancel);
                resizeObserver.disconnect();
                mutationObserver.disconnect();
                cancelAnimationFrame(frame);
                cancel();
                scrollerRef.current = null;
                setEdges(NO_EDGES);
            };
        },
        [cancel]
    );

    const animate = useCallback((scroller: T, target: number) => {
        cancelAnimationFrame(frameRef.current);

        const from = scroller.scrollLeft;
        const distance = target - from;
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        const duration = reduceMotion
            ? 0
            : Math.min(Math.max(300 + Math.abs(distance) * 0.4, 360), 760);
        const start = performance.now();

        targetRef.current = target;

        // The snapping would pull the list back while we move it.
        scroller.style.scrollSnapType = "none";

        const step = (now: number) => {
            const progress =
                duration === 0 ? 1 : Math.min((now - start) / duration, 1);

            scroller.scrollLeft = from + distance * easeOutCubic(progress);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(step);
                return;
            }

            frameRef.current = 0;
            targetRef.current = null;
            scroller.style.scrollSnapType = "";
        };

        frameRef.current = requestAnimationFrame(step);
    }, []);

    const scrollByPage = useCallback(
        (direction: 1 | -1) => {
            const scroller = scrollerRef.current;

            if (!scroller) return;

            const max = scroller.scrollWidth - scroller.clientWidth;

            // While an animation runs, the next click adds to where it is going.
            const base = targetRef.current ?? scroller.scrollLeft;
            const wanted = base + direction * scroller.clientWidth * PAGE_RATIO;

            let target = wanted;

            if (wanted >= max - 1) {
                target = max;
            } else if (wanted <= 1) {
                target = 0;
            } else {
                // Land on the start of an item.
                const origin =
                    scroller.getBoundingClientRect().left - scroller.scrollLeft;
                let best = Infinity;

                for (const child of Array.from(scroller.children)) {
                    const start = child.getBoundingClientRect().left - origin;
                    const gap = Math.abs(start - wanted);

                    if (gap < best) {
                        best = gap;
                        target = start;
                    }
                }
            }

            target = Math.min(Math.max(target, 0), max);

            if (Math.abs(target - scroller.scrollLeft) < 1) return;

            animate(scroller, target);
        },
        [animate]
    );

    return { scrollerRef: scrollerCallback, edges, scrollByPage };
}