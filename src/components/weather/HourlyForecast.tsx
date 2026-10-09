
"use client";

import { useEffect, useState } from "react";

type HourlyForecastItem = {
  time: string;
  temperature: number;
  weatherCode: number;
};

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

type WeatherCondition = {
  icon: string;
  description: string;
};

function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return { icon: "☀️", description: "Clear sky" };
  if (code === 1) return { icon: "🌤️", description: "Mainly clear" };
  if (code === 2) return { icon: "⛅", description: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", description: "Overcast" };

  if (code === 45 || code === 48) {
    return { icon: "🌫️", description: "Fog" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { icon: "🌦️", description: "Drizzle" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { icon: "🌧️", description: "Rain" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { icon: "🌨️", description: "Snow" };
  }

  if ([95, 96, 99].includes(code)) {
    return { icon: "⛈️", description: "Thunderstorm" };
  }

  return { icon: "🌡️", description: "Unknown conditions" };
}

export default function HourlyForecast() {
  const [forecast, setForecast] = useState<HourlyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchForecast() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.3890&hourly=temperature_2m,weather_code&forecast_hours=24&timezone=Asia%2FTehran",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather forecast.");
        }

        const data = (await response.json()) as OpenMeteoResponse;

        const items = data.hourly.time
          .slice(0, 8)
          .map((time, index) => ({
            time,
            temperature: data.hourly.temperature_2m[index],
            weatherCode: data.hourly.weather_code[index],
          }))
          .filter(
            (item) =>
              Number.isFinite(item.temperature) &&
              Number.isFinite(item.weatherCode)
          );

        if (items.length === 0) {
          throw new Error("No hourly forecast data is available.");
        }

        setForecast(items);
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load the weather forecast.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchForecast();

    return () => controller.abort();
  }, []);

  return (
    <section
      aria-labelledby="hourly-forecast-title"
      className="w-full overflow-hidden rounded-2xl border border-white/20 bg-black/10 p-4 text-white backdrop-blur-lg"
    >
      <h2
        id="hourly-forecast-title"
        className="mb-4 text-sm font-medium tracking-wide text-white/60"
      >
        HOURLY FORECAST
      </h2>

      {loading && (
        <p className="py-4 text-sm text-white/70">
          Loading forecast...
        </p>
      )}

      {error && (
        <p role="alert" className="py-4 text-sm text-white/80">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="flex gap-5 overflow-x-auto pb-2">
          {forecast.map((hour, index) => {
            const condition = getWeatherCondition(hour.weatherCode);

            return (
              <div
                key={hour.time}
                className="flex min-w-12 shrink-0 flex-col items-center gap-3"
              >
                <span className="text-sm text-white/80">
                  {index === 0 ? "Now" : hour.time.slice(11, 16)}
                </span>

                <span
                  aria-label={condition.description}
                  title={condition.description}
                  className="text-2xl"
                >
                  {condition.icon}
                </span>

                <span className="text-lg font-medium">
                  {Math.round(hour.temperature)}°
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
