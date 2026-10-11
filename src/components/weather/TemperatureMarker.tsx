import { temperatureColor } from "@/lib/temperatureColor";

const CENTER = 28;
const RING_RADIUS = 23;

// The colored arc runs clockwise from 235° to 55° (angles measured from the top).
const ARC_START = 235;
const ARC_SWEEP = 250;
const SEGMENTS = 36;

function polar(angle: number, radius: number) {
    const radians = (angle * Math.PI) / 180;

    return {
        x: CENTER + radius * Math.sin(radians),
        y: CENTER - radius * Math.cos(radians),
    };
}

type TemperatureMarkerProps = {
    city: string;
    temperature: number;
    low: number;
    high: number;
};

export default function TemperatureMarker({
    city,
    temperature,
    low,
    high,
}: TemperatureMarkerProps) {
    const span = high - low;
    const progress =
        span > 0 ? Math.min(Math.max((temperature - low) / span, 0), 1) : 0;
    const dot = polar(ARC_START + ARC_SWEEP * progress, RING_RADIUS);
    const text = `${Math.round(temperature)}°`;

    const segments = Array.from({ length: SEGMENTS }, (_, index) => {
        const from = polar(
            ARC_START + (ARC_SWEEP * index) / SEGMENTS,
            RING_RADIUS
        );
        const to = polar(
            ARC_START + (ARC_SWEEP * (index + 1)) / SEGMENTS,
            RING_RADIUS
        );

        return {
            path: `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
            color: temperatureColor(low + (span * (index + 0.5)) / SEGMENTS),
        };
    });

    return (
        <div
            role="img"
            aria-label={`${city}: ${Math.round(temperature)}°, low ${Math.round(low)}°, high ${Math.round(high)}°`}
            className="pointer-events-none relative size-0"
        >
            <svg
                viewBox="0 0 56 66"
                width={56}
                height={66}
                className="absolute -top-19.75 left-1/2 -translate-x-1/2 overflow-visible drop-shadow-md"
                aria-hidden="true"
            >
                <circle cx={CENTER} cy={CENTER} r={28} fill="#ffffff" />

                <path
                    d="M 21.5 52 L 28 64.5 L 34.5 52 Z"
                    fill="#ffffff"
                    stroke="#ffffff"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />

                <g fill="none" strokeWidth={3.2} strokeLinecap="round">
                    {segments.map((segment) => (
                        <path
                            key={segment.path}
                            d={segment.path}
                            stroke={segment.color}
                        />
                    ))}
                </g>

                <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={3.6}
                    fill={temperatureColor(temperature)}
                    stroke="#ffffff"
                    strokeWidth={1.4}
                />

                <g
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontWeight={700}
                >
                    <text
                        x={CENTER}
                        y={27}
                        fontSize={text.length > 3 ? 16 : 20}
                        fill="#1c1c1e"
                    >
                        {text}
                    </text>

                    <text
                        x={18}
                        y={48.5}
                        fontSize={11}
                        fontWeight={600}
                        fill={temperatureColor(low)}
                    >
                        {Math.round(low)}
                    </text>

                    <text
                        x={38}
                        y={48.5}
                        fontSize={11}
                        fontWeight={600}
                        fill={temperatureColor(high)}
                    >
                        {Math.round(high)}
                    </text>
                </g>
            </svg>

            <span className="absolute top-0 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />

            <span className="absolute top-2 left-0 -translate-x-1/2 text-[13px] font-semibold whitespace-nowrap text-black [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_0_3px_#fff]">
                {city}
            </span>
        </div>
    );
}