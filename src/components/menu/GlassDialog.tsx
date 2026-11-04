"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type RoundButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
};

/** The round glass buttons of the dialog header. */
export function RoundButton({ label, onClick, disabled, children }: RoundButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10"
        >
            {children}
        </button>
    );
}

type GlassDialogProps = {
    title: string;
    onClose: () => void;
    /** The button on the right of the header (done, send...). */
    action?: ReactNode;
    /** Shows the close button on the left of the header. */
    showClose?: boolean;
    children: ReactNode;
};

/*
 * A frosted glass dialog: a modal in the middle of the screen on large screens, and
 * the full screen on phones.
 */
export default function GlassDialog({
    title,
    onClose,
    action,
    showClose = true,
    children,
}: GlassDialogProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const closeRef = useRef(onClose);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        closeRef.current = onClose;
    });

    useEffect(() => {
        const previous =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        panelRef.current?.focus();

        const frame = requestAnimationFrame(() => setShown(true));

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeRef.current();
        };

        document.addEventListener("keydown", onKey);

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("keydown", onKey);
            previous?.focus();
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-80">
            <div
                aria-hidden="true"
                onClick={() => closeRef.current()}
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 max-md:hidden ${
                    shown ? "opacity-100" : "opacity-0"
                }`}
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`absolute flex flex-col overflow-hidden text-white outline-none backdrop-blur-3xl transition duration-200 max-md:inset-0 md:top-1/2 md:left-1/2 md:max-h-[min(86dvh,780px)] md:w-[min(92vw,460px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-4xl md:border md:shadow-2xl md:border-white/10
                        bg-[#0f0f14]/70
                        supports-backdrop-filter:bg-[#0f0f14]/55
                        supports-backdrop-filter:backdrop-blur-2xl
                        supports-backdrop-filter:backdrop-saturate-[1.8]
                        ${shown ? "opacity-100 md:scale-100" : "opacity-0 md:scale-95"}
                    `}
            >
                <header className="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-4 pb-3 max-md:pt-[max(1rem,env(safe-area-inset-top))]">
                    {showClose ? (
                        <RoundButton label="Close" onClick={() => closeRef.current()}>
                            <X size={22} weight="bold" />
                        </RoundButton>
                    ) : (
                        <span />
                    )}

                    <h2 id={titleId} className="text-center text-[17px] font-semibold">
                        {title}
                    </h2>

                    <div className="flex justify-end">{action}</div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 max-md:pb-[max(2rem,env(safe-area-inset-bottom))]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}