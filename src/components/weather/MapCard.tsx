
"use client";

import { useEffect, useRef } from "react";
import WeatherCard from "@/components/weather/WeatherCard";
import styles from "./MapCard.module.css";

type MapCardProps = {
    className?: string;
};

const TEHRAN_POSITION: [number, number] = [35.69, 51.42];

export default function MapCard({ className }: MapCardProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let map: import("leaflet").Map | undefined;
        let cancelled = false;

        const initializeMap = async () => {
            const container = mapContainerRef.current;

            if (!container) return;

            const L = await import("leaflet");

            if (cancelled || !mapContainerRef.current) return;

            map = L.map(container, {
                zoomControl: false,
                attributionControl: true,
            }).setView(TEHRAN_POSITION, 10);

            L.tileLayer(
                `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`,
                {
                    subdomains: "abcd",
                    maxZoom: 20,
                    updateWhenIdle: true,
                    updateWhenZooming: false,
                    keepBuffer: 3,
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                }
            ).addTo(map);

            const markerIcon = L.divIcon({
                className: "weather-map-marker",
                html: `
                    <span class="weather-map-marker__glow"></span>
                    <span class="weather-map-marker__core"></span>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });

            L.marker(TEHRAN_POSITION, { icon: markerIcon }).addTo(map);
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
