let paused: HTMLVideoElement[] = [];
let timer = 0;

/*
 * Pauses the videos while the page is moving and lets them play again shortly after it
 * stops. Phones have a hard time decoding a video and drawing the glass cards over it
 * at the same time.
 */
export function pauseVideosWhileScrolling(resumeAfterMs = 160): void {
    if (paused.length === 0) {
        document.querySelectorAll("video").forEach((video) => {
            if (!video.paused && !video.ended) {
                video.pause();
                paused.push(video);
            }
        });
    }

    window.clearTimeout(timer);

    timer = window.setTimeout(() => {
        paused.forEach((video) => {
            void video.play().catch(() => undefined);
        });

        paused = [];
    }, resumeAfterMs);
}