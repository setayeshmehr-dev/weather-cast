"use client";

import {
    ChatCircleDots,
    CloudSun,
    DotsThreeVertical,
    Ruler,
} from "@phosphor-icons/react";
import { useWeatherIconStyle } from "@/components/weather/WeatherIcon";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import ReportIssueDialog from "@/components/menu/ReportIssueDialog";
import UnitsDialog from "@/components/menu/UnitsDialog";
import type { City } from "@/lib/cities";

const GLASS_ROUND_ICON =
    "group relative flex size-10 items-center justify-center overflow-hidden rounded-full " +
    "text-white/70 " +
    "backdrop-blur-md backdrop-saturate-150 backdrop-brightness-105 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_16px_rgba(17,17,26,0.12)] " +
    "transition-all duration-200 hover:scale-105 active:scale-90 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 " +
    // frosted tint + diagonal sheen in one gradient (::before)
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-full " +
    "before:bg-[linear-gradient(135deg,rgba(255,255,255,0.60),rgba(255,255,255,0.1)_38%,rgba(255,255,255,0.1)_62%,rgba(255,255,255,0.3))] " +
    "hover:before:bg-[linear-gradient(135deg,rgba(255,255,255,0.42),rgba(255,255,255,0.14)_38%,rgba(255,255,255,0.14)_62%,rgba(255,255,255,0.26))] " +
    // gradient rim (::after)
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:p-px " +
    "after:bg-[linear-gradient(150deg,rgba(255,255,255,0.7),rgba(255,255,255,0.12)_45%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.45))] " +
    "after:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] " +
    "after:[-webkit-mask-composite:xor] " +
    "after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

const BUTTON_CLASS =
    "flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:size-10";

type MenuItemProps = {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    checked?: boolean;
};

function MenuItem({ icon, label, onClick, checked }: MenuItemProps) {
    return (
        <button
            type="button"
            role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
            aria-checked={checked}
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
    const { style: iconStyle, toggleStyle: toggleIconStyle } = useWeatherIconStyle();

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
                        className={GLASS_ROUND_ICON}
                    >
                        <DotsThreeVertical size={28} weight="bold" />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className={`absolute top-full right-0 z-40 g-1 mt-2 w-64 rounded-3xl border border-white/10 p-1.5 text-white shadow-2xl backdrop-blur-2xl
                                bg-[#0f0f14]/30
                                supports-backdrop-filter:bg-[#0f0f14]/25
                                supports-backdrop-filter:backdrop-blur-2xl
                                supports-backdrop-filter:backdrop-saturate-[1.8]
                            `}
                        >

                            <MenuItem
                                icon={
                                    <CloudSun
                                        size={22}
                                        weight={iconStyle === "fill" ? "fill" : "regular"}
                                    />
                                }
                                label="Icon Style"
                                checked={iconStyle === "fill"}
                                onClick={() => {
                                    toggleIconStyle();
                                    setMenuOpen(false);
                                }}
                            />

                            <MenuItem
                                icon={<Ruler size={22} />}
                                label="Units"
                                onClick={() => open("units")}
                            />

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