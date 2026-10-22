const TIMEOUT_MS = 4000;

type NetworkInformation = {
    saveData?: boolean;
    effectiveType?: string;
};

// Same rules as the video policy: no video, no preloading.
function videosAllowed(): boolean {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

    const connection = (navigator as Navigator & { connection?: NetworkInformation })
        .connection;

    if (connection?.saveData) return false;

    return connection?.effectiveType !== "slow-2g" && connection?.effectiveType !== "2g";
}

/** Resolves when the video can play (or fails, or after a few seconds). */
export function preloadWeatherVideo(src: string): Promise<void> {
    if (typeof window === "undefined" || !videosAllowed()) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        let finished = false;
        let timer = 0;

        const finish = () => {
            if (finished) return;

            finished = true;
            window.clearTimeout(timer);
            resolve();
        };

        const video = document.createElement("video");

        timer = window.setTimeout(finish, TIMEOUT_MS);

        video.preload = "auto";
        video.muted = true;
        video.addEventListener("canplay", finish, { once: true });
        video.addEventListener("error", finish, { once: true });
        video.src = src;
        video.load();
    });
}

/** Resolves when the image is loaded (or failed); the caller adds its own timeout. */
export function preloadImage(src: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();

    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = src;
    });
}