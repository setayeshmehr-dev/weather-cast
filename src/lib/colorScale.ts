export type ColorStop = [number, [number, number, number]];

/** Color at a value, interpolated between the stops (sorted by value). */
export function interpolateColor(stops: ColorStop[], value: number): string {
    const first = stops[0];
    const last = stops[stops.length - 1];

    if (value <= first[0]) return `rgb(${first[1].join(", ")})`;
    if (value >= last[0]) return `rgb(${last[1].join(", ")})`;

    const next = stops.findIndex(([stop]) => stop > value);
    const [fromValue, fromColor] = stops[next - 1];
    const [toValue, toColor] = stops[next];
    const ratio = (value - fromValue) / (toValue - fromValue);

    return `rgb(${fromColor
        .map((channel, i) => Math.round(channel + (toColor[i] - channel) * ratio))
        .join(", ")})`;
}