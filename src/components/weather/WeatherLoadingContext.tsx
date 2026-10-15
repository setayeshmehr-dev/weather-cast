"use client";

import { createContext, useContext } from "react";

// true while the weather data of the dashboard is loading.
export const WeatherLoadingContext = createContext(false);

export function useWeatherLoading(): boolean {
    return useContext(WeatherLoadingContext);
}