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

const GLASS_ROUND_ICON =
    "group relative flex size-10 items-center justify-center overflow-hidden rounded-full " +
    "text-white/70 " +
    "backdrop-blur-md backdrop-saturate-150 backdrop-brightness-105 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_16px_rgba(17,17,26,0.12)] " +
    "transition-all duration-200 hover:scale-105 active:scale-90 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 " +
    // frosted tint + diagonal sheen in one gradient (::before)
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-full " +
    "before:bg-[linear-gradient(135deg,rgba(255,255,255,0.60),rgba(255,255,255,0.1)_38%,rgba(255,255,255,0.1)_62%,rgba(255,255,255,0.3))] " +
    "hover:before:bg-[linear-gradient(135deg,rgba(255,255,255,0.42),rgba(255,255,255,0.14)_38%,rgba(255,255,255,0.14)_62%,rgba(255,255,255,0.26))] " +
    // gradient rim (::after)
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:p-px " +
    "after:bg-[linear-gradient(150deg,rgba(255,255,255,0.7),rgba(255,255,255,0.12)_45%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.45))] " +
    "after:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] " +
    "after:[-webkit-mask-composite:xor] " +
    "after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

const FLOATING_BUTTON_CLASS =
    "flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 md:size-10";

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
                {/* Everything is placed below the notch / status bar of phones. */}
                <div className="absolute inset-x-0 top-[env(safe-area-inset-top)] bottom-0">
                    <div className="absolute top-0 left-0 z-30 flex flex-col items-start gap-2 p-3 md:flex-row md:items-center">
                        {!sidebarOpen && (
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Show sidebar"
                                className={GLASS_ROUND_ICON}
                            >
                                <SidebarSimple size={24} />
                            </button>
                        )}

                        {!isSelectedSaved && (
                            <button
                                type="button"
                                onClick={handleAddCity}
                                aria-label={`Add ${selectedCity.name} to the list`}
                                className={GLASS_ROUND_ICON}
                            >
                                <Plus size={20} weight="bold" />
                            </button>
                        )}
                    </div>

                    {hydrated && <WeatherDashboard city={displayedCity} />}
                </div>
            </div>
        </div>
    );
}