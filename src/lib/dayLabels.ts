import type { HourlyPoint, WeatherDetails } from "@/hooks/useWeather";

const DAY_MS = 86_400_000;

// A date is "YYYY-MM-DD"; noon avoids any day shift from time zones.
function parse(date: string): Date {
    return new Date(`${date}T12:00:00`);
}

export const weekdayLong = (date: string) =>
    parse(date).toLocaleDateString("en-US", { weekday: "long" });

export const weekdayShort = (date: string) =>
    parse(date).toLocaleDateString("en-US", { weekday: "short" });

export const weekdayInitial = (date: string) => weekdayLong(date).charAt(0);

export const dayOfMonth = (date: string) => parse(date).getDate();

export const fullDate = (date: string) =>
    parse(date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

function dayOffset(date: string, todayDate: string): number {
    return Math.round((parse(date).getTime() - parse(todayDate).getTime()) / DAY_MS);
}

/** "Today", "Yesterday", "Tomorrow" or the short weekday. */
export function relativeLabel(date: string, todayDate: string): string {
    const offset = dayOffset(date, todayDate);

    if (offset === 0) return "Today";
    if (offset === -1) return "Yesterday";
    if (offset === 1) return "Tomorrow";

    return weekdayShort(date);
}

/** Phrase for a sentence: "today", "yesterday", "tomorrow" or "on Friday". */
export function sentenceLabel(date: string, todayDate: string): string {
    const offset = dayOffset(date, todayDate);

    if (offset === 0) return "today";
    if (offset === -1) return "yesterday";
    if (offset === 1) return "tomorrow";

    return `on ${weekdayLong(date)}`;
}

/** Same as sentenceLabel, without the "on": "today", ..., "Friday". */
export function bareLabel(date: string, todayDate: string): string {
    const offset = dayOffset(date, todayDate);

    if (offset === 0) return "today";
    if (offset === -1) return "yesterday";
    if (offset === 1) return "tomorrow";

    return weekdayLong(date);
}

export function hoursOfDay(details: WeatherDetails, date: string): HourlyPoint[] {
    return details.hours.filter((hour) => hour.time.startsWith(date));
}

/** "2026-10-15T01:20" -> "01:20" */
export function clock(time: string): string {
    return time.slice(11, 16);
}

/** "2026-10-15T01:30" -> 1.5 */
export function hourFraction(time: string): number {
    return Number(time.slice(11, 13)) + Number(time.slice(14, 16)) / 60;
}