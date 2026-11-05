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

// The map always opens, and returns after a city change, at this zoom.
const DEFAULT_ZOOM = 5;

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
        const maptilerApiKey = process.env.NEXT_PUBLIC_MAPTILER;

        if (!container || !maptilerApiKey) {
            console.error("MapCard: MapTiler API key is missing.");
            return;
        }

        config.apiKey = maptilerApiKey;

        const map = new Map({
            container,
            style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
            center: centerRef.current,
            zoom: DEFAULT_ZOOM,
            dragRotate: false,
            pitchWithRotate: false,
            doubleClickZoom: true,
            forceNoAttributionControl: true,
            navigationControl: false,
            geolocateControl: false,
            // On touch screens one finger scrolls the page and two fingers move the map.
            cooperativeGestures: window.matchMedia("(pointer: coarse)").matches,
        });

        mapRef.current = map;

        map.on("load", () => {
            // Empty anchor element: React renders the active layer's marker
            // inside it (see the portal below).
            const element = document.createElement("div");
            element.className = "size-0";

            const marker = new Marker({
                element,
                anchor: "center",
            }).setLngLat(centerRef.current);

            marker.addTo(map);
            markerRef.current = marker;

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
        mapRef.current?.flyTo({ center, zoom: DEFAULT_ZOOM, essential: true });
    }, [city.longitude, city.latitude]);

    useEffect(() => {
        const map = mapRef.current;

        if (!map) return;

        let cancelled = false;

        const updateLayer = async () => {
            if (!map.isStyleLoaded()) {
                await new Promise<void>((resolve) => {
                    map.once("load", () => resolve());
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
                    density: 14,
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

    const menuWrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!menuOpen) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!menuWrapperRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    return (
        <WeatherCard
            skeleton="none"
            title={
                <div ref={menuWrapperRef} className="flex w-full items-center justify-between gap-3">
                    <span>WEATHER MAP</span>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Select weather map layer"
                            aria-expanded={menuOpen}
                            className="group relative flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-xs font-semibold text-gray-700 backdrop-blur-md backdrop-saturate-150 backdrop-brightness-105 transition-transform duration-200 hover:scale-[1.03] active:scale-95 dark:text-gray-100"
                        >
                            {/* frosted tint */}
                            <span className="absolute inset-0 rounded-full bg-white/10 transition-colors duration-200 group-hover:bg-white/20 dark:bg-white/6 dark:group-hover:bg-white/12" />
                            {/* diagonal sheen */}
                            <span className="absolute inset-0 rounded-full bg-linear-to-br from-white/40 via-transparent to-white/20" />
                            {/* gradient rim */}
                            <span className="absolute inset-0 rounded-full p-px [background:linear-gradient(150deg,rgba(255,255,255,0.7),rgba(255,255,255,0.12)_45%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.45))] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]" />
                            {/* inner depth */}
                            <span className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(17,17,26,0.08)]" />

                            <Stack size={16} weight="regular" className="relative text-gray-500" />
                            <span className="relative">Layers</span>
                            <CaretDown
                                size={13}
                                className={`relative transition-transform duration-300 ${
                                    menuOpen ? "rotate-180" : ""
                                }`}
                            />
</button>

                        {menuOpen && (
                            <div
                                role="menu"
                                className={`${styles.menuPanel} absolute right-0 top-full z-20 mt-3 min-w-56 overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-1.5 shadow-[0_12px_40px_rgba(31,38,135,0.16),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#17171b]/60 dark:shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]`}
                            >
                                {/* ambient light bubbles inside the glass */}
                                <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-sky-400/20 blur-2xl dark:bg-sky-400/20" />
                                <div className="pointer-events-none absolute -bottom-10 -left-8 size-24 rounded-full bg-cyan-300/20 blur-2xl dark:bg-cyan-400/10" />
                                {/* top edge reflection */}
                                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/90 to-transparent dark:via-white/25" />

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
                                            className={`group/item relative z-10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                                                isActive
                                                    ? "bg-white/60 text-gray-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_10px_rgba(31,38,135,0.12)] dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_2px_10px_rgba(0,0,0,0.4)]"
                                                    : "text-gray-700 hover:bg-white/40 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:text-gray-300 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <Icon
                                                size={19}
                                                weight="regular"
                                                className={
                                                    isActive
                                                        ? "text-sky-600 dark:text-sky-300"
                                                        : "text-gray-400 transition-colors group-hover/item:text-sky-500 dark:text-gray-500 dark:group-hover/item:text-sky-300"
                                                }
                                            />
                                            <span className="flex-1">{layer.label}</span>
                                            {isActive && (
                                                <span className="flex size-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:text-sky-300">
                                                    <Check size={14} weight="bold" />
                                                </span>
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