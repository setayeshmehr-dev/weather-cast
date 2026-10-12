"use client";

import { useSyncExternalStore } from "react";

import {
    addCity,
    getServerSnapshot,
    getSnapshot,
    removeCity,
    selectCity,
    setSidebarOpen,
    subscribe,
} from "@/lib/citiesStore";

export function useCities() {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        cities: state.cities,
        selectedCity: state.selected,
        isSelectedSaved: state.cities.some((city) => city.id === state.selected.id),
        sidebarOpen: state.sidebarOpen,
        selectCity,
        addCity,
        removeCity,
        setSidebarOpen,
    };
}