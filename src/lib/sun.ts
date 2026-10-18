const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

// Zenith angles (degrees): sunrise/sunset (with refraction) and civil twilight.
const SUNRISE_ZENITH = 90.833;
const CIVIL_ZENITH = 96;

type SunPosition = {
    /** Solar declination in radians. */
    declination: number;
    /** Equation of time in minutes. */
    equationOfTime: number;
};

// NOAA solar position algorithm (accurate to about a minute for the events).
function sunPosition(ms: number): SunPosition {
    const julianDay = ms / DAY_MS + 2440587.5;
    const t = (julianDay - 2451545) / 36525;

    const meanLongitude =
        (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360;
    const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

    const m = meanAnomaly * RAD;
    const center =
        Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
        Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
        Math.sin(3 * m) * 0.000289;

    const trueLongitude = meanLongitude + center;
    const omega = (125.04 - 1934.136 * t) * RAD;
    const apparentLongitude =
        (trueLongitude - 0.00569 - 0.00478 * Math.sin(omega)) * RAD;

    const meanObliquity =
        23 +
        (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const obliquity = (meanObliquity + 0.00256 * Math.cos(omega)) * RAD;

    const declination = Math.asin(
        Math.sin(obliquity) * Math.sin(apparentLongitude)
    );

    const y = Math.tan(obliquity / 2) ** 2;
    const l0 = meanLongitude * RAD;

    const equationOfTime =
        (4 *
            (y * Math.sin(2 * l0) -
                2 * eccentricity * Math.sin(m) +
                4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
                0.5 * y * y * Math.sin(4 * l0) -
                1.25 * eccentricity * eccentricity * Math.sin(2 * m))) /
        RAD;

    return { declination, equationOfTime };
}

function hourAngle(
    latitude: number,
    declination: number,
    zenith: number
): number | null {
    const cosine =
        (Math.cos(zenith * RAD) -
            Math.sin(latitude * RAD) * Math.sin(declination)) /
        (Math.cos(latitude * RAD) * Math.cos(declination));

    if (cosine > 1 || cosine < -1) return null;

    return Math.acos(cosine) / RAD;
}

export type SunEvents = {
    /** Civil dawn (the sun is 6° below the horizon), UTC ms. */
    firstLight: number | null;
    sunrise: number | null;
    sunset: number | null;
    /** Civil dusk, UTC ms. */
    lastLight: number | null;
};

/** Sun events (UTC ms) of a local calendar date ("YYYY-MM-DD"). */
export function getSunEvents(
    date: string,
    latitude: number,
    longitude: number
): SunEvents {
    const [year, month, day] = date.split("-").map(Number);
    const midnight = Date.UTC(year, month - 1, day);

    const guess = midnight + (720 - 4 * longitude) * MINUTE_MS;
    const { declination, equationOfTime } = sunPosition(guess);
    const noonMinutes = 720 - 4 * longitude - equationOfTime;

    const at = (zenith: number, side: -1 | 1): number | null => {
        const angle = hourAngle(latitude, declination, zenith);

        return angle === null
            ? null
            : midnight + (noonMinutes + side * 4 * angle) * MINUTE_MS;
    };

    return {
        firstLight: at(CIVIL_ZENITH, -1),
        sunrise: at(SUNRISE_ZENITH, -1),
        sunset: at(SUNRISE_ZENITH, 1),
        lastLight: at(CIVIL_ZENITH, 1),
    };
}

/**
 * Altitude of the sun in degrees, shifted so that 0 is the horizon at sunrise
 * and sunset (it includes the usual refraction and the radius of the sun).
 */
export function sunAltitude(
    ms: number,
    latitude: number,
    longitude: number
): number {
    const { declination, equationOfTime } = sunPosition(ms);
    const minutes = (ms % DAY_MS) / MINUTE_MS;
    const solarTime = (((minutes + equationOfTime + 4 * longitude) % 1440) + 1440) % 1440;
    const angle = (solarTime / 4 - 180) * RAD;

    const altitude =
        Math.asin(
            Math.sin(latitude * RAD) * Math.sin(declination) +
                Math.cos(latitude * RAD) * Math.cos(declination) * Math.cos(angle)
        ) / RAD;

    return altitude + (SUNRISE_ZENITH - 90);
}