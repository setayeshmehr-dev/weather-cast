const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;
const SUN_DISTANCE_KM = 149_598_000;
const EARTH_RADIUS_KM = 6378.14;

// Altitude (degrees) of the moon's center at moonrise: apparent radius + parallax.
const MOON_RISE_ALTITUDE = 0.133;

// Sampling step used to find the moonrise inside a day.
const RISE_STEP_MS = 6 * 60_000;

// How far ahead (days) we look for the next full moon.
const FULL_MOON_SEARCH_DAYS = 32;

export type MoonInfo = {
    /** 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter */
    phase: number;
    /** Illuminated fraction of the disk, 0..1 */
    illumination: number;
    /** Phase name, e.g. "WAXING CRESCENT" */
    name: string;
    /** Moonrise of the local day as "HH:MM", or null if the moon does not rise that day */
    moonrise: string | null;
    /** Days from now until the next full moon */
    daysToFullMoon: number;
};

export type MoonInput = {
    /** The current instant in UTC milliseconds */
    nowMs: number;
    /** The local date (YYYY-MM-DD) the moonrise is calculated for */
    date: string;
    /** Offset of the local time zone from UTC, in seconds */
    utcOffsetSeconds: number;
    latitude: number;
    longitude: number;
};

function toDays(ms: number): number {
    return ms / DAY_MS - 0.5 + J1970 - J2000;
}

function rightAscension(longitude: number, latitude: number): number {
    return Math.atan2(
        Math.sin(longitude) * Math.cos(OBLIQUITY) -
            Math.tan(latitude) * Math.sin(OBLIQUITY),
        Math.cos(longitude)
    );
}

function declination(longitude: number, latitude: number): number {
    return Math.asin(
        Math.sin(latitude) * Math.cos(OBLIQUITY) +
            Math.cos(latitude) * Math.sin(OBLIQUITY) * Math.sin(longitude)
    );
}

function sunCoordinates(days: number) {
    const meanAnomaly = RAD * (357.5291 + 0.98560028 * days);
    const center =
        RAD *
        (1.9148 * Math.sin(meanAnomaly) +
            0.02 * Math.sin(2 * meanAnomaly) +
            0.0003 * Math.sin(3 * meanAnomaly));
    const eclipticLongitude =
        meanAnomaly + center + RAD * 102.9372 + Math.PI;

    return {
        ra: rightAscension(eclipticLongitude, 0),
        dec: declination(eclipticLongitude, 0),
    };
}

function sinDeg(degrees: number): number {
    return Math.sin(RAD * degrees);
}

function cosDeg(degrees: number): number {
    return Math.cos(RAD * degrees);
}

// Low-precision lunar position (Astronomical Almanac): ~0.3 degrees, i.e. well
// under an hour of phase error.
function moonCoordinates(days: number) {
    const t = days / 36525;

    const longitude =
        RAD *
        (218.32 +
            481267.881 * t +
            6.29 * sinDeg(135.0 + 477198.87 * t) -
            1.27 * sinDeg(259.3 - 413335.36 * t) +
            0.66 * sinDeg(235.7 + 890534.22 * t) +
            0.21 * sinDeg(269.9 + 954397.74 * t) -
            0.19 * sinDeg(357.5 + 35999.05 * t) -
            0.11 * sinDeg(186.5 + 966404.03 * t));

    const latitude =
        RAD *
        (5.13 * sinDeg(93.3 + 483202.02 * t) +
            0.28 * sinDeg(228.2 + 960400.89 * t) -
            0.28 * sinDeg(318.3 + 6003.15 * t) -
            0.17 * sinDeg(217.6 - 407332.21 * t));

    const parallax =
        0.9508 +
        0.0518 * cosDeg(135.0 + 477198.87 * t) +
        0.0095 * cosDeg(259.3 - 413335.36 * t) +
        0.0078 * cosDeg(235.7 + 890534.22 * t) +
        0.0028 * cosDeg(269.9 + 954397.74 * t);

    return {
        ra: rightAscension(longitude, latitude),
        dec: declination(longitude, latitude),
        distance: EARTH_RADIUS_KM / sinDeg(parallax),
    };
}

function moonIllumination(ms: number) {
    const days = toDays(ms);
    const sun = sunCoordinates(days);
    const moon = moonCoordinates(days);

    const elongation = Math.acos(
        Math.sin(sun.dec) * Math.sin(moon.dec) +
            Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra)
    );
    const incidence = Math.atan2(
        SUN_DISTANCE_KM * Math.sin(elongation),
        moon.distance - SUN_DISTANCE_KM * Math.cos(elongation)
    );
    const angle = Math.atan2(
        Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra),
        Math.sin(sun.dec) * Math.cos(moon.dec) -
            Math.cos(sun.dec) *
                Math.sin(moon.dec) *
                Math.cos(sun.ra - moon.ra)
    );

    return {
        illumination: (1 + Math.cos(incidence)) / 2,
        phase: 0.5 + (0.5 * incidence * (angle < 0 ? -1 : 1)) / Math.PI,
    };
}

function refraction(altitude: number): number {
    const h = altitude < 0 ? 0 : altitude;

    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

/** Altitude of the moon above the horizon in degrees (with refraction). */
function moonAltitude(ms: number, latitude: number, longitude: number): number {
    const days = toDays(ms);
    const moon = moonCoordinates(days);
    const phi = RAD * latitude;
    const hourAngle =
        RAD * (280.16 + 360.9856235 * days) - RAD * -longitude - moon.ra;

    const altitude = Math.asin(
        Math.sin(phi) * Math.sin(moon.dec) +
            Math.cos(phi) * Math.cos(moon.dec) * Math.cos(hourAngle)
    );

    return (altitude + refraction(altitude)) / RAD;
}

function findMoonrise(
    dayStartMs: number,
    latitude: number,
    longitude: number
): number | null {
    let previous =
        moonAltitude(dayStartMs, latitude, longitude) - MOON_RISE_ALTITUDE;

    for (let t = dayStartMs + RISE_STEP_MS; t <= dayStartMs + DAY_MS; t += RISE_STEP_MS) {
        const next = moonAltitude(t, latitude, longitude) - MOON_RISE_ALTITUDE;

        if (previous < 0 && next >= 0) {
            const ratio = -previous / (next - previous);

            return t - RISE_STEP_MS + ratio * RISE_STEP_MS;
        }

        previous = next;
    }

    return null;
}

function findNextFullMoon(nowMs: number): number {
    let previous = moonIllumination(nowMs).phase;

    for (let hour = 1; hour <= FULL_MOON_SEARCH_DAYS * 24; hour++) {
        const time = nowMs + hour * HOUR_MS;
        const next = moonIllumination(time).phase;

        if (previous < 0.5 && next >= 0.5) {
            const ratio = (0.5 - previous) / (next - previous);

            return time - HOUR_MS + ratio * HOUR_MS;
        }

        previous = next;
    }

    return nowMs + 29.53 * DAY_MS;
}

function getPhaseName(phase: number): string {
    if (phase < 0.0166 || phase >= 0.9834) return "NEW MOON";
    if (phase < 0.2334) return "WAXING CRESCENT";
    if (phase < 0.2666) return "FIRST QUARTER";
    if (phase < 0.4834) return "WAXING GIBBOUS";
    if (phase < 0.5166) return "FULL MOON";
    if (phase < 0.7334) return "WANING GIBBOUS";
    if (phase < 0.7666) return "LAST QUARTER";
    return "WANING CRESCENT";
}

function formatLocalTime(ms: number, utcOffsetSeconds: number): string {
    return new Date(ms + utcOffsetSeconds * 1000).toISOString().slice(11, 16);
}

export function getMoonInfo({
    nowMs,
    date,
    utcOffsetSeconds,
    latitude,
    longitude,
}: MoonInput): MoonInfo {
    const { illumination, phase } = moonIllumination(nowMs);

    const dayStartMs = Date.parse(`${date}T00:00Z`) - utcOffsetSeconds * 1000;
    const moonriseMs = findMoonrise(dayStartMs, latitude, longitude);

    return {
        phase,
        illumination,
        name: getPhaseName(phase),
        moonrise:
            moonriseMs === null
                ? null
                : formatLocalTime(moonriseMs, utcOffsetSeconds),
        daysToFullMoon: (findNextFullMoon(nowMs) - nowMs) / DAY_MS,
    };
}