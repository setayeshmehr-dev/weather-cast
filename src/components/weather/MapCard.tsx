"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Map, Marker, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
    ColorRamp,
    PrecipitationLayer,
    TemperatureLayer,
    WindLayer,
} from "@maptiler/weather";
import {
    CaretDown,
    Check,
    CloudRain,
    Stack,
    Thermometer,
    Wind,
} from "@phosphor-icons/react";
import PrecipitationMarker from "@/components/weather/PrecipitationMarker";
import TemperatureMarker from "@/components/weather/TemperatureMarker";
import WeatherCard from "@/components/weather/WeatherCard";
import WindMarker from "@/components/weather/WindMarker";
import type { CurrentWeather } from "@/hooks/useWeather";
import type { City } from "@/lib/cities";
import styles from "./MapCard.module.css";

type MapCardProps = {
    city: City;
    current: CurrentWeather | null;
    className?: string;
};

type WeatherLayerType = "wind" | "temperature" | "precipitation";

const WEATHER_LAYERS = [
    {
        id: "wind",
        label: "Wind",
        icon: Wind,
    },
    {
        id: "temperature",
        label: "Temperature",
        icon: Thermometer,
    },
    {
        id: "precipitation",
        label: "Precipitation",
        icon: CloudRain,
    },
] as const;

type LayerMarkerProps = {
    layer: WeatherLayerType;
    city: City;
    current: CurrentWeather;
};

// Each weather layer has its own marker.
function LayerMarker({ layer, city, current }: LayerMarkerProps) {
    if (layer === "wind") {
        return (
            <WindMarker
                city={city.name}
                speed={current.windSpeed}
                direction={current.windDirection}
            />
        );
    }

    if (layer === "precipitation") {
        return (
            <PrecipitationMarker
                city={city.name}
                temperature={current.temperature}
                weatherCode={current.weatherCode}
                isDay={current.isDay}
            />
        );
    }

    return (
        <TemperatureMarker
            city={city.name}
            temperature={current.temperature}
            low={current.min}
            high={current.max}
        />
    );
}

export default function MapCard({ city, current, className }: MapCardProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const activeLayerRef = useRef<string | null>(null);
    // The map is created once, centered on the city of the first render.
    const centerRef = useRef<[number, number]>([city.longitude, city.latitude]);
    const [activeLayer, setActiveLayer] =
        useState<WeatherLayerType>("temperature");
    const [menuOpen, setMenuOpen] = useState(false);
    const [markerElement, setMarkerElement] = useState<HTMLDivElement | null>(
        null,
    );

    useEffect(() => {
        const container = mapContainerRef.current;
        const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
        const maptilerApiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

        if (!container || !cartoApiKey || !maptilerApiKey) {
            console.error("MapCard: CARTO or MapTiler API key is missing.");
            return;
        }

        config.apiKey = maptilerApiKey;

        const map = new Map({
            container,
            style: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=${cartoApiKey}`,
            center: centerRef.current,
            zoom: 5,
            dragRotate: false,
            pitchWithRotate: false,
            doubleClickZoom: true,
            forceNoAttributionControl: true,
            navigationControl: false,
            geolocateControl: false,
        });

        mapRef.current = map;

        map.on("load", () => {
            // Empty anchor element: React renders the active layer's marker
            // inside it (see the portal below).
            const element = document.createElement("div");
            element.className = "size-0";

            markerRef.current = new Marker({
                element,
                anchor: "center",
            })
                .setLngLat(centerRef.current)
                .addTo(map);

            setMarkerElement(element);
        });

        map.on("error", (event) => {
            console.error("MapTiler map error:", event.error);
        });

        return () => {
            mapRef.current = null;
            markerRef.current = null;
            activeLayerRef.current = null;
            map.remove();
        };
    }, []);

    // Move the map and the marker when another city is selected.
    useEffect(() => {
        const center: [number, number] = [city.longitude, city.latitude];

        centerRef.current = center;
        markerRef.current?.setLngLat(center);
        mapRef.current?.flyTo({ center, essential: true });
    }, [city.longitude, city.latitude]);

    useEffect(() => {
        const map = mapRef.current;

        if (!map) return;

        let cancelled = false;

        const updateLayer = async () => {
            if (!map.isStyleLoaded()) {
                await new Promise<void>((resolve) => {
                    map.once("load", resolve);
                });
            }

            if (cancelled) return;

            if (activeLayerRef.current) {
                map.removeLayer(activeLayerRef.current);
                activeLayerRef.current = null;
            }

            let nextLayer: WindLayer | TemperatureLayer | PrecipitationLayer;

            if (activeLayer === "wind") {
                const windColorRamp = new ColorRamp({
                    stops: [
                        { value: 0, color: [15, 105, 158, 205] },
                        { value: 10, color: [20, 125, 179, 205] },
                        { value: 20, color: [28, 143, 195, 205] },
                        { value: 30, color: [44, 160, 211, 205] },
                        { value: 40, color: [75, 184, 226, 205] },
                    ],
                });

                nextLayer = new WindLayer({
                    id: "maptiler-wind",
                    opacity: 0.7,
                    colorramp: windColorRamp,
                    color: [126, 220, 255, 230],
                    fastColor: [177, 237, 255, 245],
                    smooth: true,
                    density: 2,
                    maxAmount: 128,
                    speed: 0.0006,
                    fadeFactor: 0.1,
                });
            } else if (activeLayer === "temperature") {
                nextLayer = new TemperatureLayer({
                    id: "maptiler-temperature",
                    opacity: 0.7,
                });
            } else {
                nextLayer = new PrecipitationLayer({
                    id: "maptiler-precipitation",
                    opacity: 0.75,
                });
            }

            if (cancelled) return;

            try {
                map.addLayer(nextLayer);
                activeLayerRef.current = nextLayer.id;
            } catch (error) {
                console.error("Weather layer error:", error);
            }
        };

        void updateLayer();

        return () => {
            cancelled = true;
        };
    }, [activeLayer]);

    const selectedLayer = WEATHER_LAYERS.find(
        (layer) => layer.id === activeLayer,
    )!;

    return (
        <WeatherCard
            skeleton="none"
            title={
                <div className="flex w-full items-center justify-between gap-3">
                    <span>WEATHER MAP</span>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Select weather map layer"
                            aria-expanded={menuOpen}
                            className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                        >
                            <Stack size={16} weight="regular" />
                            <span>Layers</span>
                            <CaretDown
                                size={13}
                                className={`transition-transform ${
                                    menuOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {menuOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#17171b]"
                            >
                                {WEATHER_LAYERS.map((layer) => {
                                    const Icon = layer.icon;
                                    const isActive = activeLayer === layer.id;

                                    return (
                                        <button
                                            key={layer.id}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={isActive}
                                            onClick={() => {
                                                setActiveLayer(layer.id);
                                                setMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                                isActive
                                                    ? "bg-black/5 text-gray-900 dark:bg-white/10 dark:text-white"
                                                    : "text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <Icon size={19} weight="regular" />
                                            <span className="flex-1">
                                                {layer.label}
                                            </span>
                                            {isActive && (
                                                <Check
                                                    size={16}
                                                    weight="bold"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            }
            className={className}
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <div
                ref={mapContainerRef}
                className={`min-h-0 w-full flex-1 overflow-hidden rounded-xl ${styles.map}`}
                aria-label={`Weather map of ${city.name} showing ${selectedLayer.label}`}
            />

            {markerElement &&
                current &&
                createPortal(
                    <LayerMarker
                        layer={activeLayer}
                        city={city}
                        current={current}
                    />,
                    markerElement,
                )}
        </WeatherCard>
    );
}