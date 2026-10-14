
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

type WeatherIconStyle = "line" | "fill";

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

export function WeatherIconProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [style, setStyle] = useState<WeatherIconStyle>("line");

    useEffect(() => {
        const savedStyle = localStorage.getItem("weather-icon-style");

        if (savedStyle === "line" || savedStyle === "fill") {
            setStyle(savedStyle);
        }
    }, []);

    function toggleStyle() {
        const nextStyle = style === "line" ? "fill" : "line";
        localStorage.setItem("weather-icon-style", nextStyle);
        setStyle(nextStyle);
    }

    return (
        <WeatherIconContext.Provider value={{ style, toggleStyle }}>
            {children}
        </WeatherIconContext.Provider>
    );
}

export function WeatherIconStyleToggle() {
    const { style, toggleStyle } = useContext(WeatherIconContext);

    return (
        <button
            type="button"
            onClick={toggleStyle}
            className="mx-auto mt-6 block rounded-full border border-white/25 bg-black/15 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
            aria-label="Toggle weather icon style"
        >
            Icon style: {style === "line" ? "Line" : "Fill"}
        </button>
    );
}

export default function WeatherIcon({
    slug,
    label,
    size = 40,
}: WeatherIconProps) {
    const { style } = useContext(WeatherIconContext);
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setSrc(null);

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
