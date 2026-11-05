"use client";

import { useMemo } from "react";

import { useUnits } from "@/hooks/useUnits";
import { niceTicks } from "@/lib/chart";
import {
    DISTANCE_UNITS,
    PRECIPITATION_UNITS,
    PRESSURE_UNITS,
    WIND_UNITS,
    convertDistance,
    convertPrecipitation,
    convertPressure,
    convertTemperature,
    convertWind,
} from "@/lib/units";
import type { BeaufortLevel } from "@/lib/wind";

type Convert = (value: number) => number;

/*
 * Tick values (in the unit of the data) that are round numbers in the unit shown:
 * in °F the ticks are 50, 55, 60 and not the Fahrenheit value of some round °C.
 */
function ticksIn(
    low: number,
    high: number,
    count: number,
    to: Convert,
    from: Convert
): number[] {
    return niceTicks(to(low), to(high), count).map(from);
}

/** A number with at most one decimal ("9.5", "12"). */
function short(value: number): string {
    return String(Math.round(value * 10) / 10);
}

/*
 * Formats the weather data (which the app keeps in °C, km/h, mm, hPa and km) in the
 * units the person chose. Thresholds and colors keep using the raw data.
 */
export function useFormat() {
    const { units, temperatureUnit } = useUnits();

    return useMemo(() => {
        const fahrenheit = temperatureUnit === "fahrenheit";

        const toTemperature: Convert = (celsius) =>
            convertTemperature(celsius, temperatureUnit);
        const fromTemperature: Convert = (value) =>
            fahrenheit ? ((value - 32) * 5) / 9 : value;

        const toWind: Convert = (kmh) => convertWind(kmh, units.wind);
        const fromWind: Convert = (value) => value / convertWind(1, units.wind);

        const toPressure: Convert = (hpa) => convertPressure(hpa, units.pressure);
        const fromPressure: Convert = (value) =>
            value / convertPressure(1, units.pressure);

        const toDistance: Convert = (km) =>
            convertDistance(km * 1000, units.distance);
        const fromDistance: Convert = (value) =>
            value / convertDistance(1000, units.distance);

        const pressureDigits =
            units.pressure === "inhg" ? 2 : units.pressure === "kpa" ? 1 : 0;
        const precipitationDigits = units.precipitation === "in" ? 2 : 1;

        const wind = (kmh: number): string =>
            units.wind === "ms"
                ? toWind(kmh).toFixed(1)
                : String(Math.round(toWind(kmh)));

        return {
            units,

            // Temperature (data in °C)
            temperature: (celsius: number) => Math.round(toTemperature(celsius)),
            temperatureTicks: (low: number, high: number, count = 6) =>
                ticksIn(low, high, count, toTemperature, fromTemperature),
            temperatureTick: (celsius: number) =>
                `${Math.round(toTemperature(celsius))}°`,

            // Wind (data in km/h)
            wind,
            windUnit: WIND_UNITS[units.wind],
            windTicks: (low: number, high: number, count = 5) =>
                ticksIn(low, high, count, toWind, fromWind),
            windTick: (kmh: number) => short(toWind(kmh)),
            beaufortRange: (level: BeaufortLevel, next?: BeaufortLevel) => {
                if (units.wind === "kmh") return level.range;
                if (!next) return `≥ ${wind(level.min)}`;
                if (level.force === 0) return `< ${wind(next.min)}`;

                return `${wind(level.min)} - ${wind(next.min - 1)}`;
            },

            // Pressure (data in hPa)
            pressure: (hpa: number) => toPressure(hpa).toFixed(pressureDigits),
            pressureUnit: PRESSURE_UNITS[units.pressure],
            pressureTicks: (low: number, high: number, count = 6) =>
                ticksIn(low, high, count, toPressure, fromPressure),
            pressureTick: (hpa: number) => toPressure(hpa).toFixed(pressureDigits),

            // Precipitation (data in mm)
            precipitation: (mm: number) => {
                const value = convertPrecipitation(mm, units.precipitation);

                return value < 0.5 * 10 ** -precipitationDigits
                    ? "0"
                    : value.toFixed(precipitationDigits);
            },
            // Large totals (a month): whole mm, or inches with one decimal.
            precipitationTotal: (mm: number) =>
                units.precipitation === "in"
                    ? convertPrecipitation(mm, "in").toFixed(1)
                    : String(Math.round(mm)),
            precipitationUnit: PRECIPITATION_UNITS[units.precipitation],

            // Distance (data in km)
            distance: (km: number) => {
                const value = toDistance(km);

                return value < 10 ? value.toFixed(1) : String(Math.round(value));
            },
            distanceWhole: (km: number) => String(Math.round(toDistance(km))),
            distanceTicks: (low: number, high: number, count = 5) =>
                ticksIn(low, high, count, toDistance, fromDistance),
            distanceTick: (km: number) => short(toDistance(km)),
            longDistance: (km: number) =>
                Math.round(toDistance(km)).toLocaleString("en-US"),
            distanceUnit: DISTANCE_UNITS[units.distance],
        };
    }, [units, temperatureUnit]);
}