"use client";

import { ChatCircleDots, DotsThreeVertical, Ruler } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import ReportIssueDialog from "@/components/menu/ReportIssueDialog";
import UnitsDialog from "@/components/menu/UnitsDialog";
import type { City } from "@/lib/cities";

const BUTTON_CLASS =
    "flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:size-10";

type MenuItemProps = {
    icon: ReactNode;
    label: string;
    onClick: () => void;
};

function MenuItem({ icon, label, onClick }: MenuItemProps) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-[17px] transition-colors hover:bg-white/10"
        >
            <span className="flex w-6 shrink-0 justify-center text-white/80">
                {icon}
            </span>
            {label}
        </button>
    );
}

type TopRightControlsProps = {
    city: City;
    /** Extra buttons shown to the left of the menu button. */
    children?: ReactNode;
};

/*
 * The buttons fixed at the top right, as the sidebar button is at the top left:
 * the menu (units, report an issue) and, to its left, any extra buttons.
 */
export default function TopRightControls({ city, children }: TopRightControlsProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialog, setDialog] = useState<"units" | "report" | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // The menu closes on a click outside it, and on Escape.
    useEffect(() => {
        if (!menuOpen) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    const open = (name: "units" | "report") => {
        setMenuOpen(false);
        setDialog(name);
    };

    return (
        <>
            <div className="absolute top-0 right-0 z-30 flex items-center gap-2 p-3">
                {children}

                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        aria-label="More options"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((value) => !value)}
                        className={BUTTON_CLASS}
                    >
                        <DotsThreeVertical size={22} weight="bold" />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className={`absolute top-full right-0 z-40 mt-2 w-64 rounded-3xl border border-white/10 p-1.5 text-white shadow-2xl backdrop-blur-2xl
                                bg-[#0f0f14]/70
                                supports-backdrop-filter:bg-[#0f0f14]/55
                                supports-backdrop-filter:backdrop-blur-2xl
                                supports-backdrop-filter:backdrop-saturate-[1.8]
                            `}
                        >
                            <MenuItem
                                icon={<Ruler size={22} />}
                                label="Units"
                                onClick={() => open("units")}
                            />

                            <div className="mx-4 my-1 h-px bg-white/10" />

                            <MenuItem
                                icon={<ChatCircleDots size={22} />}
                                label="Report an Issue"
                                onClick={() => open("report")}
                            />
                        </div>
                    )}
                </div>
            </div>

            {dialog === "units" && <UnitsDialog onClose={() => setDialog(null)} />}

            {dialog === "report" && (
                <ReportIssueDialog city={city} onClose={() => setDialog(null)} />
            )}
        </>
    );
}