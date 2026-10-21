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
    dropIndicator: { id: string; position: "above" | "below" } | null;
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
    dropIndicator: { id: string; position: "above" | "below" } | null;
    wasDragging: boolean;
    onItemPointerDown: (
        id: string,
        index: number,
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

    const computeDropIndicator = useCallback(
        (pointerY: number, draggingId: string) => {
            const cards =
                document.querySelectorAll<HTMLElement>("[data-draggable-id]");
            for (const c of Array.from(cards)) {
                const cid = c.getAttribute("data-draggable-id");
                if (!cid || cid === draggingId) continue;

                const r = c.getBoundingClientRect();
                if (pointerY < r.top || pointerY > r.bottom) continue;

                const isUpperHalf = pointerY < r.top + r.height / 2;
                return { id: cid, position: isUpperHalf ? ("above" as const) : ("below" as const) };
            }
            return null;
        },
        []
    );

    const computeToIndex = useCallback(
        (fromIndex: number, targetId: string, position: "above" | "below") => {
            const items = itemsRef.current;
            const targetIndex = items.findIndex((c) => c.id === targetId);
            if (targetIndex === -1) return null;
            if (targetIndex === fromIndex) return fromIndex;

            const insertionPoint =
                position === "above" ? targetIndex : targetIndex + 1;
            return fromIndex < insertionPoint
                ? insertionPoint - 1
                : insertionPoint;
        },
        []
    );

    const onItemPointerDown = useCallback(
        (id: string, index: number, event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;

            const card = event.currentTarget;
            const rect = card.getBoundingClientRect();

            // FIX #1: explicit nullable type so we can set `current = null`
            // once the threshold is met.
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

            // FIX #2: use the global DOM `PointerEvent` type (not React's)
            // because these listeners go on `window`, which expects the DOM
            // PointerEvent interface.
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
                        dropIndicator: computeDropIndicator(e.clientY, p.id),
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
                    dropIndicator: computeDropIndicator(e.clientY, d.draggingId),
                });
            };

            const handleUp = () => {
                cleanup();

                if (pendingRef.current) return;

                const d = dragRef.current;
                if (!d) return;

                if (d.dropIndicator) {
                    const toIndex = computeToIndex(
                        d.fromIndex,
                        d.dropIndicator.id,
                        d.dropIndicator.position
                    );
                    if (toIndex !== null && toIndex !== d.fromIndex) {
                        onReorderRef.current(d.fromIndex, toIndex);
                    }
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

            window.addEventListener("pointermove", handleMove, { passive: true });
            window.addEventListener("pointerup", handleUp, { passive: true });
            window.addEventListener("pointercancel", handleUp, { passive: true });
        },
        [computeDropIndicator, computeToIndex]
    );

    return {
        draggingId: drag?.draggingId ?? null,
        pointerPosition: drag?.pointerPosition ?? null,
        pointerOffset: drag?.pointerOffset ?? { x: 0, y: 0 },
        cardRect: drag?.cardRect ?? null,
        dropIndicator: drag?.dropIndicator ?? null,
        wasDragging,
        onItemPointerDown,
    };
}