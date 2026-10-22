/*
 * Secondary data (air quality, the sidebar cards) starts only after the main
 * weather is ready, so it does not compete with it on the first load. The gate
 * opens when the weather arrives (or is already saved), or after a short delay.
 */
const FALLBACK_DELAY_MS = 2500;

let opened = false;
let timer: number | undefined;

const listeners = new Set<() => void>();

export function openDeferredStart(): void {
    if (opened) return;

    opened = true;
    window.clearTimeout(timer);
    listeners.forEach((listener) => listener());
    listeners.clear();
}

export function subscribeDeferredStart(listener: () => void): () => void {
    if (opened) return () => undefined;

    listeners.add(listener);

    if (timer === undefined) {
        timer = window.setTimeout(openDeferredStart, FALLBACK_DELAY_MS);
    }

    return () => {
        listeners.delete(listener);
    };
}

export function getDeferredStart(): boolean {
    return opened;
}

export function getServerDeferredStart(): boolean {
    return false;
}