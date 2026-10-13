import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather } from "@/hooks/useWeather";
import { WIDE_TEXT } from "@/lib/cardText";

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// Ticks every 4°, skipping the ones next to N / E / S / W where the letters sit.
const TICKS = Array.from({ length: 90 }, (_, i) => i * 4).filter((angle) => {
    const offset = angle % 90;
    return offset >= 9 && offset <= 81;
});

const CARDINALS = [
    { label: "N", angle: 0, x: 62, y: 16 },
    { label: "E", angle: 90, x: 108, y: 62 },
    { label: "S", angle: 180, x: 62, y: 108 },
    { label: "W", angle: 270, x: 16, y: 62 },
];

// A cardinal letter fades out when the arrow or the dot passes within this angle (degrees).
const LETTER_CLEARANCE = 18;

function directionName(degrees: number): string {
    return DIRECTIONS[Math.round(degrees / 45) % 8];
}

function angularDistance(a: number, b: number): number {
    const difference = Math.abs(a - b) % 360;

    return difference > 180 ? 360 - difference : difference;
}

type CompassProps = {
    speed: number;
    direction: number;
};

function Compass({ speed, direction }: CompassProps) {
    // Meteorological direction = where the wind comes FROM; the arrow points where it goes TO.
    const heading = (direction + 180) % 360;

    return (
        <svg
            viewBox="0 0 124 124"
            role="img"
            aria-label={`Wind from ${directionName(direction)} at ${Math.round(speed)} kilometers per hour`}
            className="block h-auto w-full text-white"
        >
            <g stroke="currentColor" strokeOpacity={0.3} strokeWidth={1}>
                {TICKS.map((angle) => (
                    <line
                        key={angle}
                        x1={62}
                        y1={8}
                        x2={62}
                        y2={15}
                        transform={`rotate(${angle} 62 62)`}
                    />
                ))}
            </g>

            <g
                fill="currentColor"
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
            >
                {CARDINALS.map(({ label, angle, x, y }) => {
                    const covered =
                        angularDistance(angle, heading) < LETTER_CLEARANCE ||
                        angularDistance(angle, direction) < LETTER_CLEARANCE;

                    return (
                        <text
                            key={label}
                            x={x}
                            y={y}
                            fillOpacity={covered ? 0 : 0.85}
                        >
                            {label}
                        </text>
                    );
                })}
            </g>

            <text
                x={62}
                y={58}
                fill="currentColor"
                fontSize={20}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
            >
                {Math.round(speed)}
            </text>

            <text
                x={62}
                y={75}
                fill="currentColor"
                fillOpacity={0.8}
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="central"
            >
                km/h
            </text>

            <g transform={`rotate(${heading} 62 62)`}>
                <line
                    x1={62}
                    y1={32}
                    x2={62}
                    y2={9}
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                />
                <polyline
                    points="56.5,15.5 62,9 67.5,15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>

            <g transform={`rotate(${direction} 62 62)`}>
                <line
                    x1={62}
                    y1={7}
                    x2={62}
                    y2={25}
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                />
                <circle cx={62} cy={7} r={5} fill="currentColor" />
            </g>
        </svg>
    );
}

type WindCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function WindCard({
    current,
    loading,
    error,
    className,
}: WindCardProps) {
    const rows = current
        ? [
            { label: "Wind", value: `${Math.round(current.windSpeed)} km/h` },
            { label: "Gusts", value: `${Math.round(current.windGusts)} km/h` },
            {
                label: "Direction",
                value: `${Math.round(current.windDirection)}° ${directionName(current.windDirection)}`,
            },
        ]
        : [];

    return (
        <WeatherCard
            title="WIND"
            className={className}
        >
            {loading && (
                <p className="text-xs text-white/70">
                    Loading wind...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="text-xs text-white/80"
                >
                    {error}
                </p>
            )}

            {!loading && !error && current && (
                <div className="grid h-full grid-cols-[minmax(0,1fr)_40cqw] gap-x-[4.3cqw]">
                    <dl className={`flex h-full flex-col ${WIDE_TEXT}`}>
                        {rows.map((row, index) => (
                            <div
                                key={row.label}
                                className={`flex flex-1 items-center justify-between ${
                                    index < rows.length - 1
                                        ? "border-b border-white/15"
                                        : ""
                                }`}
                            >
                                <dt className="font-medium">{row.label}</dt>
                                <dd className="text-white/50">{row.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-[-2.8cqw] self-start">
                        <Compass
                            speed={current.windSpeed}
                            direction={current.windDirection}
                        />
                    </div>
                </div>
            )}
        </WeatherCard>
    );
}