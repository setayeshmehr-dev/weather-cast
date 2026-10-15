"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const WIDTH = 300;
const HEIGHT = 600;
const GAP = 14;
const MARGIN = 12;
const ARROW_INSET = 28;
const MOBILE_QUERY = "(max-width: 767px)";

const PANEL_FILL = "#1c2036";
const PANEL_STROKE = "rgba(255,255,255,0.16)";

type Side = "left" | "right" | "top";

type Placement = {
    side: Side;
    top: number;
    left: number;
    height: number;
    arrow: number;
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

/*
 * Placement rules:
 *  1. not enough room below the anchor: open above it;
 *  2. otherwise open on its left when there is room on the left;
 *  3. otherwise open on its right.
 */
function computePlacement(anchor: HTMLElement): Placement {
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const height = HEIGHT;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const roomRight = viewportWidth - rect.right - GAP - MARGIN;
    const roomLeft = rect.left - GAP - MARGIN;
    const roomAbove = rect.top - GAP - MARGIN;
    const roomBelow = viewportHeight - rect.bottom - GAP - MARGIN;

    const canOpenRight = roomRight >= WIDTH;
    const canOpenLeft = roomLeft >= WIDTH;
    const canOpenBelow = roomBelow >= height;
    const canOpenAbove = roomAbove >= height;

    if (canOpenRight || canOpenLeft) {
        if (canOpenBelow || canOpenAbove) {
            const side: Side = canOpenRight ? "right" : "left";
            const top = canOpenBelow
                ? clamp(rect.top, MARGIN, viewportHeight - MARGIN - height)
                : clamp(rect.bottom - height, MARGIN, viewportHeight - MARGIN - height);

            return {
                side,
                top,
                left: side === "right"
                    ? rect.right + GAP
                    : rect.left - GAP - WIDTH,
                height,
                arrow: clamp(centerY - top, ARROW_INSET, height - ARROW_INSET),
            };
        }

        const top = clamp(
            centerY - height / 2,
            MARGIN,
            viewportHeight - MARGIN - height
        );
        const side: Side = canOpenRight ? "right" : "left";

        return {
            side,
            top,
            left: side === "right"
                ? rect.right + GAP
                : rect.left - GAP - WIDTH,
            height,
            arrow: clamp(centerY - top, ARROW_INSET, height - ARROW_INSET),
        };
    }

    const top = canOpenAbove
        ? rect.top - GAP - height
        : canOpenBelow
            ? rect.bottom + GAP
            : clamp(
                centerY - height / 2,
                MARGIN,
                viewportHeight - MARGIN - height
            );

    const left = clamp(
        centerX - WIDTH / 2,
        MARGIN,
        viewportWidth - MARGIN - WIDTH
    );

    return {
        side: "top",
        top,
        left,
        height,
        arrow: clamp(centerX - left, ARROW_INSET, WIDTH - ARROW_INSET),
    };
}

type PopoverArrowProps = {
    side: Side;
    offset: number;
};

function PopoverArrow({ side, offset }: PopoverArrowProps) {
    if (side === "top") {
        return (
            <svg
                width={16}
                height={8}
                viewBox="0 0 16 8"
                className="absolute -bottom-[7px]"
                style={{ left: offset - 8 }}
                aria-hidden="true"
            >
                <path d="M0 0 L8 8 L16 0 Z" fill={PANEL_FILL} />
                <path d="M0 0.5 L8 7.5 L16 0.5" fill="none" stroke={PANEL_STROKE} />
            </svg>
        );
    }

    // The popover is on the left of the anchor: the arrow sits on its right edge.
    const onRightEdge = side === "left";

    return (
        <svg
            width={8}
            height={16}
            viewBox="0 0 8 16"
            className={`absolute ${onRightEdge ? "-right-[7px]" : "-left-[7px]"}`}
            style={{ top: offset - 8 }}
            aria-hidden="true"
        >
            {onRightEdge ? (
                <>
                    <path d="M0 0 L8 8 L0 16 Z" fill={PANEL_FILL} />
                    <path d="M0 0.5 L7.5 8 L0 15.5" fill="none" stroke={PANEL_STROKE} />
                </>
            ) : (
                <>
                    <path d="M8 0 L0 8 L8 16 Z" fill={PANEL_FILL} />
                    <path d="M8 0.5 L0.5 8 L8 15.5" fill="none" stroke={PANEL_STROKE} />
                </>
            )}
        </svg>
    );
}

const ORIGIN: Record<Side, string> = {
    left: "origin-right",
    right: "origin-left",
    top: "origin-bottom",
};

type DetailPopoverProps = {
    anchor: HTMLElement;
    title: string;
    icon?: ReactNode;
    onClose: () => void;
    children: ReactNode;
};

export default function DetailPopover({
    anchor,
    title,
    icon,
    onClose,
    children,
}: DetailPopoverProps) {
    // The popover only exists after a click, so reading window here is safe.
    const [mobile, setMobile] = useState(
        () => window.matchMedia(MOBILE_QUERY).matches
    );
    const [placement, setPlacement] = useState(() => computePlacement(anchor));
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setMobile(window.matchMedia(MOBILE_QUERY).matches);
            setPlacement(computePlacement(anchor));
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [anchor, onClose]);

    // Moves the focus into the popover and gives it back when it closes.
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;

        panelRef.current?.focus();

        return () => previous?.focus?.();
    }, []);

    return createPortal(
        <>
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`fixed inset-0 z-40 ${
                    mobile
                        ? "bg-black/40 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0"
                        : ""
                }`}
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-label={title}
                aria-modal={mobile}
                tabIndex={-1}
                className={
                    mobile
                        ? "fixed inset-x-0 bottom-0 z-50 h-[90dvh] outline-none transition-transform duration-300 starting:translate-y-full"
                        : `fixed z-50 outline-none transition duration-150 starting:scale-95 starting:opacity-0 ${ORIGIN[placement.side]}`
                }
                style={
                    mobile
                        ? undefined
                        : {
                            top: placement.top,
                            left: placement.left,
                            width: WIDTH,
                            height: placement.height,
                        }
                }
            >
                {!mobile && (
                    <PopoverArrow side={placement.side} offset={placement.arrow} />
                )}

                <div
                    className={`flex h-full flex-col overflow-hidden border border-white/15 bg-[#1c2036]/80 text-white shadow-2xl backdrop-blur-2xl ${
                        mobile ? "rounded-t-[28px]" : "rounded-[22px]"
                    }`}
                >
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <div className="sticky top-0 z-10 flex h-14 items-center justify-center gap-2 bg-[#1c2036]/70 backdrop-blur-xl">
                            {icon}

                            <h2 className="text-base font-semibold">{title}</h2>

                            {mobile && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="absolute right-3 flex size-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                                >
                                    <X size={16} weight="bold" />
                                </button>
                            )}
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}