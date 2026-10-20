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
    sunrise: string;
    sunset: string;
};

export type PressureTrend = "rising" | "falling" | "steady";

/** One hour of the detailed series used by the detail popovers. */
export type HourlyPoint = {
    time: string;
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    isDay: boolean;
    precipitation: number;
    precipitationChance: number;
    uvIndex: number;
    pressure: number | null;
    visibility: number | null;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    relativeHumidity: number | null;
    dewPoint: number | null;
};

/** Yesterday, today and the next days, hour by hour. */
export type WeatherDetails = {
    hours: HourlyPoint[];
    days: DailyItem[];
    todayIndex: number;
};

export type CurrentWeather = {
    time: string;
    utcOffsetSeconds: number;
    timezone: string;
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
    timezone: string;
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
        apparent_temperature: number[];
        weather_code: number[];
        is_day: number[];
        relative_humidity_2m: (number | null)[];
        dew_point_2m: (number | null)[];
        visibility: (number | null)[];
        precipitation: (number | null)[];
        precipitation_probability: (number | null)[];
        pressure_msl: (number | null)[];
        uv_index: (number | null)[];
        wind_speed_10m: (number | null)[];
        wind_gusts_10m: (number | null)[];
        wind_direction_10m: (number | null)[];
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

type ProcessedWeather = {
    current: CurrentWeather | null;
    forecast: ForecastItem[];
    daily: DailyItem[];
    details: WeatherDetails | null;
    error: string | null;
};

type WeatherState = ProcessedWeather & { key: string };

type CacheEntry = {
    weather: ProcessedWeather;
    fetchedAt: number;
};

// Pressure change (hPa) over 3 hours from which the trend is rising or falling.
const PRESSURE_TREND_THRESHOLD = 1;

// Cached weather older than this is fetched again (and refreshed on screen).
const MAX_AGE_MS = 10 * 60 * 1000;

const EMPTY_FORECAST: ForecastItem[] = [];
const EMPTY_DAILY: DailyItem[] = [];

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<ProcessedWeather>>();

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
    let closestIndex = -1;
    let smallestDifference = Infinity;

    times.forEach((time, index) => {
        const difference = Math.abs(
            new Date(time).getTime() - new Date(currentTime).getTime()
        );

        if (Number.isFinite(difference) && difference < smallestDifference) {
            smallestDifference = difference;
            closestIndex = index;
        }
    });

    return closestIndex;
}

function processWeather(data: OpenMeteoResponse): ProcessedWeather {
    const currentTime = data.current.time;
    const currentDate = currentTime.slice(0, 10);
    const dayIndex = data.daily.sunrise.findIndex(
        (time) => time.slice(0, 10) === currentDate
    );

    if (dayIndex < 0) {
        throw new Error("Daily weather data is unavailable.");
    }

    // Closest hour: used for instant values (humidity, dew point, visibility).
    const currentHourIndex = getCurrentHourIndex(data.hourly.time, currentTime);

    if (currentHourIndex < 0) {
        throw new Error("Current hourly weather data is unavailable.");
    }

    // Last completed hour: precipitation and pressure are indexed by hour,
    // and the hourly arrays start yesterday (past_days=1).
    const lastHourIndex = data.hourly.time.indexOf(
        `${currentTime.slice(0, 13)}:00`
    );

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

    const current: CurrentWeather = {
        time: currentTime,
        utcOffsetSeconds: data.utc_offset_seconds,
        timezone: data.timezone,
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        pressure: data.current.pressure_msl,
        pressureTrend,
        precipitationLast24h: sumPrecipitation(lastHourIndex - 23, lastHourIndex + 1),
        precipitationNext24h: sumPrecipitation(lastHourIndex + 1, lastHourIndex + 25),
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
                hour.time > currentTime &&
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

    const allDays: DailyItem[] = data.daily.time.map((date, index) => ({
        date,
        min: data.daily.temperature_2m_min[index],
        max: data.daily.temperature_2m_max[index],
        weatherCode: data.daily.weather_code[index],
        precipitationChance: data.daily.precipitation_probability_max[index] ?? 0,
        sunrise: data.daily.sunrise[index],
        sunset: data.daily.sunset[index],
    }));

    const details: WeatherDetails = {
        hours: data.hourly.time.map((time, index) => ({
            time,
            temperature: data.hourly.temperature_2m[index],
            apparentTemperature: data.hourly.apparent_temperature[index],
            weatherCode: data.hourly.weather_code[index],
            isDay: data.hourly.is_day[index] === 1,
            precipitation: data.hourly.precipitation[index] ?? 0,
            precipitationChance: data.hourly.precipitation_probability[index] ?? 0,
            uvIndex: data.hourly.uv_index[index] ?? 0,
            pressure: data.hourly.pressure_msl[index],
            visibility: data.hourly.visibility[index],
            windSpeed: data.hourly.wind_speed_10m[index] ?? 0,
            windGusts: data.hourly.wind_gusts_10m[index] ?? 0,
            windDirection: data.hourly.wind_direction_10m[index] ?? 0,
            relativeHumidity: data.hourly.relative_humidity_2m[index],
            dewPoint: data.hourly.dew_point_2m[index],
        })),
        days: allDays,
        todayIndex: dayIndex,
    };

    return {
        current,
        forecast: [...hours, ...events].sort((a, b) => a.time.localeCompare(b.time)),
        daily: allDays.slice(dayIndex),
        details,
        error: null,
    };
}

async function requestWeather(city: City): Promise<ProcessedWeather> {
    const params = new URLSearchParams({
        latitude: String(city.latitude),
        longitude: String(city.longitude),
        current:
            "temperature_2m,apparent_temperature,pressure_msl,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m,uv_index,cloud_cover",
        hourly:
            "temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,dew_point_2m,visibility,precipitation,precipitation_probability,pressure_msl,uv_index,wind_speed_10m,wind_gusts_10m,wind_direction_10m",
        daily:
            "sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
        past_days: "1",
        forecast_days: "10",
        timezone: "auto",
    });

    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    );

    if (!response.ok) throw new Error("Failed to fetch weather.");

    const data = (await response.json()) as OpenMeteoResponse;

    if (!data.current || !data.hourly || !data.daily) {
        throw new Error("Invalid weather response.");
    }

    return processWeather(data);
}

/** The cached weather of a city, however old (or null). */
export function peekWeather(cityId: string): ProcessedWeather | null {
    return cache.get(cityId)?.weather ?? null;
}

/**
 * Loads the weather of a city (shared between callers), reusing the cache when it
 * is younger than maxAgeMs. It is used to prepare a city before it is shown.
 */
export function preloadWeather(
    city: City,
    maxAgeMs: number = MAX_AGE_MS
): Promise<ProcessedWeather> {
    const entry = cache.get(city.id);

    if (entry && Date.now() - entry.fetchedAt < maxAgeMs) {
        return Promise.resolve(entry.weather);
    }

    const pending = pendingRequests.get(city.id);

    if (pending) return pending;

    const request = requestWeather(city)
        .then((weather) => {
            cache.set(city.id, { weather, fetchedAt: Date.now() });

            return weather;
        })
        .finally(() => {
            pendingRequests.delete(city.id);
        });

    pendingRequests.set(city.id, request);

    return request;
}

export function useWeather(city: City) {
    const { id: key } = city;

    const [state, setState] = useState<WeatherState | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const weather = await preloadWeather(city);

                if (!cancelled) setState({ ...weather, key });
            } catch {
                // A failed refresh keeps showing the data we already have.
                if (!cancelled && peekWeather(key) === null) {
                    setState({
                        key,
                        current: null,
                        forecast: EMPTY_FORECAST,
                        daily: EMPTY_DAILY,
                        details: null,
                        error: "Unable to load weather data.",
                    });
                }
            }
        }

        void load();

        const interval = window.setInterval(() => void load(), MAX_AGE_MS);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [city, key]);

    // Cached data is shown immediately (no skeleton flash when switching city);
    // the effect above refreshes it when it is old.
    const cached = peekWeather(key);
    const result =
        state !== null && state.key === key
            ? state
            : cached !== null
                ? { ...cached, key }
                : null;

    return {
        current: result?.current ?? null,
        forecast: result?.forecast ?? EMPTY_FORECAST,
        daily: result?.daily ?? EMPTY_DAILY,
        details: result?.details ?? null,
        loading: result === null,
        error: result?.error ?? null,
    };
}