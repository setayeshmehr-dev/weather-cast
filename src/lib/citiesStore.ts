import { DEFAULT_CITY } from "@/lib/cities";
import type { City } from "@/lib/cities";

export type CitiesState = {
    cities: City[];
    selected: City;
    sidebarOpen: boolean;
};

const STORAGE_KEY = "weathercast:state";
const DESKTOP_QUERY = "(min-width: 768px)";

// What the server (and the first hydration render) sees.
const SERVER_STATE: CitiesState = {
    cities: [DEFAULT_CITY],
    selected: DEFAULT_CITY,
    sidebarOpen: false,
};

let state: CitiesState = SERVER_STATE;
let loaded = false;

const listeners = new Set<() => void>();

function isCity(value: unknown): value is City {
    if (typeof value !== "object" || value === null) return false;

    const city = value as Record<string, unknown>;

    return (
        typeof city.id === "string" &&
        typeof city.name === "string" &&
        (city.admin === null || typeof city.admin === "string") &&
        typeof city.country === "string" &&
        typeof city.latitude === "number" &&
        typeof city.longitude === "number"
    );
}

function readStoredState(): CitiesState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;

        const { cities, selected, sidebarOpen } = parsed as Record<string, unknown>;

        if (
            !Array.isArray(cities) ||
            cities.length === 0 ||
            !cities.every(isCity) ||
            !isCity(selected)
        ) {
            return null;
        }

        return {
            cities: cities as City[],
            selected,
            sidebarOpen: false,
        };
    } catch {
        return null;
    }
}

function load(): void {
    if (loaded || typeof window === "undefined") return;

    loaded = true;

    state = readStoredState() ?? SERVER_STATE;
}

function setState(next: CitiesState): void {
    state = next;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Storage can be unavailable (private mode, quota); persistence is optional.
    }

    listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function getSnapshot(): CitiesState {
    load();

    return state;
}

export function getServerSnapshot(): CitiesState {
    return SERVER_STATE;
}

/** Shows a city without saving it (a preview from the search suggestions). */
export function selectCity(city: City): void {
    load();
    setState({ ...state, selected: city });
}

/** Saves a city to the list and shows it. */
export function addCity(city: City): void {
    load();

    const exists = state.cities.some((item) => item.id === city.id);

    setState({
        ...state,
        cities: exists ? state.cities : [...state.cities, city],
        selected: city,
    });
}

export function removeCity(id: string): void {
    load();

    if (state.cities.length <= 1) return;

    const cities = state.cities.filter((city) => city.id !== id);
    const selected = state.selected.id === id ? cities[0] : state.selected;

    setState({ ...state, cities, selected });
}

export function setSidebarOpen(open: boolean): void {
    load();
    setState({ ...state, sidebarOpen: open });
}

export function reorderCities(from: number, to: number) {
    load();

    // Validate indices — silent no-op on bad input.
    if (from === to) return;
    if (from < 0 || from >= state.cities.length) return;
    if (to < 0 || to >= state.cities.length) return;

    // Compute the reordered array. We splice the dragged item out, then
    // splice it back in at the target index. This matches the algorithm
    // used by `useDragReorder`'s `computeToIndex`.
    const nextCities = [...state.cities];
    const [moved] = nextCities.splice(from, 1);
    nextCities.splice(to, 0, moved);

    // `setState` handles state mutation + localStorage persistence +
    // listener notification in one shot, matching the pattern of
    // `addCity`, `removeCity`, and `setSidebarOpen`.
    setState({ ...state, cities: nextCities });
}