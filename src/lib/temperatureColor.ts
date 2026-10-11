type Rgb = [number, number, number];

// Temperature (°C) → color stops, approximated from the Apple Weather screenshots.
const COLOR_STOPS: [number, Rgb][] = [
    [-10, [58, 111, 214]],
    [0, [74, 163, 240]],
    [4, [92, 200, 240]],
    [9, [127, 214, 198]],
    [13, [154, 215, 160]],
    [16, [188, 217, 128]],
    [19, [220, 211, 107]],
    [25, [242, 184, 75]],
    [31, [242, 137, 74]],
    [37, [232, 79, 79]],
];

function toRgb(color: Rgb): string {
    return `rgb(${color.join(", ")})`;
}

export function temperatureColor(temp: number): string {
    const first = COLOR_STOPS[0];
    const last = COLOR_STOPS[COLOR_STOPS.length - 1];

    if (temp <= first[0]) return toRgb(first[1]);
    if (temp >= last[0]) return toRgb(last[1]);

    const next = COLOR_STOPS.findIndex(([stop]) => stop > temp);
    const [fromTemp, fromColor] = COLOR_STOPS[next - 1];
    const [toTemp, toColor] = COLOR_STOPS[next];
    const ratio = (temp - fromTemp) / (toTemp - fromTemp);

    return toRgb(
        fromColor.map((value, i) =>
            Math.round(value + (toColor[i] - value) * ratio)
        ) as Rgb
    );
}