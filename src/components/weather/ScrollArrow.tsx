"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type ScrollArrowProps = {
    side: "left" | "right";
    visible: boolean;
    /** Vertical middle (px from the top of the card). */
    top: number | null;
    onClick: () => void;
};

/*
 * The arrow sits on the edge of the card, in the gutter next to it. The button is
 * bigger than the arrow, so reaching for it does not take the pointer out of the card.
 */
export default function ScrollArrow({ side, visible, top, onClick }: ScrollArrowProps) {
    const Icon = side === "left" ? CaretLeft : CaretRight;

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
            className={`absolute z-20 flex h-16 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity duration-200 ${
                side === "left" ? "-left-7" : "-right-7"
            } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ top: top ?? "50%" }}
        >
            <Icon
                size={28}
                weight="regular"
                className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
            />
        </button>
    );
}