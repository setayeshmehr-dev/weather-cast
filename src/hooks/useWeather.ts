
"use client";

import { useEffect, useState } from "react";

import type { City } from "@/lib/cities";

export type HourlyItem = {
    kind: "hour";
    time: string;
    temperature: number;
    weatherCode: number;
    isDay: boolean;
};

export type SunEvent = {
    kind: "sunrise" | "sunset";
    time: string;
};

export type ForecastItem = HourlyItem | SunEvent;

export type DailyItem = {
    date: string;
    min: number;
    max: number;
    weatherCode: number;
    precipitationChance: number;
};

export type PressureTrend = "rising" | "falling" | "steady";

export type CurrentWeather = {
    time: string;
    utcOffsetSeconds: number;
    temperature: number;
    feelsLike: number;
    pressure: number;
    pressureTrend: PressureTrend;
    precipitationLast24h: number;
    precipitationNext24h: number;
    weatherCode: number;
    isDay: boolean;
    condition: string;
    max: number;
    min: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    relativeHumidity: number | null;
    dewPoint: number | null;
    visibility: number | null;
    uvIndex: number | null;
    cloudCover: number | null;
};

type OpenMeteoResponse = {
    utc_offset_seconds: number;
    current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        pressure_msl: number;
        weather_code: number;
        is_day: number;
        wind_speed_10m: number;
        wind_gusts_10m: number;
        wind_direction_10m: number;
        uv_index: number | null;
        cloud_cover: number | null;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        is_day: number[];
        relative_humidity_2m: (number | null)[];
        dew_point_2m: (number | null)[];
        visibility: (number | null)[];
        precipitation: (number | null)[];
        pressure_msl: (number | null)[];
    };
    daily: {
        time: string[];
        sunrise: string[];
        sunset: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        precipitation_probability_max: (number | null)[];
    };
};

type WeatherState = {
    key: string;
    current: CurrentWeather | null;
    forecast: ForecastItem[];
    daily: DailyItem[];
    error: string | null;
};

const PRESSURE_TREND_THRESHOLD = 1;

const EMPTY_FORECAST: ForecastItem[] = [];
const EMPTY_DAILY: DailyItem[] = [];

export function getWeatherCondition(code: number): string {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([85, 86].includes(code)) return "Snow showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Unknown";
}

export function getWeatherIcon(code: number, isDay: boolean): string {
    if (code === 0) return isDay ? "clear-day" : "clear-night";
    if ([1, 2].includes(code)) return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
    if (code === 3) return "overcast";
    if ([45, 48].includes(code)) return "fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
    if ([71, 73, 75, 77].includes(code)) return "snow";
    if ([85, 86].includes(code)) return isDay ? "snow-showers-day" : "snow-showers-night";
    if ([95, 96, 99].includes(code)) return isDay ? "thunderstorms-day-rain" : "thunderstorms-night-rain";
    return "overcast";
}

function getCurrentHourIndex(times: string[], currentTime: string): number {
    const currentHour = currentTime.slice(0, 13);

    return times.findIndex((time) => time.slice(0, 13) === currentHour);
}

export function useWeather(city: City) {
    const { id: key, latitude, longitude } = city;

    const [state, setState] = useState<WeatherState | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchWeather() {
            try {
                const api =
                    "https://api.open-meteo.com/v1/forecast" +
                    `?latitude=${latitude}&longitude=${longitude}` +
                    "&current=temperature_2m,apparent_temperature,pressure_msl,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m,uv_index,cloud_cover" +
                    "&hourly=temperature_2m,weather_code,is_day,relative_humidity_2m,dew_point_2m,visibility,precipitation,pressure_msl" +
                    "&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max" +
                    "&past_days=1&forecast_days=10&timezone=auto";

                const response = await fetch(api, { signal: controller.signal });

                if (!response.ok) {
                    throw new Error("Failed to fetch weather.");
                }

                const data = (await response.json()) as OpenMeteoResponse;
                const currentTime = data.current.time;
                const currentHour = currentTime.slice(0, 13);
                const currentDate = currentTime.slice(0, 10);

                const dayIndex = data.daily.sunrise.findIndex(
                    (time) => time.slice(0, 10) === currentDate
                );

                if (dayIndex < 0) {
                    throw new Error("Daily weather data is unavailable.");
                }

                const currentHourIndex = getCurrentHourIndex(
                    data.hourly.time,
                    currentTime
                );

                if (currentHourIndex < 0) {
                    throw new Error("Current hourly weather data is unavailable.");
                }

                const lastHourIndex = data.hourly.time.indexOf(`${currentHour}:00`);

                if (lastHourIndex < 24) {
                    throw new Error("Incomplete hourly data.");
                }

                const sumPrecipitation = (from: number, to: number) =>
                    data.hourly.precipitation
                        .slice(from, to)
                        .reduce<number>((sum, value) => sum + (value ?? 0), 0);

                const pressureBefore = data.hourly.pressure_msl[lastHourIndex - 3];
                const pressureChange =
                    pressureBefore === null || pressureBefore === undefined
                        ? 0
                        : data.current.pressure_msl - pressureBefore;

                const pressureTrend: PressureTrend =
                    pressureChange >= PRESSURE_TREND_THRESHOLD
                        ? "rising"
                        : pressureChange <= -PRESSURE_TREND_THRESHOLD
                            ? "falling"
                            : "steady";

                const weather: CurrentWeather = {
                    time: currentTime,
                    utcOffsetSeconds: data.utc_offset_seconds,
                    temperature: data.current.temperature_2m,
                    feelsLike: data.current.apparent_temperature,
                    pressure: data.current.pressure_msl,
                    pressureTrend,
                    precipitationLast24h: sumPrecipitation(
                        lastHourIndex - 23,
                        lastHourIndex + 1
                    ),
                    precipitationNext24h: sumPrecipitation(
                        lastHourIndex + 1,
                        lastHourIndex + 25
                    ),
                    weatherCode: data.current.weather_code,
                    isDay: data.current.is_day === 1,
                    condition: getWeatherCondition(data.current.weather_code),
                    max: data.daily.temperature_2m_max[dayIndex],
                    min: data.daily.temperature_2m_min[dayIndex],
                    windSpeed: data.current.wind_speed_10m,
                    windGusts: data.current.wind_gusts_10m,
                    windDirection: data.current.wind_direction_10m,
                    relativeHumidity: data.hourly.relative_humidity_2m[currentHourIndex],
                    dewPoint: data.hourly.dew_point_2m[currentHourIndex],
                    visibility: data.hourly.visibility[currentHourIndex],
                    uvIndex: data.current.uv_index ?? null,
                    cloudCover: data.current.cloud_cover ?? null,
                };

                const hours: HourlyItem[] = data.hourly.time
                    .map((time, index) => ({
                        kind: "hour" as const,
                        time,
                        temperature: data.hourly.temperature_2m[index],
                        weatherCode: data.hourly.weather_code[index],
                        isDay: data.hourly.is_day[index] === 1,
                    }))
                    .filter(
                        (hour) =>
                            hour.time.slice(0, 13) > currentHour &&
                            Number.isFinite(hour.temperature) &&
                            Number.isFinite(hour.weatherCode)
                    )
                    .slice(0, 24);

                const sunrise = data.daily.sunrise.find((time) => time > currentTime);
                const sunset = data.daily.sunset.find((time) => time > currentTime);

                if (hours.length !== 24 || !sunrise || !sunset) {
                    throw new Error("Incomplete forecast data.");
                }

                const events: SunEvent[] = [
                    { kind: "sunrise", time: sunrise },
                    { kind: "sunset", time: sunset },
                ];

                const days: DailyItem[] = data.daily.time
                    .map((date, index) => ({
                        date,
                        min: data.daily.temperature_2m_min[index],
                        max: data.daily.temperature_2m_max[index],
                        weatherCode: data.daily.weather_code[index],
                        precipitationChance:
                            data.daily.precipitation_probability_max[index] ?? 0,
                    }))
                    .slice(dayIndex);

                setState({
                    key,
                    current: weather,
                    forecast: [...hours, ...events].sort((a, b) =>
                        a.time.localeCompare(b.time)
                    ),
                    daily: days,
                    error: null,
                });
            } catch {
                if (!controller.signal.aborted) {
                    setState({
                        key,
                        current: null,
                        forecast: EMPTY_FORECAST,
                        daily: EMPTY_DAILY,
                        error: "Unable to load weather data.",
                    });
                }
            }
        }

        void fetchWeather();

        return () => controller.abort();
    }, [key, latitude, longitude]);

    const result = state !== null && state.key === key ? state : null;

    return {
        current: result?.current ?? null,
        forecast: result?.forecast ?? EMPTY_FORECAST,
        daily: result?.daily ?? EMPTY_DAILY,
        loading: result === null,
        error: result?.error ?? null,
    };
}
