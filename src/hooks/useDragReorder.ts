
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
        event: ReactPointerEvent<HTMLElement>
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

    const computeDropIndex = useCallback(
        (pointerY: number, draggingId: string): number => {
            const cards =
                document.querySelectorAll<HTMLElement>(
                    "[data-draggable-id]"
                );

            const filtered = Array.from(cards).filter(
                (card) =>
                    card.getAttribute("data-draggable-id") !== draggingId
            );

            for (let i = 0; i < filtered.length; i++) {
                const rect = filtered[i].getBoundingClientRect();

                if (pointerY < rect.top) return i;

                if (
                    pointerY >= rect.top &&
                    pointerY <= rect.bottom
                ) {
                    return pointerY < rect.top + rect.height / 2
                        ? i
                        : i + 1;
                }
            }

            return filtered.length;
        },
        []
    );

    const onItemPointerDown = useCallback(
        (
            id: string,
            event: ReactPointerEvent<HTMLElement>
        ) => {
            if (event.button !== 0) return;

            const index = itemsRef.current.findIndex(
                (item) => item.id === id
            );

            if (index === -1) return;

            const card =
                event.currentTarget.closest<HTMLElement>(
                    "[data-draggable-id]"
                ) ?? event.currentTarget;

            const rect = card.getBoundingClientRect();

            const pendingRef: { current: PendingDrag | null } = {
                current: {
                    id,
                    index,
                    startX: event.clientX,
                    startY: event.clientY,
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                    cardRect: {
                        width: rect.width,
                        height: rect.height,
                    },
                },
            };

            const cleanup = () => {
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", handleUp);
                window.removeEventListener("pointercancel", handleUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            const handleMove = (e: PointerEvent) => {
                const pending = pendingRef.current;

                if (pending) {
                    const dx = e.clientX - pending.startX;
                    const dy = e.clientY - pending.startY;

                    if (
                        Math.hypot(dx, dy) < DRAG_THRESHOLD_PX
                    ) {
                        return;
                    }

                    const initial: DragState = {
                        draggingId: pending.id,
                        fromIndex: pending.index,
                        pointerOffset: {
                            x: pending.offsetX,
                            y: pending.offsetY,
                        },
                        pointerPosition: {
                            x: e.clientX,
                            y: e.clientY,
                        },
                        cardRect: pending.cardRect,
                        dropIndex: computeDropIndex(
                            e.clientY,
                            pending.id
                        ),
                    };

                    setDrag(initial);
                    dragRef.current = initial;
                    pendingRef.current = null;

                    document.body.style.cursor = "grabbing";
                    document.body.style.userSelect = "none";
                    return;
                }

                const current = dragRef.current;

                if (!current) return;

                const next: DragState = {
                    ...current,
                    pointerPosition: {
                        x: e.clientX,
                        y: e.clientY,
                    },
                    dropIndex: computeDropIndex(
                        e.clientY,
                        current.draggingId
                    ),
                };

                setDrag(next);
                dragRef.current = next;
            };

            const handleUp = () => {
                cleanup();

                if (pendingRef.current) return;

                const current = dragRef.current;

                if (!current) return;

                if (current.dropIndex !== current.fromIndex) {
                    onReorderRef.current(
                        current.fromIndex,
                        current.dropIndex
                    );
                }

                setDrag(null);
                dragRef.current = null;

                setWasDragging(true);
                queueMicrotask(() => setWasDragging(false));
            };

            window.addEventListener("pointermove", handleMove, {
                passive: true,
            });

            window.addEventListener("pointerup", handleUp, {
                passive: true,
            });

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
