"use client";

import { Check } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type SectionTitleProps = {
    children: ReactNode;
    /** A smaller line under the title. */
    hint?: string;
    muted?: boolean;
};

export function SectionTitle({ children, hint, muted }: SectionTitleProps) {
    return (
        <div className="mt-6 mb-2 px-1">
            <h3
                className={`text-[17px] font-semibold ${
                    muted ? "text-white/60" : "text-white"
                }`}
            >
                {children}
            </h3>

            {hint && <p className="text-[15px] text-white/50">{hint}</p>}
        </div>
    );
}

/** Rounded block of rows, separated by thin lines. */
export function Group({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-[22px] bg-white/10 [&>*+*]:border-t [&>*+*]:border-white/10">
            {children}
        </div>
    );
}

type ChoiceRowProps = {
    icon?: ReactNode;
    label: string;
    selected: boolean;
    onSelect: () => void;
};

/** A row that can be selected; the selected one shows a check mark. */
export function ChoiceRow({ icon, label, selected, onSelect }: ChoiceRowProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left text-[17px] transition-colors hover:bg-white/5"
        >
            {icon && (
                <span className="flex w-8 shrink-0 items-center justify-center">
                    {icon}
                </span>
            )}

            <span className="flex-1">{label}</span>

            {selected && (
                <Check size={20} weight="bold" className="shrink-0 text-sky-300" />
            )}
        </button>
    );
}

type SwitchRowProps = {
    icon?: ReactNode;
    label: string;
    checked: boolean;
    onChange: () => void;
};

/** A row with an on/off switch. */
export function SwitchRow({ icon, label, checked, onChange }: SwitchRowProps) {
    return (
        <div className="flex items-center gap-3.5 px-4 py-3">
            {icon && (
                <span className="flex w-8 shrink-0 items-center justify-center">
                    {icon}
                </span>
            )}

            <span className="flex-1 text-[17px]">{label}</span>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={onChange}
                className={`relative h-7.75 w-12.75 shrink-0 rounded-full transition-colors ${
                    checked ? "bg-[#34c759]" : "bg-white/25"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 size-6.75 rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}