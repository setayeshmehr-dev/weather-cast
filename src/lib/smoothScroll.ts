// Time constant (s) of the smoothing of mouse-wheel steps.
const WHEEL_TAU = 0.085;

// Wheel events smaller than this come from a trackpad, which already scrolls smoothly.
const NOTCH = 50;

const LINE_HEIGHT = 40;

/*
 * Takes over wheel scrolling of a container, so the scroll position is written in the
 * same animation frame as the effects that depend on it (onFrame). With the browser's
 * own scrolling (done on another thread) such effects arrive a frame late and shake.
 * Touch, keyboard and the scrollbar still scroll natively; for them onFrame runs
 * after each scroll event.
 */
export function createSmoothScroll(
    scroller: HTMLElement,
    onFrame: () => void
): () => void {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    let target = scroller.scrollTop;
    let current = target;
    let instant = true;
    let animating = false;
    let frame = 0;
    let syncFrame = 0;
    let last = 0;

    const maxScroll = () =>
        Math.max(scroller.scrollHeight - scroller.clientHeight, 0);

    const clamp = (value: number) =>
        Math.min(Math.max(value, 0), maxScroll());

    const step = (now: number) => {
        frame = 0;

        const dt = Math.min((now - last) / 1000, 0.05);

        last = now;

        if (instant) {
            current = target;
        } else {
            current += (target - current) * (1 - Math.exp(-dt / WHEEL_TAU));

            if (Math.abs(target - current) < 0.25) current = target;
        }

        scroller.scrollTop = current;
        onFrame();

        if (current !== target) {
            frame = requestAnimationFrame(step);
        } else {
            animating = false;
        }
    };

    const start = () => {
        if (frame !== 0) return;

        animating = true;
        last = performance.now();
        frame = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
        // Pinch zoom, handled wheels (the map) and horizontal scrolling stay as they are.
        if (event.defaultPrevented || event.ctrlKey) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

        if (!animating) {
            current = target = scroller.scrollTop;
        }

        let delta = event.deltaY;

        if (event.deltaMode === 1) delta *= LINE_HEIGHT;
        else if (event.deltaMode === 2) delta *= scroller.clientHeight;

        const next = clamp(target + delta);

        // At an edge: leave it to the browser.
        if (next === target) return;

        event.preventDefault();

        target = next;
        instant =
            reduceMotion ||
            (event.deltaMode === 0 && Math.abs(event.deltaY) < NOTCH);

        start();
    };

    const onScroll = () => {
        // Our own loop already runs the effects.
        if (animating) return;

        current = target = scroller.scrollTop;

        if (syncFrame === 0) {
            syncFrame = requestAnimationFrame(() => {
                syncFrame = 0;
                onFrame();
            });
        }
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
        scroller.removeEventListener("wheel", onWheel);
        scroller.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(frame);
        cancelAnimationFrame(syncFrame);
    };
}