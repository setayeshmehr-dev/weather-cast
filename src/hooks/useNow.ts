"use client";

import { useEffect, useState } from "react";

/** Current time in ms, refreshed every 30 seconds (null until the first tick). */
export function useNow(): number | null {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = window.setTimeout(tick, 0);
        const interval = window.setInterval(tick, 30_000);

        return () => {
            window.clearTimeout(first);
            window.clearInterval(interval);
        };
    }, []);

    return now;
}
