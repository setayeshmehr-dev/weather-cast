"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const DRAG_THRESHOLD_PX = 5;

type Item = { id: string };

type DragState = {
    draggingId: string;
    fromIndex: number;
    pointerOffset: { x: number; y: number };
    pointerPosition: { x: number; y: number };
    cardRect: { width: number; height: number };
    /**
     * Index in the FILTERED list (excluding the dragged card) where the
     * dragged card would land if released right now. The Sidebar renders
     * an empty spacer `<li>` at this index — the other cards naturally
     * shift to make room, achieving the iOS-Springboard "live shift" effect.
     */
    dropIndex: number;
};

type PendingDrag = {
    id: string;
    index: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    cardRect: { width: number; height: number };
};

export type UseDragReorderReturn = {
    draggingId: string | null;
    pointerPosition: { x: number; y: number } | null;
    pointerOffset: { x: number; y: number };
    cardRect: { width: number; height: number } | null;
    dropIndex: number | null;
    wasDragging: boolean;
    onItemPointerDown: (
        id: string,
        event: ReactPointerEvent<HTMLDivElement>
    ) => void;
};

export function useDragReorder<T extends Item>(
    items: T[],
    onReorder: (from: number, to: number) => void
): UseDragReorderReturn {
    const [drag, setDrag] = useState<DragState | null>(null);
    const [wasDragging, setWasDragging] = useState(false);

    const itemsRef = useRef(items);
    const onReorderRef = useRef(onReorder);
    const dragRef = useRef<DragState | null>(null);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);
    useEffect(() => {
        onReorderRef.current = onReorder;
    }, [onReorder]);
    useEffect(() => {
        dragRef.current = drag;
    }, [drag]);

    /**
     * Compute the live drop index — the position in the filtered list
     * (excluding the dragged card) where the dragged card would land if
     * released at the current pointer Y.
     *
     * For each non-dragged card, in DOM order:
     *   - If pointer Y is above the card's top → insert before it (return i)
     *   - If pointer Y is on the card:
     *       - upper half → insert before it (return i)
     *       - lower half → insert after it (return i + 1)
     *
     * If pointer Y is below all cards → insert at the end
     * (return filtered.length).
     *
     * When the dragged card is still in the DOM (right when the threshold
     * is met, before React re-renders), it's skipped — but the cursor is
     * typically within its bounds, so the loop falls through to the next
     * card below it, which gives the correct "no-op" dropIndex matching
     * the dragged card's original position.
     */
    const computeDropIndex = useCallback(
        (pointerY: number, draggingId: string): number => {
            const cards =
                document.querySelectorAll<HTMLElement>("[data-draggable-id]");
            const filtered = Array.from(cards).filter(
                (c) => c.getAttribute("data-draggable-id") !== draggingId
            );

            for (let i = 0; i < filtered.length; i++) {
                const r = filtered[i].getBoundingClientRect();

                if (pointerY < r.top) return i;

                if (pointerY >= r.top && pointerY <= r.bottom) {
                    const isUpperHalf = pointerY < r.top + r.height / 2;
                    return isUpperHalf ? i : i + 1;
                }
            }

            return filtered.length;
        },
        []
    );

    const onItemPointerDown = useCallback(
        (id: string, event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;

            // Look up the original index of the dragged item in the items
            // array. We pass just the id from the Sidebar — the hook owns
            // the index lookup so the Sidebar doesn't have to compute it.
            const index = itemsRef.current.findIndex((item) => item.id === id);
            if (index === -1) return;

            const card = event.currentTarget;
            const rect = card.getBoundingClientRect();

            const pendingRef: { current: PendingDrag | null } = {
                current: {
                    id,
                    index,
                    startX: event.clientX,
                    startY: event.clientY,
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                    cardRect: { width: rect.width, height: rect.height },
                },
            };

            const handleMove = (e: PointerEvent) => {
                const p = pendingRef.current;

                if (p) {
                    const dx = e.clientX - p.startX;
                    const dy = e.clientY - p.startY;
                    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

                    const initial: DragState = {
                        draggingId: p.id,
                        fromIndex: p.index,
                        pointerOffset: { x: p.offsetX, y: p.offsetY },
                        pointerPosition: { x: e.clientX, y: e.clientY },
                        cardRect: p.cardRect,
                        dropIndex: computeDropIndex(e.clientY, p.id),
                    };
                    setDrag(initial);
                    dragRef.current = initial;
                    pendingRef.current = null;

                    document.body.style.cursor = "grabbing";
                    document.body.style.userSelect = "none";
                    return;
                }

                const d = dragRef.current;
                if (!d) return;

                setDrag({
                    ...d,
                    pointerPosition: { x: e.clientX, y: e.clientY },
                    dropIndex: computeDropIndex(e.clientY, d.draggingId),
                });
            };

            const handleUp = () => {
                cleanup();

                if (pendingRef.current) return;

                const d = dragRef.current;
                if (!d) return;

                /*
                 * dropIndex is the index in the FILTERED array (after removal).
                 * The store's reorderCities does:
                 *   splice(from, 1)  → array shrinks by 1
                 *   splice(to, 0, x) → x goes to position `to` in the new array
                 * So `to = dropIndex` is exactly what the store expects.
                 *
                 * If dropIndex === fromIndex, the dragged card lands at its
                 * original position — a no-op. We skip the onReorder call
                 * entirely so the store doesn't trigger an unnecessary
                 * state update + localStorage write.
                 */
                if (d.dropIndex !== d.fromIndex) {
                    onReorderRef.current(d.fromIndex, d.dropIndex);
                }

                setDrag(null);
                dragRef.current = null;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";

                setWasDragging(true);
                queueMicrotask(() => setWasDragging(false));
            };

            const cleanup = () => {
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", handleUp);
                window.removeEventListener("pointercancel", handleUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            window.addEventListener("pointermove", handleMove, {
                passive: true,
            });
            window.addEventListener("pointerup", handleUp, { passive: true });
            window.addEventListener("pointercancel", handleUp, {
                passive: true,
            });
        },
        [computeDropIndex]
    );

    return {
        draggingId: drag?.draggingId ?? null,
        pointerPosition: drag?.pointerPosition ?? null,
        pointerOffset: drag?.pointerOffset ?? { x: 0, y: 0 },
        cardRect: drag?.cardRect ?? null,
        dropIndex: drag?.dropIndex ?? null,
        wasDragging,
        onItemPointerDown,
    };
}