"use client";

import { ArrowLeft, Moon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import DetailPopover from "@/components/weather/popover/DetailPopover";
import MoonCalendar from "@/components/weather/popover/MoonCalendar";
import MoonDisc from "@/components/weather/popover/MoonDisc";
import MoonScrubber from "@/components/weather/popover/MoonScrubber";
import { PopoverSection } from "@/components/weather/popover/Parts";
import { useSmoothPhase } from "@/hooks/useSmoothPhase";
import type { CurrentWeather } from "@/hooks/useWeather";
import { createLocalClock } from "@/lib/localClock";
import { findMoonPhases, getMoonSnapshot } from "@/lib/moon";
const HOUR_MS = 3_600_000;

type RowProps = {
    label: string;
    children: ReactNode;
};

function Row({ label, children }: RowProps) {
    return (
        <div className="flex items-center justify-between border-b border-white/10 py-3 text-lg last:border-b-0">
            <span className="font-medium">{label}</span>
            <span className="font-semibold text-white/60">{children}</span>
        </div>
    );
}

type MoonPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    current: CurrentWeather;
    latitude: number;
    longitude: number;
};

export default function MoonPopover({
    anchor,
    onClose,
    current,
    latitude,
    longitude,
}: MoonPopoverProps) {
    const timeZone = current.timezone;
    const clock = useMemo(() => createLocalClock(timeZone), [timeZone]);

    const formatters = useMemo(
        () => ({
            key: new Intl.DateTimeFormat("en-CA", {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }),
            full: new Intl.DateTimeFormat("en-US", {
                timeZone,
                weekday: "long",
                month: "long",
                day: "numeric",
            }),
            day: new Intl.DateTimeFormat("en-US", {
                timeZone,
                month: "long",
                day: "numeric",
            }),
            short: new Intl.DateTimeFormat("en-US", {
                timeZone,
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
        }),
        [timeZone]
    );

    // Continuous while the time strip is dragged; whole hours otherwise.
    const [offsetHours, setOffsetHours] = useState(0);
    const [monthOverride, setMonthOverride] = useState<{
        year: number;
        month: number;
    } | null>(null);

    // "Now", at the start of the current local hour.
    const nowMs = Date.parse(`${current.time}Z`) - current.utcOffsetSeconds * 1000;
    const baseMs = nowMs - (clock.minutesOf(nowMs) % 60) * 60_000 - (nowMs % 60_000);

    const hourOffset = Math.round(offsetHours);
    const time = baseMs + hourOffset * HOUR_MS;


    // The texts use the nearest hour; the drawing follows the exact time, smoothed.
    const snapshot = useMemo(
        () =>
            getMoonSnapshot({
                ms: time,
                utcOffsetSeconds: clock.offsetMsAt(time) / 1000,
                latitude,
                longitude,
            }),
        [time, clock, latitude, longitude]
    );

    // The shadow glides toward the phase instead of jumping.
    const phase = useSmoothPhase(snapshot.phase);

    const todayKey = formatters.key.format(nowMs);
    const selectedKey = formatters.key.format(time);
    const view = monthOverride ?? {
        year: Number(selectedKey.slice(0, 4)),
        month: Number(selectedKey.slice(5, 7)) - 1,
    };

    const phases = useMemo(() => {
        const start = Date.UTC(view.year, view.month, 1);
        const end = Date.UTC(view.year, view.month + 1, 1);

        return findMoonPhases(
            start - clock.offsetMsAt(start),
            end - clock.offsetMsAt(end)
        );
    }, [view.year, view.month, clock]);

    const dates = (list: number[]) =>
        list.length ? list.map((ms) => formatters.short.format(ms)).join(", ") : "–";

    const selectDay = (key: string) => {
        const [year, month, day] = key.split("-").map(Number);
        const hour = Math.floor(clock.minutesOf(baseMs) / 60);
        const guess = Date.UTC(year, month - 1, day, hour);
        const target = guess - clock.offsetMsAt(guess);

        setOffsetHours(Math.round((target - baseMs) / HOUR_MS));
        setMonthOverride(null);
    };

    const events = [
        { label: "Moonrise", ms: snapshot.moonrise },
        { label: "Moonset", ms: snapshot.moonset },
    ].sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity));

    const fullMoonDays = Math.round(snapshot.daysToFullMoon);
    const isNow = hourOffset === 0;

    const dateLine = isNow
        ? `${formatters.full.format(time)} at ${clock.format(time)}`
        : `${formatters.day.format(time)} at ${clock.format(time)}`;

    return (
        <DetailPopover
            anchor={anchor}
            title="Moon"
            icon={<Moon size={18} weight="fill" />}
            onClose={onClose}
        >
            <div className="flex justify-center px-4 pt-2">
                <MoonDisc phase={phase} className="size-50" />
            </div>

            <div className="relative px-4 pt-4 text-center">
                {!isNow && (
                    <button
                        type="button"
                        aria-label="Back to now"
                        onClick={() => {
                            setOffsetHours(0);
                            setMonthOverride(null);
                        }}
                        className="absolute top-8 left-4 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#5ac8fa] text-[#5ac8fa] hover:bg-[#5ac8fa]/10"
                    >
                        <ArrowLeft size={18} weight="bold" />
                    </button>
                )}

                <h3 className="text-2xl font-semibold">{snapshot.name}</h3>
                <p
                    className={`text-base font-medium ${
                        isNow ? "text-white" : "text-white/60"
                    }`}
                >
                    {dateLine}
                </p>
            </div>

            <div className="px-4 pt-3 pb-2">
                <MoonScrubber
                    baseMs={baseMs}
                    offsetHours={offsetHours}
                    onOffsetChange={(next) => {
                        setOffsetHours(next);
                        setMonthOverride(null);
                    }}
                    clock={clock}
                    timeZone={timeZone}
                    todayKey={todayKey}
                />
            </div>

            <div className="px-4 pb-3">
                <Row label="Illumination">
                    {Math.round(snapshot.illumination * 100)}%
                </Row>

                {events.map((event) => (
                    <Row key={event.label} label={event.label}>
                        {event.ms === null ? "–" : clock.format(event.ms)}
                    </Row>
                ))}

                <Row label="Next Full Moon">
                    {fullMoonDays === 0 ? (
                        "Today"
                    ) : (
                        <>
                            {fullMoonDays}{" "}
                            <span className="text-[0.75em] uppercase">
                                {fullMoonDays === 1 ? "day" : "days"}
                            </span>
                        </>
                    )}
                </Row>

                <Row label="Distance">
                    {Math.round(snapshot.distanceKm).toLocaleString("en-US")}{" "}
                    <span className="text-[0.75em] uppercase">km</span>
                </Row>
            </div>

            <PopoverSection title="Calendar">
                <MoonCalendar
                    year={view.year}
                    month={view.month}
                    latitude={latitude}
                    clock={clock}
                    todayKey={todayKey}
                    selectedKey={selectedKey}
                    onSelect={selectDay}
                    onShift={(step) => {
                        const date = new Date(Date.UTC(view.year, view.month + step, 1));

                        setMonthOverride({
                            year: date.getUTCFullYear(),
                            month: date.getUTCMonth(),
                        });
                    }}
                />

                <div className="mt-3">
                    <Row label="New Moon">{dates(phases.newMoons)}</Row>
                    <Row label="Full Moon">{dates(phases.fullMoons)}</Row>
                </div>
            </PopoverSection>

            <PopoverSection title="About Illumination">
                <p className="text-base leading-snug text-white/90">
                    Illumination is the share of the moon&apos;s Earth-facing side
                    that is lit by the sun: 100% at a full moon and 0% at a new
                    moon. It does not depend on whether the moon is above your
                    horizon or on the clouds, so it can be above zero even when you
                    cannot see the moon.
                </p>
            </PopoverSection>

            <PopoverSection title="About Moon Distance">
                <p className="text-base leading-snug text-white/90">
                    The moon moves on an elliptical orbit, so its distance from
                    Earth changes during the month. The distance shown is measured
                    between the centers of the two bodies. When the moon is full
                    and near its closest point, it looks larger and brighter.
                </p>
            </PopoverSection>
        </DetailPopover>
    );
}