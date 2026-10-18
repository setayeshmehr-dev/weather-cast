export type LocalClock = {
    /** Offset of the time zone from UTC at an instant, in milliseconds. */
    offsetMsAt: (ms: number) => number;
    /** Minutes since local midnight of an instant. */
    minutesOf: (ms: number) => number;
    /** "HH:MM" of an instant in the time zone. */
    format: (ms: number) => string;
};

export function createLocalClock(timeZone: string): LocalClock {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const full = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    return {
        offsetMsAt: (ms) => {
            const list = full.formatToParts(new Date(ms));
            const get = (type: string) =>
                Number(list.find((part) => part.type === type)?.value);
            const localAsUtc = Date.UTC(
                get("year"),
                get("month") - 1,
                get("day"),
                get("hour"),
                get("minute"),
                get("second")
            );

            return localAsUtc - Math.floor(ms / 1000) * 1000;
        },
        minutesOf: (ms) => {
            const list = formatter.formatToParts(new Date(ms));
            const hour = Number(list.find((part) => part.type === "hour")?.value);
            const minute = Number(list.find((part) => part.type === "minute")?.value);

            return hour * 60 + minute;
        },
        // Truncated to the minute, like Apple Weather does.
        format: (ms) => formatter.format(new Date(ms)),
    };
}