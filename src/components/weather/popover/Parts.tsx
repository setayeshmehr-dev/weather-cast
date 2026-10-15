import type { ReactNode } from "react";

import { rangeGradient } from "@/lib/temperatureColor";

type PopoverSectionProps = {
    title: string;
    subtitle?: string;
    children: ReactNode;
};

export function PopoverSection({ title, subtitle, children }: PopoverSectionProps) {
    return (
        <section className="border-t border-white/10 px-4 py-4">
            <h3 className="text-xl font-semibold">{title}</h3>

            {subtitle && (
                <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>
            )}

            <div className="mt-3">{children}</div>
        </section>
    );
}

type PopoverHeadlineProps = {
    value: string;
    unit?: string;
    caption: string;
    extra?: ReactNode;
};

/** Big value shown under the calendar. */
export function PopoverHeadline({ value, unit, caption, extra }: PopoverHeadlineProps) {
    return (
        <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
                <p className="flex items-baseline gap-1">
                    <span className="text-[44px] leading-none font-light">{value}</span>
                    {unit && <span className="text-2xl font-medium">{unit}</span>}
                </p>

                {extra}
            </div>

            <p className="mt-1 text-sm font-medium text-white/60">{caption}</p>
        </div>
    );
}

type RangeRowProps = {
    label: string;
    min: number;
    max: number;
    scaleMin: number;
    scaleMax: number;
    /** Current temperature, shown as a dot on the bar. */
    dot?: number;
};

export function RangeRow({ label, min, max, scaleMin, scaleMax, dot }: RangeRowProps) {
    const span = Math.max(scaleMax - scaleMin, 1);
    const left = ((min - scaleMin) / span) * 100;
    const width = ((max - min) / span) * 100;

    return (
        <div className="flex items-center gap-3 text-lg">
            <span className="w-22 shrink-0 font-semibold">{label}</span>
            <span className="w-9 shrink-0 text-right text-white/50">
                {Math.round(min)}°
            </span>

            <div className="relative h-1.5 flex-1 rounded-full bg-black/25">
                <div
                    className="absolute inset-y-0 min-w-1 rounded-full"
                    style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundImage: rangeGradient(min, max),
                    }}
                />

                {dot !== undefined && (
                    <span
                        className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                        style={{ left: `${((dot - scaleMin) / span) * 100}%` }}
                    />
                )}
            </div>

            <span className="w-9 shrink-0 font-semibold">{Math.round(max)}°</span>
        </div>
    );
}

type BarRowProps = {
    label: string;
    value: number;
    max: number;
    display: string;
    highlight?: boolean;
};

export function BarRow({ label, value, max, display, highlight = false }: BarRowProps) {
    const percent = Math.min(Math.max((value / max) * 100, 14), 100);

    return (
        <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
                <div
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        highlight
                            ? "bg-white text-slate-900"
                            : "bg-white/15 text-white/80"
                    }`}
                    style={{ width: `${percent}%` }}
                >
                    {label}
                </div>
            </div>

            <span className="w-16 shrink-0 text-lg font-semibold">{display}</span>
        </div>
    );
}