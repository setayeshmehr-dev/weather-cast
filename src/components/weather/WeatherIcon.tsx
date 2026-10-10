"use client";

import { useEffect, useState } from "react";

type WeatherIconProps = {
    slug: string;
    label: string;
    size?: number;
};

export default function WeatherIcon({
    slug,
    label,
    size = 40,
}: WeatherIconProps) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setSrc(null);

        import(`@meteocons/svg/fill/${slug}.svg`)
            .then((module) => {
                if (active) setSrc(module.default);
            })
            .catch(() => {
                import("@meteocons/svg/fill/overcast.svg")
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
    }, [slug]);

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