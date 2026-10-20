"use client";

import { Plus, SidebarSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import { useCities } from "@/hooks/useCities";
import { preloadWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";
import { preloadWeatherVideo } from "@/lib/preloadVideo";
import { getWeatherVideoName, getWeatherVideoUrls } from "@/lib/weatherVideo";

const MOBILE_QUERY = "(max-width: 767px)";

const FLOATING_BUTTON_CLASS =
    "flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25";

export default function Home() {
    const {
        cities,
        selectedCity,
        isSelectedSaved,
        sidebarOpen,
        selectCity,
        addCity,
        removeCity,
        setSidebarOpen,
    } = useCities();

    const [query, setQuery] = useState("");
    const [pendingCity, setPendingCity] = useState<City | null>(null);
    const selectionRequest = useRef(0);

    const closeSidebarOnMobile = () => {
        // On small screens the sidebar is an overlay: close it to show the city.
        if (window.matchMedia(MOBILE_QUERY).matches) setSidebarOpen(false);
    };

    /*
     * The old city stays on screen until the new one is ready: its weather is
     * loaded and the video of its weather is warmed up (both with a timeout, so
     * this can never get stuck). A newer click cancels an older one.
     */
    const handleSelectCity = async (city: City) => {
        const requestId = ++selectionRequest.current;

        if (city.id === selectedCity.id) {
            setPendingCity(null);
            closeSidebarOnMobile();
            return;
        }

        setPendingCity(city);

        try {
            const { current } = await preloadWeather(city);

            if (requestId !== selectionRequest.current) return;

            if (current) {
                const name = getWeatherVideoName(
                    current.weatherCode,
                    current.isDay,
                    current.cloudCover,
                );

                await preloadWeatherVideo(getWeatherVideoUrls(name).page);
            }
        } catch {
            // The dashboard shows the error of this city.
        }

        if (requestId !== selectionRequest.current) return;

        selectCity(city);
        setPendingCity(null);
        closeSidebarOnMobile();
    };

    const handleAddCity = () => {
        addCity(selectedCity);
        setQuery("");
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-linear-to-b from-sky-700 to-slate-900">
            {pendingCity && (
                <div
                    role="progressbar"
                    aria-label={`Loading ${pendingCity.name}`}
                    className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-white/80"
                />
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/*
              * Desktop: the sidebar takes space and pushes the content (width 0 <-> 264px).
              * Mobile: it is a fixed overlay that slides in over the content.
              * The inner box keeps its width so the content does not reflow while sliding.
              */}
            <aside
                inert={!sidebarOpen}
                className={`z-40 shrink-0 overflow-hidden transition-[width,translate] duration-300 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-66 ${
                    sidebarOpen
                        ? "md:w-66 max-md:translate-x-0"
                        : "md:w-0 max-md:-translate-x-full"
                }`}
            >
                <div className="h-full w-66 p-2">
                    <Sidebar
                        cities={cities}
                        selectedCity={selectedCity}
                        query={query}
                        onQueryChange={setQuery}
                        onSelectCity={handleSelectCity}
                        onRemoveCity={removeCity}
                        onClose={() => setSidebarOpen(false)}
                    />
                </div>
            </aside>

            <div className="relative min-w-0 flex-1 overflow-y-auto">
                <div className="sticky top-0 z-20 h-0">
                    <div className="flex items-center gap-2 p-3">
                        {!sidebarOpen && (
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Show sidebar"
                                className={FLOATING_BUTTON_CLASS}
                            >
                                <SidebarSimple size={20} />
                            </button>
                        )}

                        {!isSelectedSaved && (
                            <button
                                type="button"
                                onClick={handleAddCity}
                                aria-label={`Add ${selectedCity.name} to the list`}
                                className={FLOATING_BUTTON_CLASS}
                            >
                                <Plus size={20} weight="bold" />
                            </button>
                        )}
                    </div>
                </div>

                <WeatherDashboard city={selectedCity} />
            </div>
        </div>
    );
}