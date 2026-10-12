export type City = {
    id: string;
    name: string;
    admin: string | null;
    country: string;
    latitude: number;
    longitude: number;
};

type CityInput = {
    name: string;
    admin?: string | null;
    country?: string | null;
    latitude: number;
    longitude: number;
};

// Two results closer than ~1 km share the same id (coordinates rounded to 2 decimals).
export function createCityId(latitude: number, longitude: number): string {
    return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export function createCity({
    name,
    admin,
    country,
    latitude,
    longitude,
}: CityInput): City {
    return {
        id: createCityId(latitude, longitude),
        name,
        admin: admin ?? null,
        country: country ?? "",
        latitude,
        longitude,
    };
}

export const DEFAULT_CITY: City = createCity({
    name: "Tehran",
    admin: "Tehran",
    country: "Iran",
    latitude: 35.69,
    longitude: 51.42,
});

/** "Rio de Janeiro, Rio de Janeiro, Brazil" without repeated parts. */
export function formatCityLabel(city: City): string {
    const parts = [city.name];

    if (city.admin && city.admin !== city.name) parts.push(city.admin);
    if (city.country) parts.push(city.country);

    return parts.join(", ");
}