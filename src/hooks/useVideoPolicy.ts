"use client";

import { useSyncExternalStore } from "react";

/*
 * "all"       : page and card videos
 * "page-only" : only the page background (slow connection)
 * "none"      : posters only (reduced motion, data saver, very slow connection)
 */
export type VideoPolicy = "all" | "page-only" | "none";

type NetworkInformation = {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener: (type: "change", listener: () => void) => void;
    removeEventListener: (type: "change", listener: () => void) => void;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getConnection(): NetworkInformation | undefined {
    return (navigator as Navigator & { connection?: NetworkInformation })
        .connection;
}

function subscribe(onChange: () => void): () => void {
    const motion = window.matchMedia(REDUCED_MOTION_QUERY);
    const connection = getConnection();

    motion.addEventListener("change", onChange);
    connection?.addEventListener("change", onChange);

    return () => {
        motion.removeEventListener("change", onChange);
        connection?.removeEventListener("change", onChange);
    };
}

function getSnapshot(): VideoPolicy {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "none";

    const connection = getConnection();

    if (connection?.saveData) return "none";

    const type = connection?.effectiveType;

    if (type === "slow-2g" || type === "2g") return "none";
    if (type === "3g") return "page-only";

    return "all";
}

// The server (and the first render of the client) shows posters only.
function getServerSnapshot(): VideoPolicy {
    return "none";
}

export function useVideoPolicy(): VideoPolicy {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}