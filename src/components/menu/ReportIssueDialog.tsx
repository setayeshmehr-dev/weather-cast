"use client";

import {
    CheckCircle,
    PaperPlaneTilt,
    Thermometer,
    ThermometerCold,
    ThermometerHot,
} from "@phosphor-icons/react";
import { useState } from "react";

import GlassDialog, { RoundButton } from "@/components/menu/GlassDialog";
import {
    ChoiceRow,
    Group,
    SectionTitle,
    SwitchRow,
} from "@/components/menu/DialogParts";
import WeatherIcon from "@/components/weather/WeatherIcon";
import { peekWeather } from "@/hooks/useWeather";
import { useUnits } from "@/hooks/useUnits";
import type { City } from "@/lib/cities";
import { formatTemperature, formatWind } from "@/lib/units";

const FEEDBACK_URL = "https://github.com/setayeshmehr-dev/weather-cast/issues";

const OVERALL = [
    { id: "clear", label: "Clear", slug: "clear-night" },
    { id: "clouds", label: "Clouds", slug: "overcast" },
    { id: "rain", label: "Rain", slug: "rain" },
    { id: "sleet", label: "Sleet", slug: "sleet" },
    { id: "snow", label: "Snow", slug: "snow" },
];

const OTHER = [
    { id: "rainbow", label: "Rainbow", slug: "rainbow" },
    { id: "lightning", label: "Lightning", slug: "lightning-bolt" },
    { id: "hail", label: "Hail", slug: "hail" },
    { id: "smoke", label: "Smoke", slug: "smoke" },
    { id: "fog", label: "Fog", slug: "fog" },
    { id: "haze", label: "Haze", slug: "haze" },
];

const DESCRIPTIONS = [
    "Pleasant",
    "Unpleasant",
    "Hot",
    "Chilly",
    "Muggy",
    "Dry",
    "Windy",
    "Calm",
];

type Deviation = "more" | "accurate" | "less";

function toggled(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function ComparisonSign({ children }: { children: string }) {
    return (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
            {children}
        </span>
    );
}

type ReportIssueDialogProps = {
    city: City;
    onClose: () => void;
};

export default function ReportIssueDialog({ city, onClose }: ReportIssueDialogProps) {
    const { units } = useUnits();

    const [overall, setOverall] = useState<string[]>([]);
    const [other, setOther] = useState<string[]>([]);
    const [descriptions, setDescriptions] = useState<string[]>([]);
    const [temperature, setTemperature] = useState<Deviation>("accurate");
    const [wind, setWind] = useState<Deviation>("accurate");
    const [sent, setSent] = useState(false);

    // What the page shows now for this city.
    const current = peekWeather(city.id)?.current ?? null;

    const dirty =
        overall.length > 0 ||
        other.length > 0 ||
        descriptions.length > 0 ||
        temperature !== "accurate" ||
        wind !== "accurate";

    if (sent) {
        return (
            <GlassDialog title="Report an Issue" onClose={onClose}>
                <div className="flex flex-col items-center gap-3 px-4 pt-16 pb-8 text-center">
                    <CheckCircle size={64} weight="fill" className="text-[#34c759]" />

                    <h3 className="text-xl font-semibold">Thank you</h3>

                    <p className="text-[17px] text-white/70">
                        Your report helps make the weather more accurate.
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 rounded-full bg-white/15 px-6 py-2.5 text-[17px] font-medium transition-colors hover:bg-white/25"
                    >
                        Done
                    </button>
                </div>
            </GlassDialog>
        );
    }

    return (
        <GlassDialog
            title="Report an Issue"
            onClose={onClose}
            action={
                <RoundButton
                    label="Send report"
                    disabled={!dirty}
                    onClick={() => setSent(true)}
                >
                    <PaperPlaneTilt size={22} />
                </RoundButton>
            }
        >
            <p className="px-1 pt-1 text-[17px] leading-snug">
                Help improve WeatherCast by describing the current conditions at
                your location.
            </p>

            <p className="mt-2 px-1 text-[15px] text-white/50">
                No account is needed, and nothing personal is collected.
            </p>

            <SectionTitle>Overall Conditions</SectionTitle>

            <Group>
                {OVERALL.map((item) => (
                    <SwitchRow
                        key={item.id}
                        icon={<WeatherIcon slug={item.slug} label="" size={30} />}
                        label={item.label}
                        checked={overall.includes(item.id)}
                        onChange={() => setOverall((set) => toggled(set, item.id))}
                    />
                ))}
            </Group>

            <SectionTitle
                hint={
                    current
                        ? `Shown as: ${formatTemperature(current.temperature, units.temperature)}`
                        : undefined
                }
            >
                Temperature
            </SectionTitle>

            <Group>
                <ChoiceRow
                    icon={<ThermometerHot size={26} weight="fill" />}
                    label="It’s warmer"
                    selected={temperature === "more"}
                    onSelect={() => setTemperature("more")}
                />
                <ChoiceRow
                    icon={<Thermometer size={26} weight="fill" />}
                    label="Seems accurate"
                    selected={temperature === "accurate"}
                    onSelect={() => setTemperature("accurate")}
                />
                <ChoiceRow
                    icon={<ThermometerCold size={26} weight="fill" />}
                    label="It’s colder"
                    selected={temperature === "less"}
                    onSelect={() => setTemperature("less")}
                />
            </Group>

            <SectionTitle
                hint={
                    current
                        ? `Shown as: ${formatWind(current.windSpeed, units.wind)}`
                        : undefined
                }
            >
                Wind
            </SectionTitle>

            <Group>
                <ChoiceRow
                    icon={<ComparisonSign>{">"}</ComparisonSign>}
                    label="It’s windier"
                    selected={wind === "more"}
                    onSelect={() => setWind("more")}
                />
                <ChoiceRow
                    icon={<ComparisonSign>{"="}</ComparisonSign>}
                    label="Seems accurate"
                    selected={wind === "accurate"}
                    onSelect={() => setWind("accurate")}
                />
                <ChoiceRow
                    icon={<ComparisonSign>{"<"}</ComparisonSign>}
                    label="It’s less windy"
                    selected={wind === "less"}
                    onSelect={() => setWind("less")}
                />
            </Group>

            <SectionTitle>Other Conditions</SectionTitle>

            <Group>
                {OTHER.map((item) => (
                    <ChoiceRow
                        key={item.id}
                        icon={<WeatherIcon slug={item.slug} label="" size={30} />}
                        label={item.label}
                        selected={other.includes(item.id)}
                        onSelect={() => setOther((set) => toggled(set, item.id))}
                    />
                ))}
            </Group>

            <SectionTitle>Descriptions</SectionTitle>

            <div className="grid grid-cols-2 gap-2">
                {DESCRIPTIONS.map((label) => {
                    const selected = descriptions.includes(label);

                    return (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                                setDescriptions((set) => toggled(set, label))
                            }
                            className={`rounded-[18px] px-4 py-3 text-[17px] transition-colors ${
                                selected
                                    ? "bg-sky-500/40 ring-1 ring-sky-300"
                                    : "bg-white/10 hover:bg-white/15"
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <p className="mt-5 px-1 text-[15px] text-white/50">
                If you have comments about WeatherCast,{" "}
                <a
                    href={FEEDBACK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300 underline"
                >
                    provide feedback online
                </a>
                .
            </p>
        </GlassDialog>
    );
}