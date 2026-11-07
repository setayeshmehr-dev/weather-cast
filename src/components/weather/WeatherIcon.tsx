"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { ReactNode } from "react";

export type WeatherIconStyle = "line" | "fill";

const STORAGE_KEY = "weather-icon-style";

type WeatherIconContextValue = {
    style: WeatherIconStyle;
    toggleStyle: () => void;
};

type WeatherIconProps = {
    slug: string;
    label: string;
    size?: number;
};

const WeatherIconContext = createContext<WeatherIconContextValue>({
    style: "line",
    toggleStyle: () => {},
});

function readSavedStyle(): WeatherIconStyle {
    if (typeof window === "undefined") return "line";

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved === "fill" ? "fill" : "line";
    } catch {
        return "line";
    }
}

export function WeatherIconProvider({ children }: { children: ReactNode }) {
    // The provider is mounted after hydration, so the saved style can be read at once
    // (no flash of the other style).
    const [style, setStyle] = useState<WeatherIconStyle>(readSavedStyle);

    const toggleStyle = useCallback(() => {
        const next: WeatherIconStyle = style === "line" ? "fill" : "line";

        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // The style still changes until the page is closed.
        }

        setStyle(next);
    }, [style]);

    const value = useMemo(() => ({ style, toggleStyle }), [style, toggleStyle]);

    return (
        <WeatherIconContext.Provider value={value}>
            {children}
        </WeatherIconContext.Provider>
    );
}

/** The style of the weather icons ("line" or "fill") and a function that switches it. */
export function useWeatherIconStyle(): WeatherIconContextValue {
    return useContext(WeatherIconContext);
}

export default function WeatherIcon({
    slug,
    label,
    size = 40,
}: WeatherIconProps) {
    const { style } = useWeatherIconStyle();
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        // The icon on screen stays until the new one is loaded (no blank moment).
        import(`@meteocons/svg/${style}/${slug}.svg`)
            .then((module) => {
                if (active) setSrc(module.default);
            })
            .catch(() => {
                import(`@meteocons/svg/${style}/overcast.svg`)
                    .then((module) => {
                        if (active) setSrc(module.default);
                    })
                    .catch(() => {
                        if (active) setSrc(null);
                    });
            });

        return () => {
            active = false;
        };
    }, [slug, style]);

    if (!src) {
        return (
            <span
                className="shrink-0"
                style={{ width: size, height: size }}
                aria-hidden="true"
            />
        );
    }

    return (
        <img
            src={src}
            alt={label}
            width={size}
            height={size}
            className="shrink-0"
            style={{ width: size, height: size }}
        />
    );
}