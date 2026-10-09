
type HourlyForecastItem = {
  time: string;
  temperature: number;
};

const hourlyForecast: HourlyForecastItem[] = [
  { time: "Now", temperature: 24 },
  { time: "10 PM", temperature: 23 },
  { time: "11 PM", temperature: 22 },
  { time: "12 AM", temperature: 21 },
  { time: "1 AM", temperature: 20 },
  { time: "2 AM", temperature: 19 },
  { time: "3 AM", temperature: 18 },
  { time: "4 AM", temperature: 18 },
];

export default function HourlyForecast() {
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

      <div className="flex gap-5 overflow-x-auto pb-2">
        {hourlyForecast.map((hour) => (
          <div
            key={hour.time}
            className="flex min-w-12 shrink-0 flex-col items-center gap-3"
          >
            <span className="text-sm text-white/80">{hour.time}</span>

            <div
              aria-hidden="true"
              className="h-8 w-8"
            />

            <span className="text-lg font-medium">
              {hour.temperature}°
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
