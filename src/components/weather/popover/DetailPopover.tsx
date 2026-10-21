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

/*
 * SVG arrow fills can't carry backdrop-filter, so we approximate the frosted
 * dark glass panel with a near-opaque dark color (#16161c) that visually
 * matches the panel's appearance against most backgrounds. The stroke mirrors
 * the 1px hairline border used on the panel itself (rgba(255,255,255,0.08)).
 */
const PANEL_FILL = "#16161c";
const PANEL_STROKE = "rgba(255,255,255,0.08)";

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
                className="absolute -bottom-1.75"
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
            className={`absolute ${onRightEdge ? "-right-1.75" : "-left-1.75"}`}
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
                        ? "bg-black/40 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
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
                        ? "fixed inset-x-0 bottom-0 z-50 h-[90dvh] outline-none transition-transform duration-300 starting:translate-y-full motion-reduce:transition-none motion-reduce:duration-0"
                        : `fixed z-50 outline-none transition duration-150 starting:scale-95 starting:opacity-0 motion-reduce:transition-none motion-reduce:duration-0 ${ORIGIN[placement.side]}`
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

                {/*
                 * Frosted dark glass sheet (Apple Weather style).
                 *
                 * Background layering strategy:
                 *   1. Default (no backdrop-filter support): bg-[#0f0f14]/70 — a
                 *      semi-opaque dark fill that still reads correctly over busy
                 *      backgrounds.
                 *   2. With backdrop-filter (modern browsers): bg-[#0f0f14]/55 +
                 *      backdrop-blur-2xl (blur 40px) + backdrop-saturate-[1.8]
                 *      (saturate 180%). Whatever sits behind the popover bleeds
                 *      through as a soft blurred glow.
                 *
                 * Border: white/10 hairline outline for the "lit glass edge" look.
                 */}
                <div
                    className={`relative flex h-full flex-col overflow-hidden border border-white/10 text-white shadow-2xl
                        bg-[#0f0f14]/70
                        supports-[backdrop-filter]:bg-[#0f0f14]/55
                        supports-[backdrop-filter]:backdrop-blur-2xl
                        supports-[backdrop-filter]:backdrop-saturate-[1.8]
                        ${mobile ? "rounded-t-[28px]" : "rounded-[22px]"}`}
                >
                    {/* 1px lit-glass hairline along the very top edge of the panel */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-white/10"
                    />

                    {/*
                     * Pinned header — now a SIBLING of the scroll container, not
                     * a child. This is the bulletproof fix for the overscroll
                     * problem: even if the scroll container rubber-bands on iOS
                     * Safari or Chrome, the header is structurally outside the
                     * scroll context and cannot be dragged along.
                     */}
                    <header className="relative z-10 flex h-14 shrink-0 items-center justify-center gap-2 bg-[#0a0a0f]/35">
                        {/* Soft 1px shadow at the header's bottom edge for depth */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/25"
                        />
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
                    </header>

                    {/*
                     * Scroll container — only the body content scrolls.
                     *
                     * `overscroll-none` (overscroll-behavior: none) kills the
                     * rubber-band bounce and pull-to-refresh gesture at both
                     * scroll boundaries on modern browsers. The explicit
                     * [overscroll-behavior:none] and [-webkit-overflow-scrolling:auto]
                     * fallbacks catch older iOS Safari variants.
                     *
                     * Custom scrollbar styling (Apple Weather style):
                     *   - Thin 6px thumb (w-1.5)
                     *   - Translucent white thumb (bg-white/15) — visible on the
                     *     frosted dark glass but unobtrusive
                     *   - Transparent track — no "tunnel" ever, even on hover
                     *   - No hover state change — thumb stays the same color
                     *     whether the pointer is over it or not
                     *
                     * These arbitrary-variant rules compile to:
                     *   .scoped-class::-webkit-scrollbar-thumb:hover { ... }
                     * which has higher specificity (0,2,1) than any global
                     * ::-webkit-scrollbar-thumb:hover rule (0,1,1), so they win
                     * even if there's a global stylesheet trying to set them.
                     *
                     * Firefox support: `scrollbar-width: thin` (replaces the
                     * default thick bar) + `scrollbar-color` (thumb + track).
                     */}
                    <div
                        className="min-h-0 flex-1 overflow-y-auto overscroll-none [overscroll-behavior:none] [-webkit-overflow-scrolling:auto]
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-white/15
                            [&::-webkit-scrollbar-thumb:hover]:bg-white/15
                            [&::-webkit-scrollbar-thumb:active]:bg-white/25
                            [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-track:hover]:bg-transparent
                            [scrollbar-width:thin]
                            [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}