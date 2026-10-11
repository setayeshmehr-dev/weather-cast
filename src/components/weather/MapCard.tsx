"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
    ColorRamp,
    PrecipitationLayer,
    PressureLayer,
    RadarLayer,
    TemperatureLayer,
    WindLayer,
} from "@maptiler/weather";import WeatherCard from "@/components/weather/WeatherCard";
import styles from "./MapCard.module.css";

type MapCardProps = {
    className?: string;
};

const TEHRAN_CENTER: [number, number] = [51.42, 35.69];

export default function MapCard({ className }: MapCardProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

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
            center: TEHRAN_CENTER,
            zoom: 5,
            dragRotate: false,
            pitchWithRotate: false,
            doubleClickZoom: true,
            forceNoAttributionControl: true, 
            navigationControl: false,
            geolocateControl: false,         
        });

        map.on("load", () => {
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

            const windColorRamp = new ColorRamp({

                stops: [
                    { value: 0, color: [15, 105, 158, 205] },
                    { value: 10, color: [20, 125, 179, 205] },
                    { value: 20, color: [28, 143, 195, 205] },
                    { value: 30, color: [44, 160, 211, 205] },
                    { value: 40, color: [75, 184, 226, 205] },
                ],
            });

            // const nextLayer = new WindLayer({
            //     id: "maptiler-wind",
            //     opacity: 0.7,
            //     colorramp: windColorRamp,
            //     color: [126, 220, 255, 230],
            //     fastColor: [177, 237, 255, 245],
            //     smooth: true,
            //     density: 50,
            // });

            const nextLayer = new TemperatureLayer({
                id: "maptiler-temperature",
                opacity: 0.7,
            });

            // const nextLayer = new PrecipitationLayer({
            //     id: "maptiler-precipitation",
            //     opacity: 0.75,
            // });

            // const nextLayer = new RadarLayer({
            //     id: "maptiler-radar",
            //     opacity: 0.75,
            // });

            // const nextLayer = new PressureLayer({
            //     id: "maptiler-pressure",
            //     opacity: 0.75,
            // });

            map.addLayer(nextLayer);
        });

        map.on("error", (event) => {
            console.error("MapTiler map error:", event.error);
        });

        return () => {
            map.remove();
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
