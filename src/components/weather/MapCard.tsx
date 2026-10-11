"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import WeatherCard from "@/components/weather/WeatherCard";
import styles from "./MapCard.module.css";

type MapCardProps = {
    className?: string;
};

const TEHRAN_CENTER: [number, number] = [51.42, 35.69];

setWorkerUrl(
    new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString()
);

export default function MapCard({ className }: MapCardProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let map: MapLibreMap | undefined;
        let cancelled = false;

        const initializeMap = async () => {
            const container = mapContainerRef.current;
            const apiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

            if (!container || !apiKey) {
                console.error("MapLibre: CARTO API key is missing.");
                return;
            }

            if (cancelled) return;

            map = new MapLibreMap({
                container,
                style: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=${apiKey}`,
                center: TEHRAN_CENTER,
                zoom: 10,
                attributionControl: false,
                dragRotate: false,
                pitchWithRotate: false,
                doubleClickZoom: true,
            });

            const markerElement = document.createElement("div");
            markerElement.className = "weather-map-marker";
            markerElement.innerHTML = `
                <span class="weather-map-marker__glow"></span>
                <span class="weather-map-marker__core"></span>
            `;

            new Marker({
                element: markerElement,
                anchor: "center",
            })
                .setLngLat(TEHRAN_CENTER)
                .addTo(map);

            map.on("error", (event) => {
                console.error("MapLibre map error:", event.error);
            });
        };

        void initializeMap();

        return () => {
            cancelled = true;
            map?.remove();
        };
    }, []);

    return (
        <WeatherCard
            title="WEATHER MAP"
            className={className}
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <div
                ref={mapContainerRef}
                className={`min-h-0 w-full flex-1 overflow-hidden rounded-xl ${styles.map}`}
                aria-label="Weather map centered on Tehran"
            />
        </WeatherCard>
    );
}