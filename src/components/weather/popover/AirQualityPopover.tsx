"use client";

import { DotsNine } from "@phosphor-icons/react";

import DetailPopover from "@/components/weather/popover/DetailPopover";
import { PopoverSection } from "@/components/weather/popover/Parts";
import type { AirQuality, Pollutants } from "@/hooks/useAirQuality";

const GAUGE_GRADIENT =
    "linear-gradient(to right, #3a8ff0 0%, #4cd964 22%, #c6e04a 45%, #f5c042 55%, #f08a3c 68%, #e63e50 82%, #8c1d2e 100%)";

const TREND_TEXT = {
    worse: "Air quality is worse than yesterday at about this time.",
    better: "Air quality is better than yesterday at about this time.",
    similar: "Air quality is similar to yesterday at about this time.",
};

const HEALTH: Record<string, string> = {
    Good: "Air quality is satisfactory and poses little or no risk. It is a good time to be active outdoors.",
    Fair: "Air quality is acceptable. Unusually sensitive people may notice mild effects, but most people will not.",
    Moderate:
        "Short-term health effects are unlikely for most people. Sensitive groups, such as people with asthma or heart conditions, may notice symptoms, and irritants like pollen can make them stronger.",
    Poor: "People with respiratory or heart conditions, children and older adults should cut down on long or intense outdoor activity. Others may start to feel some irritation.",
    "Very poor":
        "Health effects are likely for sensitive people and possible for everyone. Limit your time outdoors and avoid strenuous activity.",
    "Extremely poor":
        "The health risk is serious for everyone. Stay indoors if you can and keep the windows closed.",
};

type PollutantInfo = {
    key: keyof Pollutants;
    formula: string;
    name: string;
    /** Upper limit of the "Fair" band in µg/m³, used to find the primary pollutant. */
    fairLimit: number | null;
    description: string;
};

const POLLUTANTS: PollutantInfo[] = [
    {
        key: "pm25",
        formula: "PM2.5",
        name: "Fine Particles",
        fairLimit: 15,
        description:
            "Fine particles come from combustion: traffic, wood burning, industry and wildfires. They are small enough to reach deep into the lungs.",
    },
    {
        key: "pm10",
        formula: "PM10",
        name: "Coarse Particles",
        fairLimit: 45,
        description:
            "Coarse particles come from road dust, construction, farming and natural dust.",
    },
    {
        key: "no2",
        formula: "NO₂",
        name: "Nitrogen Dioxide",
        fairLimit: 25,
        description:
            "Nitrogen dioxide comes mostly from traffic and power plants. It irritates the airways.",
    },
    {
        key: "ozone",
        formula: "O₃",
        name: "Ozone",
        fairLimit: 120,
        description:
            "Ground-level ozone forms when sunlight reacts with traffic and industrial emissions. It is usually highest on hot, sunny afternoons.",
    },
    {
        key: "so2",
        formula: "SO₂",
        name: "Sulfur Dioxide",
        fairLimit: 40,
        description:
            "Sulfur dioxide comes from burning coal and oil, from industry and from volcanoes.",
    },
    {
        key: "co",
        formula: "CO",
        name: "Carbon Monoxide",
        fairLimit: null,
        description:
            "Carbon monoxide comes from incomplete burning, mostly from traffic and heating.",
    },
];

function formatValue(value: number): string {
    return value < 10 ? value.toFixed(1) : String(Math.round(value));
}

function findPrimary(pollutants: Pollutants): PollutantInfo | null {
    let best: PollutantInfo | null = null;
    let bestRatio = 0;

    for (const info of POLLUTANTS) {
        const value = pollutants[info.key];

        if (info.fairLimit === null || value === null) continue;

        const ratio = value / info.fairLimit;

        if (ratio > bestRatio) {
            bestRatio = ratio;
            best = info;
        }
    }

    return best;
}

type AirQualityPopoverProps = {
    anchor: HTMLElement;
    onClose: () => void;
    airQuality: AirQuality;
};

export default function AirQualityPopover({
    anchor,
    onClose,
    airQuality,
}: AirQualityPopoverProps) {
    const position = Math.min(Math.max(airQuality.index, 0), 100);
    const primary = findPrimary(airQuality.pollutants);

    return (
        <DetailPopover
            anchor={anchor}
            title="Air Quality"
            icon={<DotsNine size={18} weight="bold" />}
            onClose={onClose}
        >
            <div className="px-4 pt-2 pb-4">
                <p className="text-3xl font-semibold">{airQuality.label}</p>
                <p className="mt-0.5 text-sm font-medium text-white/60">
                    Scale: European AQI (EAQI)
                </p>

                <p className="mt-3 text-base text-white/90">
                    {airQuality.trend
                        ? TREND_TEXT[airQuality.trend]
                        : "Comparison with yesterday is not available."}
                </p>

                <div
                    className="relative mt-4 h-1.5 rounded-full"
                    style={{ backgroundImage: GAUGE_GRADIENT }}
                >
                    <span
                        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/40"
                        style={{ left: `${position}%` }}
                    />
                </div>
            </div>

            <PopoverSection title="Health Information">
                <p className="text-base leading-snug text-white/90">
                    {HEALTH[airQuality.label] ?? HEALTH.Moderate}
                </p>
            </PopoverSection>

            {primary && (
                <PopoverSection
                    title="Primary Pollutant"
                    subtitle={`${primary.name} (${primary.formula})`}
                >
                    <p className="text-base leading-snug text-white/90">
                        {primary.description}
                    </p>
                </PopoverSection>
            )}

            <PopoverSection title="Pollutant Details">
                <ul className="flex flex-col">
                    {POLLUTANTS.map((info) => {
                        const value = airQuality.pollutants[info.key];

                        return (
                            <li
                                key={info.key}
                                className="flex items-baseline gap-3 border-t border-white/10 py-2.5 first:border-t-0"
                            >
                                <span className="w-14 shrink-0 text-base text-white/60">
                                    {info.formula}
                                </span>
                                <span className="flex-1 text-base font-semibold">
                                    {info.name}
                                </span>
                                <span className="text-base text-white/60">
                                    {value === null ? "–" : `${formatValue(value)} µg/m³`}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </PopoverSection>
        </DetailPopover>
    );
}