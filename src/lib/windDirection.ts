const POINTS = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
];

/** 16-point compass name of a meteorological wind direction (where the wind comes FROM). */
export function windDirectionName(degrees: number): string {
    return POINTS[Math.round(degrees / 22.5) % 16];
}