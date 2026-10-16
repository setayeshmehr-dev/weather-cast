const DIRECTION_WORDS = [
    "north",
    "north-northeast",
    "northeast",
    "east-northeast",
    "east",
    "east-southeast",
    "southeast",
    "south-southeast",
    "south",
    "south-southwest",
    "southwest",
    "west-southwest",
    "west",
    "west-northwest",
    "northwest",
    "north-northwest",
];

/** "south-southeast" for a meteorological direction (where the wind comes from). */
export function windDirectionWords(degrees: number): string {
    return DIRECTION_WORDS[Math.round(degrees / 22.5) % 16];
}

/** Average of directions (a plain mean fails around north: 350° and 10°). */
export function meanDirection(degrees: number[]): number {
    const east = degrees.reduce((sum, d) => sum + Math.sin((d * Math.PI) / 180), 0);
    const north = degrees.reduce((sum, d) => sum + Math.cos((d * Math.PI) / 180), 0);

    return ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
}

export type BeaufortLevel = {
    force: number;
    label: string;
    /** Lower limit in km/h. */
    min: number;
    range: string;
    color: string;
};

export const BEAUFORT: BeaufortLevel[] = [
    { force: 0, label: "Calm", min: 0, range: "< 1", color: "#55b0d6" },
    { force: 1, label: "Light air", min: 1, range: "1 - 5", color: "#4fc4c4" },
    { force: 2, label: "Light breeze", min: 6, range: "6 - 11", color: "#52c08e" },
    { force: 3, label: "Gentle breeze", min: 12, range: "12 - 19", color: "#4cb85a" },
    { force: 4, label: "Moderate breeze", min: 20, range: "20 - 28", color: "#47b04a" },
    { force: 5, label: "Fresh breeze", min: 29, range: "29 - 38", color: "#9bb53c" },
    { force: 6, label: "Strong breeze", min: 39, range: "39 - 49", color: "#d4b73a" },
    { force: 7, label: "Near gale", min: 50, range: "50 - 61", color: "#e0a030" },
    { force: 8, label: "Gale", min: 62, range: "62 - 74", color: "#e57e30" },
    { force: 9, label: "Strong gale", min: 75, range: "75 - 88", color: "#e5603a" },
    { force: 10, label: "Storm", min: 89, range: "89 - 102", color: "#dc4545" },
    { force: 11, label: "Violent storm", min: 103, range: "103 - 117", color: "#c93a6a" },
    { force: 12, label: "Hurricane force", min: 118, range: "≥ 118", color: "#a43ab0" },
];

export function beaufortForce(speed: number): number {
    let force = 0;

    for (const level of BEAUFORT) {
        if (speed >= level.min) force = level.force;
    }

    return force;
}