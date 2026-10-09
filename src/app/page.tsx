
import HourlyForecast from "@/components/weather/HourlyForecast";

export default function Home() {
  const weather = {
    city: "Tehran",
    temperature: 24,
    condition: "Partly Cloudy",
    max: 27,
    min: 18,
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-700 to-slate-900 p-6">
      <section className="my-10 flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl capitalize">{weather.city}</h1>
        <p className="mt-2 text-6xl font-light">{weather.temperature}°</p>
        <p className="mt-2 text-base">{weather.condition}</p>
        <p className="mt-1 text-sm text-white/80">H:{weather.max}° L:{weather.min}°</p>
      </section>

      <HourlyForecast />
    </main>
  );
}
