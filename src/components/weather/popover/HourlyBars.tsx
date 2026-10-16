"use client";

const WIDTH = 300;
const GUTTER = 46;
const PLOT_WIDTH = WIDTH - GUTTER;
const PLOT_TOP = 8;
const AXIS_HEIGHT = 20;
const AXIS_HOURS = [0, 6, 12, 18];

// Rain rate (mm/h) at the edges of three bands of the same height.
const BAND_EDGES = [0, 2.5, 7.5, 15];
const BAND_LABELS = ["Light", "Moderate", "Heavy"];

/** Maps a rain rate to 0..1 so that the three bands have the same height. */
function bandPosition(value: number): number {
    const clamped = Math.min(Math.max(value, 0), BAND_EDGES[3]);

    for (let band = 0; band < 3; band++) {
        const from = BAND_EDGES[band];
        const to = BAND_EDGES[band + 1];

        if (clamped <= to) return (band + (clamped - from) / (to - from)) / 3;
    }

    return 1;
}

type HourlyBarsProps = {
    /** Precipitation (mm per hour), one value per hour of the day. */
    values: number[];
    nowHour?: number | null;
    height?: number;
    ariaLabel: string;
};

export default function HourlyBars({
    values,
    nowHour = null,
    height = 130,
    ariaLabel,
}: HourlyBarsProps) {
    const plotBottom = PLOT_TOP + height;
    const x = (hour: number) => (hour / 24) * PLOT_WIDTH;
    const bandY = (edge: number) => PLOT_TOP + (1 - edge / 3) * height;
    const barWidth = (PLOT_WIDTH / 24) * 0.5;

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 pt-2">
            <svg
                viewBox={`0 0 ${WIDTH} ${plotBottom + AXIS_HEIGHT}`}
                className="block w-full"
                role="img"
                aria-label={ariaLabel}
            >
                {[0, 1, 2, 3].map((edge) => (
                    <line
                        key={edge}
                        x1={0}
                        x2={PLOT_WIDTH}
                        y1={bandY(edge)}
                        y2={bandY(edge)}
                        stroke="#ffffff"
                        strokeOpacity={0.1}
                    />
                ))}

                {BAND_LABELS.map((label, band) => (
                    <text
                        key={label}
                        x={8}
                        y={bandY(band + 1) + 13}
                        fontSize={11}
                        fontWeight={600}
                        fill="#ffffff"
                        fillOpacity={0.55}
                    >
                        {label}
                    </text>
                ))}

                {AXIS_HOURS.slice(1).map((hour) => (
                    <line
                        key={hour}
                        x1={x(hour)}
                        x2={x(hour)}
                        y1={PLOT_TOP}
                        y2={plotBottom + AXIS_HEIGHT - 6}
                        stroke="#ffffff"
                        strokeOpacity={0.15}
                        strokeDasharray="2 3"
                    />
                ))}

                {values.map((value, hour) => {
                    if (!(value > 0.05)) return null;

                    const barHeight = Math.max(bandPosition(value) * height, 3);

                    return (
                        <rect
                            key={hour}
                            x={x(hour) + (PLOT_WIDTH / 24 - barWidth) / 2}
                            y={plotBottom - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx={2}
                            fill="#5ac8fa"
                        />
                    );
                })}

                {nowHour !== null && (
                    <line
                        x1={x(nowHour)}
                        x2={x(nowHour)}
                        y1={PLOT_TOP}
                        y2={plotBottom}
                        stroke="#ffffff"
                        strokeOpacity={0.85}
                    />
                )}

                {AXIS_HOURS.map((hour) => (
                    <text
                        key={hour}
                        x={x(hour) + 4}
                        y={plotBottom + 14}
                        fontSize={11}
                        fontWeight={600}
                        fill="#ffffff"
                        fillOpacity={0.55}
                    >
                        {String(hour).padStart(2, "0")}
                    </text>
                ))}
            </svg>
        </div>
    );
}