"use client";

import { Plus, SidebarSimple } from "@phosphor-icons/react";
import { useState } from "react";

import BootScreen from "@/components/BootScreen";
import Sidebar from "@/components/sidebar/Sidebar";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import { useBootReady } from "@/hooks/useBootReady";
import { useCities } from "@/hooks/useCities";
import { useDisplayedCity } from "@/hooks/useDisplayedCity";
import { useHydrated } from "@/hooks/useHydrated";
import type { City } from "@/lib/cities";

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
        reorderCities,
        setSidebarOpen,
    } = useCities();

    // The saved city is known only after hydration: nothing is fetched before that
    // (otherwise the default city would be loaded first and then the real one).
    const hydrated = useHydrated();

    // The page keeps the previous city until the selected one is ready.
    const { city: displayedCity, pending } = useDisplayedCity(
        selectedCity,
        hydrated
    );

    const bootReady = useBootReady(displayedCity, hydrated);

    const [query, setQuery] = useState("");

    const handleSelectCity = (city: City) => {
        selectCity(city);

        // On small screens the sidebar is an overlay: close it to show the city.
        if (window.matchMedia(MOBILE_QUERY).matches) setSidebarOpen(false);
    };

    const handleAddCity = () => {
        addCity(selectedCity);
        setQuery("");
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-linear-to-b from-sky-700 to-slate-900">
            <BootScreen done={bootReady} />

            {pending && (
                <div
                    role="progressbar"
                    aria-label={`Loading ${selectedCity.name}`}
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
                        onReorderCities={reorderCities}
                        onClose={() => setSidebarOpen(false)}
                    />
                </div>
            </aside>

            <div className="relative min-w-0 flex-1 overflow-hidden">
                <div className="absolute top-0 left-0 z-30 flex items-center gap-2 p-3">
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

                {hydrated && <WeatherDashboard city={displayedCity} />}
            </div>
        </div>
    );
}