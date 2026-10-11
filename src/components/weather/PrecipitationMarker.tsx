import WeatherIcon from "@/components/weather/WeatherIcon";
import { getWeatherIcon } from "@/hooks/useWeather";

type PrecipitationMarkerProps = {
    city: string;
    temperature: number;
    weatherCode: number;
    isDay: boolean;
};

export default function PrecipitationMarker({
    city,
    temperature,
    weatherCode,
    isDay,
}: PrecipitationMarkerProps) {
    return (
        <div
            role="img"
            aria-label={`${city}: ${Math.round(temperature)}°`}
            className="pointer-events-none relative size-0"
        >
            <div className="absolute -top-19.75 left-1/2 h-14 w-14 -translate-x-1/2 drop-shadow-md">
                <svg
                    viewBox="0 0 56 66"
                    width={56}
                    height={66}
                    className="absolute top-0 left-0 overflow-visible"
                    aria-hidden="true"
                >
                    <circle cx={28} cy={28} r={28} fill="#ffffff" />

                    <path
                        d="M 21.5 52 L 28 64.5 L 34.5 52 Z"
                        fill="#ffffff"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />

                    <circle cx={28} cy={28} r={24.5} fill="#59647a" />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-2 text-white">
                    <span className="text-[19px] leading-none font-bold">
                        {Math.round(temperature)}°
                    </span>

                    <WeatherIcon
                        slug={getWeatherIcon(weatherCode, isDay)}
                        label="Current weather"
                        size={20}
                    />
                </div>
            </div>

            <span className="absolute top-0 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />

            <span className="absolute top-2 left-0 -translate-x-1/2 text-[13px] font-semibold whitespace-nowrap text-black [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_0_3px_#fff]">
                {city}
            </span>
        </div>
    );
}