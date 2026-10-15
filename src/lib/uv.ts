const STOPS: [number, [number, number, number]][] = [
    [0, [76, 217, 100]],
    [3, [212, 224, 74]],
    [5, [245, 192, 66]],
    [7, [240, 138, 60]],
    [9, [230, 62, 80]],
    [11, [211, 53, 234]],
];

export function uvColor(value: number): string {
    const first = STOPS[0];
    const last = STOPS[STOPS.length - 1];

    if (value <= first[0]) return `rgb(${first[1].join(", ")})`;
    if (value >= last[0]) return `rgb(${last[1].join(", ")})`;

    const next = STOPS.findIndex(([stop]) => stop > value);
    const [fromValue, fromColor] = STOPS[next - 1];
    const [toValue, toColor] = STOPS[next];
    const ratio = (value - fromValue) / (toValue - fromValue);

    return `rgb(${fromColor
        .map((channel, i) => Math.round(channel + (toColor[i] - channel) * ratio))
        .join(", ")})`;
}

/** WHO UV index level. */
export function uvLevel(value: number): string {
    if (value < 3) return "Low";
    if (value < 6) return "Moderate";
    if (value < 8) return "High";
    if (value < 11) return "Very High";
    return "Extreme";
}