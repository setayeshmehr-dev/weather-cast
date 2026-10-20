"use client";

import { useEffect, useRef, useState } from "react";

// How quickly the shadow follows the real phase (seconds).
const PHASE_TAU = 0.3;
const EPSILON = 0.00005;

/** Signed difference between two phases (0..1 is a full cycle), the short way. */
function shortestDelta(from: number, to: number): number {
    return ((((to - from) % 1) + 1.5) % 1) - 0.5;
}

/** Glides toward the target phase instead of jumping while the time strip is dragged. */
export function useSmoothPhase(target: number): number {
    const [shown, setShown] = useState(target);
    const shownRef = useRef(target);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        let frame = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            const current = shownRef.current;
            const follow = reduceMotion ? 1 : 1 - Math.exp(-dt / PHASE_TAU);
            const next = current + shortestDelta(current, target) * follow;

            shownRef.current = next;
            setShown(next);

            if (Math.abs(shortestDelta(next, target)) >= EPSILON) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [target]);

    return ((shown % 1) + 1) % 1;
}