"use client";

import { CaretUpDown, Check } from "@phosphor-icons/react";

import GlassDialog, { RoundButton } from "@/components/menu/GlassDialog";
import { ChoiceRow, Group, SectionTitle } from "@/components/menu/DialogParts";
import { useUnits } from "@/hooks/useUnits";
import {
    DISTANCE_UNITS,
    PRECIPITATION_UNITS,
    PRESSURE_UNITS,
    WIND_UNITS,
    systemTemperature,
} from "@/lib/units";

type SelectRowProps<T extends string> = {
    label: string;
    value: T;
    options: Record<T, string>;
    onChange: (value: T) => void;
};

/** A row showing the current value; a native select on top of it does the choosing. */
function SelectRow<T extends string>({
    label,
    value,
    options,
    onChange,
}: SelectRowProps<T>) {
    const keys = Object.keys(options) as T[];

    return (
        <label className="relative flex cursor-pointer items-center justify-between px-4 py-3.5 text-[17px] transition-colors hover:bg-white/5">
            <span>{label}</span>

            <span className="flex items-center gap-1.5 text-white/60">
                {options[value]}
                <CaretUpDown size={16} />
            </span>

            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value as T)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
            >
                {keys.map((key) => (
                    <option key={key} value={key}>
                        {options[key]}
                    </option>
                ))}
            </select>
        </label>
    );
}

type UnitsDialogProps = {
    onClose: () => void;
};

export default function UnitsDialog({ onClose }: UnitsDialogProps) {
    const { units, setUnit, restoreDefaults } = useUnits();

    const systemLabel = systemTemperature() === "celsius" ? "°C" : "°F";

    return (
        <GlassDialog
            title="Units"
            onClose={onClose}
            showClose={false}
            action={
                <RoundButton label="Done" onClick={onClose}>
                    <Check size={24} weight="bold" />
                </RoundButton>
            }
        >
            <SectionTitle muted>Temperature</SectionTitle>

            <Group>
                <ChoiceRow
                    label="Celsius (°C)"
                    selected={units.temperature === "celsius"}
                    onSelect={() => setUnit("temperature", "celsius")}
                />
                <ChoiceRow
                    label="Fahrenheit (°F)"
                    selected={units.temperature === "fahrenheit"}
                    onSelect={() => setUnit("temperature", "fahrenheit")}
                />
                <ChoiceRow
                    label={`Use system setting (${systemLabel})`}
                    selected={units.temperature === "system"}
                    onSelect={() => setUnit("temperature", "system")}
                />
            </Group>

            <SectionTitle muted>Other Units</SectionTitle>

            <Group>
                <SelectRow
                    label="Wind"
                    value={units.wind}
                    options={WIND_UNITS}
                    onChange={(value) => setUnit("wind", value)}
                />
                <SelectRow
                    label="Precipitation"
                    value={units.precipitation}
                    options={PRECIPITATION_UNITS}
                    onChange={(value) => setUnit("precipitation", value)}
                />
                <SelectRow
                    label="Pressure"
                    value={units.pressure}
                    options={PRESSURE_UNITS}
                    onChange={(value) => setUnit("pressure", value)}
                />
                <SelectRow
                    label="Distance"
                    value={units.distance}
                    options={DISTANCE_UNITS}
                    onChange={(value) => setUnit("distance", value)}
                />
            </Group>

            <div className="mt-8">
                <Group>
                    <button
                        type="button"
                        onClick={restoreDefaults}
                        className="w-full px-4 py-3.5 text-left text-[17px] text-sky-300 transition-colors hover:bg-white/5"
                    >
                        Restore Defaults
                    </button>
                </Group>
            </div>

            <p className="mt-3 px-1 text-[15px] text-white/50">
                Set all weather units to the defaults for your region.
            </p>
        </GlassDialog>
    );
}