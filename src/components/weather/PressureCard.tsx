import WeatherCard from "@/components/weather/WeatherCard";
import type { CurrentWeather, PressureTrend } from "@/hooks/useWeather";

// Gauge scale in hPa, centered on standard sea-level pressure (1013 hPa).
const PRESSURE_MIN = 963;
const PRESSURE_MAX = 1063;

const START_ANGLE = -135;
const SWEEP = 270;
const TICK_COUNT = 46;

const TREND_SYMBOL: Record<PressureTrend, string> = {
    rising: "↑",
    falling: "↓",
    steady: "=",
};

const TICK_ANGLES = Array.from(
    { length: TICK_COUNT },
    (_, index) => START_ANGLE + (index * SWEEP) / (TICK_COUNT - 1)
);

type PressureGaugeProps = {
    pressure: number;
    trend: PressureTrend;
};

function PressureGauge({ pressure, trend }: PressureGaugeProps) {
    const ratio = Math.min(
        Math.max((pressure - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN), 0),
        1
    );
    const needleAngle = START_ANGLE + ratio * SWEEP;

    return (
        <svg
            viewBox="0 0 100 100"
            width={100}
            height={100}
            role="img"
            aria-label={`Pressure ${Math.round(pressure)} hectopascals, ${trend}`}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white"
        >
            <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                {TICK_ANGLES.map((angle) => (
                    <line
                        key={angle}
                        x1={50}
                        y1={3}
                        x2={50}
                        y2={13}
                        strokeOpacity={angle <= needleAngle ? 0.55 : 0.22}
                        transform={`rotate(${angle} 50 50)`}
                    />
                ))}
            </g>

            <line
                x1={50}
                y1={12}
                x2={50}
                y2={28}
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                transform={`rotate(${needleAngle} 50 50)`}
            />

            <g
                fill="currentColor"
                textAnchor="middle"
                dominantBaseline="central"
            >
                <text x={50} y={41} fontSize={14} fontWeight={600} fillOpacity={0.85}>
                    {TREND_SYMBOL[trend]}
                </text>
                <text x={50} y={57} fontSize={16} fontWeight={600}>
                    {Math.round(pressure)}
                </text>
                <text x={50} y={72} fontSize={11} fillOpacity={0.8}>
                    hPa
                </text>
            </g>
        </svg>
    );
}

type PressureCardProps = {
    current: CurrentWeather | null;
    loading: boolean;
    error: string | null;
    className?: string;
};

export default function PressureCard({
    current,
    loading,
    error,
    className,
}: PressureCardProps) {
    return (
        <WeatherCard
            title="PRESSURE"
            className={className}
            bodyClassName="relative"
        >
            {loading && (
                <p className="text-xs text-white/70">
                    Loading...
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
                <>
                    <PressureGauge
                        pressure={current.pressure}
                        trend={current.pressureTrend}
                    />

                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-5 text-xs">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </>
            )}
        </WeatherCard>
    );
}