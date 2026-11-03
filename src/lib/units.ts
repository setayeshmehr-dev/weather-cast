export type TemperatureSetting = "celsius" | "fahrenheit" | "system";
export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindUnit = "kmh" | "mph" | "ms" | "kn";
export type PrecipitationUnit = "mm" | "in";
export type PressureUnit = "hpa" | "inhg" | "mmhg" | "kpa";
export type DistanceUnit = "km" | "mi";

export type Units = {
    temperature: TemperatureSetting;
    wind: WindUnit;
    precipitation: PrecipitationUnit;
    pressure: PressureUnit;
    distance: DistanceUnit;
};

export const WIND_UNITS: Record<WindUnit, string> = {
    kmh: "km/h",
    mph: "mph",
    ms: "m/s",
    kn: "kn",
};

export const PRECIPITATION_UNITS: Record<PrecipitationUnit, string> = {
    mm: "mm",
    in: "in",
};

export const PRESSURE_UNITS: Record<PressureUnit, string> = {
    hpa: "hPa",
    inhg: "inHg",
    mmhg: "mmHg",
    kpa: "kPa",
};

export const DISTANCE_UNITS: Record<DistanceUnit, string> = {
    km: "km",
    mi: "mi",
};

/** Metric units: also what the server renders before the real settings are known. */
export const SERVER_UNITS: Units = {
    temperature: "system",
    wind: "kmh",
    precipitation: "mm",
    pressure: "hpa",
    distance: "km",
};

const FAHRENHEIT_REGIONS = new Set(["US", "LR", "MM"]);

function getRegion(): string {
    if (typeof navigator === "undefined") return "";

    try {
        return new Intl.Locale(navigator.language).maximize().region ?? "";
    } catch {
        return "";
    }
}

/** The temperature unit of the region of the browser. */
export function systemTemperature(): TemperatureUnit {
    return FAHRENHEIT_REGIONS.has(getRegion()) ? "fahrenheit" : "celsius";
}

export function resolveTemperature(setting: TemperatureSetting): TemperatureUnit {
    return setting === "system" ? systemTemperature() : setting;
}

/** The units used in the region of the browser (what "Restore Defaults" sets). */
export function getRegionDefaults(): Units {
    const region = getRegion();

    if (FAHRENHEIT_REGIONS.has(region)) {
        return {
            temperature: "system",
            wind: "mph",
            precipitation: "in",
            pressure: "inhg",
            distance: "mi",
        };
    }

    if (region === "GB") {
        return {
            temperature: "system",
            wind: "mph",
            precipitation: "mm",
            pressure: "hpa",
            distance: "mi",
        };
    }

    return { ...SERVER_UNITS };
}

/*
 * Conversions from the units of the weather data: °C, km/h, mm, hPa, and meters
 * for distances.
 */
export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
    return unit === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius;
}

export function formatTemperature(celsius: number, setting: TemperatureSetting): string {
    return `${Math.round(convertTemperature(celsius, resolveTemperature(setting)))}°`;
}

export function convertWind(kmh: number, unit: WindUnit): number {
    if (unit === "mph") return kmh / 1.609344;
    if (unit === "ms") return kmh / 3.6;
    if (unit === "kn") return kmh / 1.852;

    return kmh;
}

export function formatWind(kmh: number, unit: WindUnit): string {
    const value = convertWind(kmh, unit);

    return `${unit === "ms" ? value.toFixed(1) : Math.round(value)} ${WIND_UNITS[unit]}`;
}

export function convertPrecipitation(mm: number, unit: PrecipitationUnit): number {
    return unit === "in" ? mm / 25.4 : mm;
}

export function formatPrecipitation(mm: number, unit: PrecipitationUnit): string {
    const value = convertPrecipitation(mm, unit);

    return `${value.toFixed(unit === "in" ? 2 : 1)} ${PRECIPITATION_UNITS[unit]}`;
}

export function convertPressure(hpa: number, unit: PressureUnit): number {
    if (unit === "inhg") return hpa * 0.02953;
    if (unit === "mmhg") return hpa * 0.750062;
    if (unit === "kpa") return hpa / 10;

    return hpa;
}

export function formatPressure(hpa: number, unit: PressureUnit): string {
    const value = convertPressure(hpa, unit);
    const digits = unit === "inhg" ? 2 : unit === "kpa" ? 1 : 0;

    return `${value.toFixed(digits)} ${PRESSURE_UNITS[unit]}`;
}

export function convertDistance(meters: number, unit: DistanceUnit): number {
    return unit === "mi" ? meters / 1609.344 : meters / 1000;
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
    const value = convertDistance(meters, unit);

    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${DISTANCE_UNITS[unit]}`;
}