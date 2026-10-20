"use client";

import { useId } from "react";

const MOON_IMAGE = "/images/moon.webp";
// The photo has empty margin around the moon. This scale makes the edge of the
// moon touch the edge of the disc, so the shadow and the glow start right at it.
// If the moon is 86% of the photo width, the scale is 1 / 0.86 = 1.16.
const MOON_SCALE = 1.19;

/*
 * The dark region (lit side on the right): everything left of the terminator,
 * which is an elliptical arc. The limb is never part of the shape, so the blur
 * only softens the terminator.
 */
function shadowRegion(illumination: number): string {
    const radiusX = 48 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 0 : 1;

    return `M 50 2 A ${radiusX.toFixed(2)} 48 0 0 ${sweep} 50 98 L 50 112 L -30 112 L -30 -12 L 50 -12 Z`;
}

type MoonDiscProps = {
    /** Phase of the moon: 0 = new, 0.5 = full, 1 = new again. */
    phase: number;
    className?: string;
};

/*
 * The moon itself never moves: only the shadow grows and shrinks. Before the
 * full moon the right side is lit, after it the left side.
 */
export default function MoonDisc({ phase, className = "" }: MoonDiscProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const softId = `${id}-soft`;

    const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    const waxing = phase < 0.5;

    return (
        <div
            className={`relative aspect-square rounded-full ${className}`}
            style={{
                boxShadow: `0 0 ${24 + 40 * illumination}px rgba(207, 216, 255, ${0.08 + 0.3 * illumination})`,
            }}
        >
            <div className="absolute inset-0 overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={MOON_IMAGE}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                    style={{ transform: `scale(${MOON_SCALE})` }}
                />

                {/* The unlit side is dimmed, not black, so the surface stays faintly visible. */}
                <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 size-full"
                    style={{ transform: waxing ? "none" : "scaleX(-1)" }}
                    aria-hidden="true"
                >
                    <defs>
                        <filter id={softId} x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation={1.8} />
                        </filter>
                    </defs>

                    <path
                        d={shadowRegion(illumination)}
                        fill="#070b1c"
                        fillOpacity={0.8}
                        filter={`url(#${softId})`}
                    />
                </svg>

                {/* Limb darkening: the edge of the sphere is darker than its center. */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.5) 100%)",
                    }}
                />
            </div>

            <div className="absolute inset-0 rounded-full ring-1 ring-white/10 ring-inset" />
        </div>
    );
}