"use client";

import { useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

type PopoverContext = {
    anchor: HTMLElement;
    target: HTMLElement;
    close: () => void;
};

type DetailTriggerProps = {
    label: string;
    disabled?: boolean;
    className?: string;
    popover: (context: PopoverContext) => ReactNode;
    children: ReactNode;
};

export default function DetailTrigger({
    label,
    disabled = false,
    className = "",
    popover,
    children,
}: DetailTriggerProps) {
    const [opened, setOpened] = useState<{
        anchor: HTMLElement;
        target: HTMLElement;
    } | null>(null);

    const openFrom = (root: HTMLElement, target: HTMLElement) => {
        if (disabled) return;

        setOpened({
            anchor: target.closest<HTMLElement>("[data-popover-anchor]") ?? root,
            target,
        });
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        openFrom(event.currentTarget, event.target as HTMLElement);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFrom(event.currentTarget, event.currentTarget);
        }
    };

    return (
        <>
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-haspopup="dialog"
                aria-label={label}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                className={`flex [&>section]:min-w-0 [&>section]:flex-1 ${
                    disabled ? "" : "cursor-pointer"
                } ${className}`}
            >
                {children}
            </div>

            {opened &&
                popover({ ...opened, close: () => setOpened(null) })}
        </>
    );
}