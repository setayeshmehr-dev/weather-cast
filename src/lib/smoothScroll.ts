/*
 * Set to false to give the touch scrolling back to the browser (the card effects then
 * lag one frame behind the finger on phones).
 */
export const TOUCH_SCROLL = true;

// Time constant (s) of the smoothing of mouse-wheel steps.
const WHEEL_TAU = 0.085;

// Wheel events smaller than this come from a trackpad, which already scrolls smoothly.
const NOTCH = 50;

const LINE_HEIGHT = 40;

// Touch: movement (px) before the direction of a gesture is decided.
const TOUCH_SLOP = 4;

// Momentum after a swipe: the share of the speed kept per millisecond (as on iOS).
const FLING_DECAY = 0.998;
const MIN_FLING_SPEED = 0.02; // px per ms
const MAX_FLING_SPEED = 6.5; // px per ms

// Only the last moments of the gesture tell the speed of the release.
const VELOCITY_WINDOW_MS = 100;
const STALE_MS = 70;

// A click right after a drag is not a tap: it is blocked for this long.
const CLICK_BLOCK_MS = 150;

/** Is the touch on a list that scrolls sideways (such as the hourly forecast)? */
function insideHorizontalScroller(
    target: EventTarget | null,
    boundary: HTMLElement
): boolean {
    let element = target instanceof Element ? target : null;

    while (element && element !== boundary) {
        if (element.scrollWidth > element.clientWidth + 1) {
            const overflowX = getComputedStyle(element).overflowX;

            if (overflowX === "auto" || overflowX === "scroll") return true;
        }

        element = element.parentElement;
    }

    return false;
}

type Mode = "idle" | "lerp" | "drag" | "fling";

type Sample = { time: number; position: number };

type TouchGesture = {
    id: number;
    startX: number;
    startY: number;
    startPosition: number;
    allowHorizontal: boolean;
    axis: "pending" | "vertical";
    samples: Sample[];
};

/*
 * Takes over the vertical scrolling of a container (mouse wheel, trackpad and touch), so
 * the scroll position is written in the same animation frame as the effects that depend
 * on it (onFrame). With the browser's own scrolling (done on another thread) such
 * effects arrive a frame late and shake. The keyboard and the scrollbar still scroll
 * natively; for them onFrame runs after each scroll event.
 *
 * On touch screens the container must have "touch-action: pan-x pinch-zoom", so the
 * browser leaves the vertical gestures to this code and keeps the horizontal ones (for
 * lists that scroll sideways).
 */
export function createSmoothScroll(
    scroller: HTMLElement,
    onFrame: () => void
): () => void {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    let mode: Mode = "idle";
    let current = scroller.scrollTop;
    let target = current;
    let velocity = 0;
    let instant = true;
    let frame = 0;
    let syncFrame = 0;
    let last = 0;

    let gesture: TouchGesture | null = null;
    let touchCount = 0;
    let clickBlockedUntil = 0;

    const maxScroll = () =>
        Math.max(scroller.scrollHeight - scroller.clientHeight, 0);

    const clamp = (value: number) => Math.min(Math.max(value, 0), maxScroll());

    const tick = (now: number) => {
        frame = 0;

        const dtMs = Math.min(now - last, 50);

        last = now;

        if (mode === "drag") {
            current = target;
        } else if (mode === "lerp") {
            if (instant) {
                current = target;
            } else {
                current +=
                    (target - current) * (1 - Math.exp(-dtMs / 1000 / WHEEL_TAU));

                if (Math.abs(target - current) < 0.25) current = target;
            }

            if (current === target) mode = "idle";
        } else if (mode === "fling") {
            velocity *= FLING_DECAY ** dtMs;
            current += velocity * dtMs;

            if (current <= 0 || current >= maxScroll()) {
                current = clamp(current);
                velocity = 0;
            }

            if (Math.abs(velocity) < MIN_FLING_SPEED) velocity = 0;

            target = current;

            if (velocity === 0) mode = "idle";
        }

        scroller.scrollTop = current;
        onFrame();

        if (mode !== "idle") frame = requestAnimationFrame(tick);
    };

    const run = () => {
        if (frame !== 0) return;

        last = performance.now();
        frame = requestAnimationFrame(tick);
    };

    // Whatever was moving stops where it is.
    const halt = () => {
        mode = "idle";
        velocity = 0;
        current = target = scroller.scrollTop;
    };

    // Mouse wheel and trackpad

    const onWheel = (event: WheelEvent) => {
        // Pinch zoom, handled wheels (the map) and horizontal scrolling stay as they are.
        if (event.defaultPrevented || event.ctrlKey) return;
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        if (gesture) return;

        if (mode === "idle") {
            current = target = scroller.scrollTop;
        } else if (mode !== "lerp") {
            velocity = 0;
            target = current;
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
        mode = "lerp";

        run();
    };

    // Touch

    const endGesture = (event: PointerEvent | null, fling: boolean) => {
        const ended = gesture;

        gesture = null;

        if (!ended || ended.axis !== "vertical") return;

        clickBlockedUntil = performance.now() + CLICK_BLOCK_MS;

        const now = performance.now();
        const first = ended.samples[0];
        const lastSample = ended.samples[ended.samples.length - 1];

        let speed = 0;

        if (
            fling &&
            first &&
            lastSample &&
            lastSample.time - first.time > 5 &&
            now - lastSample.time < STALE_MS
        ) {
            speed =
                (lastSample.position - first.position) /
                (lastSample.time - first.time);
            speed = Math.min(Math.max(speed, -MAX_FLING_SPEED), MAX_FLING_SPEED);
        }

        current = target;

        if (Math.abs(speed) > MIN_FLING_SPEED * 5) {
            velocity = speed;
            mode = "fling";
            run();
        } else {
            mode = "idle";
            velocity = 0;
            scroller.scrollTop = current;
            onFrame();
        }

        if (event && scroller.hasPointerCapture(event.pointerId)) {
            scroller.releasePointerCapture(event.pointerId);
        }
    };

    const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "touch") return;

        touchCount += 1;

        // A second finger is a pinch or a two-finger gesture (the map): not ours.
        if (touchCount > 1) {
            endGesture(null, false);
            return;
        }

        halt();

        gesture = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPosition: current,
            axis: "pending",
            allowHorizontal: insideHorizontalScroller(event.target, scroller),
            samples: [],
        };
    };

    const onPointerMove = (event: PointerEvent) => {
        if (!gesture || event.pointerId !== gesture.id) return;

        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;

        if (gesture.axis === "pending") {
            if (Math.hypot(dx, dy) < TOUCH_SLOP) return;

            if (gesture.allowHorizontal && Math.abs(dx) > Math.abs(dy) * 1.2) {
                gesture = null;
                return;
            }

            // The scrolling starts from where the finger is now (no jump).
            gesture.axis = "vertical";
            gesture.startY = event.clientY;
            gesture.startPosition = current;

            scroller.setPointerCapture(event.pointerId);

            mode = "drag";
            run();
        }

        target = clamp(gesture.startPosition - (event.clientY - gesture.startY));

        const now = performance.now();

        gesture.samples.push({ time: now, position: target });

        while (
            gesture.samples.length > 1 &&
            now - gesture.samples[0].time > VELOCITY_WINDOW_MS
        ) {
            gesture.samples.shift();
        }
    };

    const onPointerUp = (event: PointerEvent) => {
        if (event.pointerType !== "touch") return;

        touchCount = Math.max(touchCount - 1, 0);

        if (gesture && event.pointerId === gesture.id) {
            endGesture(event, event.type === "pointerup");
        }
    };

    // A drag is not a tap: the cards must not open their details after it.
    const onClickCapture = (event: MouseEvent) => {
        if (performance.now() < clickBlockedUntil) {
            event.stopPropagation();
            event.preventDefault();
        }
    };

    // Keyboard and scrollbar

    const onScroll = () => {
        // Our own loop already runs the effects.
        if (mode !== "idle") return;

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

    if (TOUCH_SCROLL) {
        scroller.addEventListener("pointerdown", onPointerDown);
        scroller.addEventListener("pointermove", onPointerMove);
        scroller.addEventListener("pointerup", onPointerUp);
        scroller.addEventListener("pointercancel", onPointerUp);
        scroller.addEventListener("click", onClickCapture, true);
    }

    return () => {
        scroller.removeEventListener("wheel", onWheel);
        scroller.removeEventListener("scroll", onScroll);
        scroller.removeEventListener("pointerdown", onPointerDown);
        scroller.removeEventListener("pointermove", onPointerMove);
        scroller.removeEventListener("pointerup", onPointerUp);
        scroller.removeEventListener("pointercancel", onPointerUp);
        scroller.removeEventListener("click", onClickCapture, true);
        cancelAnimationFrame(frame);
        cancelAnimationFrame(syncFrame);
    };
}