"use client";

import { useEffect, useState } from "react";

// The spinner appears only if loading takes longer than this (no flash when it is fast).
const SPINNER_DELAY_MS = 250;
const FADE_MS = 300;

type BootScreenProps = {
    done: boolean;
};

/*
 * Covers the page (same gradient as the app, rendered on the server too) until the
 * first screen is ready, then fades out.
 */
export default function BootScreen({ done }: BootScreenProps) {
    const [spinnerVisible, setSpinnerVisible] = useState(false);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(
            () => setSpinnerVisible(true),
            SPINNER_DELAY_MS
        );

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!done) return;

        const timer = window.setTimeout(() => setGone(true), FADE_MS);

        return () => window.clearTimeout(timer);
    }, [done]);

    if (gone) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Loading weather"
            className={`fixed inset-0 z-[70] flex items-center justify-center bg-linear-to-b from-sky-700 to-slate-900 transition-opacity duration-300 ${
                done ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
        >
            <div
                className={`size-9 animate-spin rounded-full border-2 border-white/25 border-t-white transition-opacity duration-300 motion-reduce:animate-none ${
                    spinnerVisible ? "opacity-100" : "opacity-0"
                }`}
            />
        </div>
    );
}