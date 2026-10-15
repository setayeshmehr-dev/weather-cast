export type Point = { x: number; y: number };

/** Axis ticks (ascending) that cover [min, max] with round steps. */
export function niceTicks(min: number, max: number, count = 6): number[] {
    const span = Math.max(max - min, 1e-6);
    const rawStep = span / Math.max(count - 1, 1);
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const fraction = rawStep / magnitude;
    const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    const step = niceFraction * magnitude;

    const first = Math.floor(min / step) * step;
    const last = Math.ceil(max / step) * step;
    const ticks: number[] = [];

    for (let value = first; value <= last + step / 2; value += step) {
        ticks.push(Math.round(value / step) * step);
    }

    return ticks.length >= 2 ? ticks : [first, first + step];
}

/** Smooth SVG path through the points (monotone cubic: it never overshoots). */
export function smoothPath(points: Point[]): string {
    const count = points.length;

    if (count === 0) return "";
    if (count === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    const widths: number[] = [];
    const slopes: number[] = [];

    for (let i = 0; i < count - 1; i++) {
        widths.push(points[i + 1].x - points[i].x);
        slopes.push((points[i + 1].y - points[i].y) / widths[i]);
    }

    const tangents: number[] = [slopes[0]];

    for (let i = 1; i < count - 1; i++) {
        if (slopes[i - 1] * slopes[i] <= 0) {
            tangents.push(0);
        } else {
            const w1 = 2 * widths[i] + widths[i - 1];
            const w2 = widths[i] + 2 * widths[i - 1];

            tangents.push((w1 + w2) / (w1 / slopes[i - 1] + w2 / slopes[i]));
        }
    }

    tangents.push(slopes[count - 2]);

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < count - 1; i++) {
        const handle = widths[i] / 3;

        path +=
            ` C ${(points[i].x + handle).toFixed(2)} ${(points[i].y + tangents[i] * handle).toFixed(2)}` +
            ` ${(points[i + 1].x - handle).toFixed(2)} ${(points[i + 1].y - tangents[i + 1] * handle).toFixed(2)}` +
            ` ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
    }

    return path;
}