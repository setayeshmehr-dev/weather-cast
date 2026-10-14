const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];

/** Name (without extension) of the video for a weather condition. */
export function getWeatherVideoName(
    weatherCode: number | null,
    isDay: boolean,
    cloudCover?: number | null,
): string {
    const code = weatherCode ?? -1;

    if ([45, 48].includes(code)) return isDay ? "overcast-day" : "overcast-night";

    if ([95, 96, 99].includes(code)) return "thunderstorm";

    if (RAIN_CODES.includes(code)) return "rain";

    if (SNOW_CODES.includes(code)) {
        if (!isDay) return "snow-night";

        return [75, 86].includes(code) ? "heavy-snow-day" : "snow-day";
    }

    if ([0, 1].includes(code)) return isDay ? "clear-day" : "clear-night";

    if (code === 2) {
        if (cloudCover != null && cloudCover >= 60) {
            return isDay ? "mostly-cloudy-day" : "mostly-cloudy-night";
        }

        return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
    }

    return isDay ? "overcast-day" : "overcast-night";
}

export function getWeatherVideoUrls(name: string) {
    return {
        page: `/videos/${name}.webm`,
        card: `/videos/card/${name}.webm`,
        poster: `/videos/poster/${name}.webp`,
        cardPoster: `/videos/poster/card/${name}.webp`,
    };
}