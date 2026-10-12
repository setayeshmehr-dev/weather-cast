const BACKGROUNDS = {
    clearDay: "linear-gradient(160deg, #3f7fd0 0%, #86b9ee 100%)",
    clearNight: "linear-gradient(160deg, #0f1633 0%, #2b3068 100%)",
    partlyDay: "linear-gradient(160deg, #5b86b8 0%, #9bb6d6 100%)",
    partlyNight: "linear-gradient(160deg, #1b2447 0%, #3a4170 100%)",
    overcastDay: "linear-gradient(160deg, #64768f 0%, #8da0b8 100%)",
    overcastNight: "linear-gradient(160deg, #2a3042 0%, #444c63 100%)",
    fog: "linear-gradient(160deg, #7b8794 0%, #a5afba 100%)",
    rainDay: "linear-gradient(160deg, #4d5d73 0%, #6f8197 100%)",
    rainNight: "linear-gradient(160deg, #252d3d 0%, #3b465a 100%)",
    snowDay: "linear-gradient(160deg, #8fa6bf 0%, #c8d6e5 100%)",
    snowNight: "linear-gradient(160deg, #3c4a63 0%, #5d6d88 100%)",
    storm: "linear-gradient(160deg, #3a3350 0%, #5b4c78 100%)",
};

/** Background of a city card, based on the weather code (WMO) and day or night. */
export function getWeatherBackground(code: number, isDay: boolean): string {
    if (code === 0 || code === 1) {
        return isDay ? BACKGROUNDS.clearDay : BACKGROUNDS.clearNight;
    }

    if (code === 2) {
        return isDay ? BACKGROUNDS.partlyDay : BACKGROUNDS.partlyNight;
    }

    if ([45, 48].includes(code)) return BACKGROUNDS.fog;

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return isDay ? BACKGROUNDS.rainDay : BACKGROUNDS.rainNight;
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return isDay ? BACKGROUNDS.snowDay : BACKGROUNDS.snowNight;
    }

    if ([95, 96, 99].includes(code)) return BACKGROUNDS.storm;

    return isDay ? BACKGROUNDS.overcastDay : BACKGROUNDS.overcastNight;
}