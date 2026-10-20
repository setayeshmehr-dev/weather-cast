"use client";

import { useEffect, useRef, useState } from "react";

import type { MoonAppearance } from "@/lib/moon";

// How quickly the drawing follows the real values (seconds).
const ROTATION_TAU = 0.4;
const PHASE_TAU = 0.3;
// The fastest rotation allowed (degrees per second). The real orientation of
// the moon can change almost 20 degrees per hour, which looks frantic when you
// drag the time strip.
const MAX_ROTATION_SPEED = 70;

const ANGLE_EPSILON = 0.05;
const PHASE_EPSILON = 0.0005;

/** Signed difference between two angles, in degrees, along the short way. */
function shortestDelta(from: number, to: number): number {
    return ((((to - from) % 360) + 540) % 360) - 180;
}

/**
 * Glides toward the target values instead of jumping: the rotation of the lit
 * side is limited in speed, and the photo keeps its fixed relation to it, so the
 * shadow and the surface always turn together.
 */
export function useSmoothMoon(target: MoonAppearance): MoonAppearance {
    const { illumination, litAngle, photoRotation } = target;

    // Orientation of the photo relative to the lit side; it changes slowly.
    const relative = shortestDelta(litAngle, photoRotation);

    const [shown, setShown] = useState({ illumination, litAngle, relative });
    const shownRef = useRef(shown);

    useEffect(() => {
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        let frame = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = reduceMotion ? 1 : Math.min((now - last) / 1000, 0.05);
            last = now;

            const current = shownRef.current;
            const follow = (tau: number) => (reduceMotion ? 1 : 1 - Math.exp(-dt / tau));

            const turn = shortestDelta(current.litAngle, litAngle) * follow(ROTATION_TAU);
            const limit = reduceMotion ? 360 : MAX_ROTATION_SPEED * dt;

            const next = {
                illumination:
                    current.illumination +
                    (illumination - current.illumination) * follow(PHASE_TAU),
                litAngle: current.litAngle + Math.max(-limit, Math.min(limit, turn)),
                relative:
                    current.relative +
                    shortestDelta(current.relative, relative) * follow(ROTATION_TAU),
            };

            shownRef.current = next;
            setShown(next);

            const settled =
                Math.abs(illumination - next.illumination) < PHASE_EPSILON &&
                Math.abs(shortestDelta(next.litAngle, litAngle)) < ANGLE_EPSILON &&
                Math.abs(shortestDelta(next.relative, relative)) < ANGLE_EPSILON;

            if (!settled) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [illumination, litAngle, relative]);

    return {
        illumination: shown.illumination,
        litAngle: shown.litAngle,
        photoRotation: shown.litAngle + shown.relative,
    };
}