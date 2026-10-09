
"use client";

import { useEffect, useState } from "react";

type HourlyItem = {
  kind: "hour";
  time: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
};

type SunEvent = {
  kind: "sunrise" | "sunset";
  time: string;
};

type ForecastItem = HourlyItem | SunEvent;

type OpenMeteoResponse = {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
};

function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === -1) return "sunrise";
  if (code === -2) return "sunset";

  if (code === 0) return isDay ? "clear-day" : "clear-night";

  if (code === 1 || code === 2) {
    return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
  }

  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";

  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "rain";
  }

  if ([71, 73, 75, 77].includes(code)) return "snow";

  if ([85, 86].includes(code)) {
    return isDay ? "snow-showers-day" : "snow-showers-night";
  }

  if ([95, 96, 99].includes(code)) {
    return isDay
      ? "thunderstorms-day-rain"
      : "thunderstorms-night-rain";
  }

  return "overcast";
}

function formatTime(time: string): string {
  return time.slice(11, 16);
}

function WeatherIcon({
  slug,
  label,
}: {
  slug: string;
  label: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setSrc(null);

    import(`@meteocons/svg/fill/${slug}.svg`)
      .then((module) => {
        if (active) setSrc(module.default);
      })
      .catch(() => {
        import("@meteocons/svg/fill/overcast.svg")
          .then((module) => {
            if (active) setSrc(module.default);
          })
          .catch(() => {
            if (active) setSrc(null);
          });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!src) {
    return <span className="size-10 shrink-0" aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={label}
      width={40}
      height={40}
      className="size-10 shrink-0"
    />
  );
}

export default function HourlyForecast() {
  const [current, setCurrent] = useState<HourlyItem | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchForecast() {
      try {
        setLoading(true);
        setError(null);

        const api =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=35.69&longitude=51.42" +
          "&current=temperature_2m,weather_code,is_day" +
          "&hourly=temperature_2m,weather_code,is_day" +
          "&daily=sunrise,sunset" +
          "&forecast_days=2" +
          "&timezone=Asia%2FTehran";

        const response = await fetch(api, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch forecast.");
        }

        const data = (await response.json()) as OpenMeteoResponse;
        const currentTime = data.current.time;

        const now: HourlyItem = {
          kind: "hour",
          time: currentTime,
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
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

        const sunrise = data.daily.sunrise.find(
          (time) => time > currentTime
        );

        const sunset = data.daily.sunset.find(
          (time) => time > currentTime
        );

        if (hours.length !== 24 || !sunrise || !sunset) {
          throw new Error("Incomplete forecast data.");
        }

        const events: SunEvent[] = [
          { kind: "sunrise", time: sunrise },
          { kind: "sunset", time: sunset },
        ];

        const sortedForecast: ForecastItem[] = [
          ...hours,
          ...events,
        ].sort((a, b) => a.time.localeCompare(b.time));

        setCurrent(now);
        setForecast(sortedForecast);
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

      {!loading && !error && current && (
        <div className="flex gap-5 overflow-x-auto pb-2">
          {/* Current weather */}
          <div className="flex min-w-12 shrink-0 flex-col items-center gap-3">
            <span className="text-sm text-white/80">Now</span>

            <WeatherIcon
              slug={getWeatherIcon(current.weatherCode, current.isDay)}
              label="Current weather"
            />

            <span className="text-lg font-medium">
              {Math.round(current.temperature)}°
            </span>
          </div>

          {/* Next 24 hours and sun events, sorted by time */}
          {forecast.map((item) => {
            const isHour = item.kind === "hour";

            const slug = isHour
              ? getWeatherIcon(item.weatherCode, item.isDay)
              : item.kind;

            const label = isHour
              ? "Hourly weather"
              : item.kind === "sunrise"
                ? "Sunrise"
                : "Sunset";

            return (
              <div
                key={`${item.kind}-${item.time}`}
                className="flex min-w-12 shrink-0 flex-col items-center gap-3"
              >
                {/* Time always above the icon */}
                <span className="text-sm text-white/80">
                  {formatTime(item.time)}
                </span>

                <WeatherIcon slug={slug} label={label} />

                {/* Temperature or sun-event title below the icon */}
                <span className="text-lg font-medium">
                  {isHour
                    ? `${Math.round(item.temperature)}°`
                    : label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
