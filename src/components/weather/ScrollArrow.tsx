"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type ScrollArrowProps = {
    side: "left" | "right";
    visible: boolean;
    /** Vertical middle (px from the top of the card). */
    top: number | null;
    /** A touch screen: the arrow is a round button inside the card. */
    touch?: boolean;
    onClick: () => void;
};

/*
 * With a mouse the arrow sits on the edge of the card, in the gutter next to it, and
 * the button is bigger than the arrow so reaching for it does not take the pointer out
 * of the card. On a touch screen it is a round glass button over the list.
 */
export default function ScrollArrow({
    side,
    visible,
    top,
    touch = false,
    onClick,
}: ScrollArrowProps) {
    const Icon = side === "left" ? CaretLeft : CaretRight;

    const placement = touch
        ? `size-10 rounded-full border border-white/25 bg-slate-900/45 backdrop-blur-md ${
            side === "left" ? "left-2" : "right-2"
        }`
        : `h-16 w-10 ${side === "left" ? "-left-10" : "-right-10"}`;

    return (
        <button
            type="button"
            aria-label={side === "left" ? "Scroll left" : "Scroll right"}
            tabIndex={visible ? 0 : -1}
            onClick={(event) => {
                // The card opens its details on click: this click is only for scrolling.
                event.stopPropagation();
                onClick();
            }}
            className={`hidden  absolute z-20 md:flex -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity duration-200 ${placement} ${
                visible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ top: top ?? "50%" }}
        >
            <Icon
                size={touch ? 20 : 28}
                weight={touch ? "bold" : "regular"}
                className={touch ? "" : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"}
            />
        </button>
    );
}