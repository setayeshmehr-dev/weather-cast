"use client";

import { useEffect, useState } from "react";

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

export type CurrentWeather = {
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    condition: string;
    max: number;
    min: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
};

type OpenMeteoResponse = {
    current: {
        time: string;
        temperature_2m: number;
        weather_code: number;
        is_day: number;
        wind_speed_10m: number;
        wind_gusts_10m: number;
        wind_direction_10m: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        is_day: number[];
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

function getWeatherCondition(code: number): string {
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

export function useWeather() {
    const [current, setCurrent] = useState<CurrentWeather | null>(null);
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [daily, setDaily] = useState<DailyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchWeather() {
            try {
                setLoading(true);
                setError(null);

                const api =
                    "https://api.open-meteo.com/v1/forecast" +
                    "?latitude=35.69&longitude=51.42" +
                    "&current=temperature_2m,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m" +
                    "&hourly=temperature_2m,weather_code,is_day" +
                    "&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max" +
                    "&forecast_days=10&timezone=Asia%2FTehran";

                const response = await fetch(api, { signal: controller.signal });
                if (!response.ok) throw new Error("Failed to fetch weather.");

                const data = (await response.json()) as OpenMeteoResponse;
                const currentTime = data.current.time;
                const currentDate = currentTime.slice(0, 10);
                const dayIndex = data.daily.sunrise.findIndex((time) => time.slice(0, 10) === currentDate);

                if (dayIndex < 0) throw new Error("Daily weather data is unavailable.");

                const weather: CurrentWeather = {
                    temperature: data.current.temperature_2m,
                    weatherCode: data.current.weather_code,
                    isDay: data.current.is_day === 1,
                    condition: getWeatherCondition(data.current.weather_code),
                    max: data.daily.temperature_2m_max[dayIndex],
                    min: data.daily.temperature_2m_min[dayIndex],
                    windSpeed: data.current.wind_speed_10m,
                    windGusts: data.current.wind_gusts_10m,
                    windDirection: data.current.wind_direction_10m,
                };

                const hours: HourlyItem[] = data.hourly.time
                    .map((time, index) => ({
                        kind: "hour" as const,
                        time,
                        temperature: data.hourly.temperature_2m[index],
                        weatherCode: data.hourly.weather_code[index],
                        isDay: data.hourly.is_day[index] === 1,
                    }))
                    .filter((hour) =>
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

                const days: DailyItem[] = data.daily.time
                    .map((date, index) => ({
                        date,
                        min: data.daily.temperature_2m_min[index],
                        max: data.daily.temperature_2m_max[index],
                        weatherCode: data.daily.weather_code[index],
                        precipitationChance: data.daily.precipitation_probability_max[index] ?? 0,
                    }))
                    .slice(dayIndex);

                setCurrent(weather);
                setForecast([...hours, ...events].sort((a, b) => a.time.localeCompare(b.time)));
                setDaily(days);
            } catch {
                if (!controller.signal.aborted) {
                    setError("Unable to load weather data.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void fetchWeather();
        return () => controller.abort();
    }, []);

    return { current, forecast, daily, loading, error };
}