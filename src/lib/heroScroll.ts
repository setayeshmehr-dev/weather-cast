/*
 * Sizes (px) of the lines of the weather header. They are fixed numbers on purpose:
 * the header is out of the layout, so nothing else depends on its real height, and
 * the cards fade at exactly the bottom of the header.
 */
export const HERO_TOP = 20;
export const HERO_NAME_HEIGHT = 42;
export const HERO_LINE_HEIGHT = 28;
export const HERO_TEMP_HEIGHT = 96;

// Distance between the expanded header and the first card.
export const HERO_GAP = 32;
export const HERO_STOP = HERO_TOP + HERO_NAME_HEIGHT + HERO_GAP;



/** Height of the header when everything is shown. */
export const HERO_FULL_HEIGHT =
    HERO_TOP + HERO_NAME_HEIGHT + 2 * HERO_LINE_HEIGHT + HERO_TEMP_HEIGHT;

/*
 * Each line goes away over a scroll distance equal to its own height, one after the
 * other from the bottom: high/low, status, then the big temperature. The one-line
 * version fades in during the last part of the temperature, so for a moment only
 * the name stays.
 */
const HIGH_LOW_START = 0;
const STATUS_START = HIGH_LOW_START + HERO_LINE_HEIGHT;
const TEMPERATURE_START = STATUS_START + HERO_LINE_HEIGHT;
const COMPACT_START =
    TEMPERATURE_START + HERO_TEMP_HEIGHT - HERO_LINE_HEIGHT;

export type HeroProgress = {
    /** 1 = fully shown, 0 = gone. */
    highLow: number;
    status: number;
    temperature: number;
    /** 0 = hidden, 1 = fully shown. */
    compact: number;
    /** Bottom edge of the header (px from the top of the page area). */
    bottom: number;
};

function clamp01(value: number): number {
    return Math.min(Math.max(value, 0), 1);
}

export function getHeroProgress(scrollTop: number): HeroProgress {
    const highLow =
        1 - clamp01((scrollTop - HIGH_LOW_START) / HERO_LINE_HEIGHT);
    const status = 1 - clamp01((scrollTop - STATUS_START) / HERO_LINE_HEIGHT);
    const temperature =
        1 - clamp01((scrollTop - TEMPERATURE_START) / HERO_TEMP_HEIGHT);
    const compact = clamp01((scrollTop - COMPACT_START) / HERO_LINE_HEIGHT);

    const bottom =
        HERO_TOP +
        HERO_NAME_HEIGHT +
        (highLow + status + compact) * HERO_LINE_HEIGHT +
        temperature * HERO_TEMP_HEIGHT;

    return { highLow, status, temperature, compact, bottom };
}