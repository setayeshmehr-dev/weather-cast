"use client";

import { useId } from "react";

const MOON_IMAGE = "/images/moon.webp";

// Tuning for the photo: extra rotation if it was not shot with lunar north up.
const PHOTO_OFFSET_DEGREES = 0;

/*
 * Lit region (lit on the right): the terminator ellipse followed by everything on
 * its right, far beyond the disk. The limb is never part of the shape, so the
 * blur only softens the terminator.
 */
function litRegion(illumination: number): string {
    const radiusX = 48 * Math.abs(1 - 2 * illumination);
    const sweep = illumination > 0.5 ? 0 : 1;

    return `M 50 2 A ${radiusX.toFixed(2)} 48 0 0 ${sweep} 50 98 L 50 112 L 130 112 L 130 -12 L 50 -12 Z`;
}

type MoonDiscProps = {
    illumination: number;
    /** Direction of the lit side, degrees clockwise from up. */
    litAngle: number;
    /** Rotation of the photo, degrees clockwise. */
    photoRotation: number;
    className?: string;
};

export default function MoonDisc({
    illumination,
    litAngle,
    photoRotation,
    className,
}: MoonDiscProps) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const clipId = `${id}-clip`;
    const maskId = `${id}-mask`;
    const softId = `${id}-soft`;
    const sphereId = `${id}-sphere`;
    const haloId = `${id}-halo`;

    return (
        <svg
            viewBox="-12 -12 124 124"
            className={className}
            aria-hidden="true"
        >
            <defs>
                <clipPath id={clipId}>
                    <circle cx={50} cy={50} r={48} />
                </clipPath>

                <filter id={softId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation={1.8} />
                </filter>

                <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x={-40}
                    y={-40}
                    width={180}
                    height={180}
                >
                    <rect x={-40} y={-40} width={180} height={180} fill="#ffffff" />

                    <g
                        filter={`url(#${softId})`}
                        transform={`rotate(${litAngle - 90} 50 50)`}
                    >
                        <path d={litRegion(illumination)} fill="#000000" />
                    </g>
                </mask>

                <radialGradient id={sphereId}>
                    <stop offset="55%" stopColor="#000000" stopOpacity={0} />
                    <stop offset="100%" stopColor="#000000" stopOpacity={0.5} />
                </radialGradient>

                <radialGradient id={haloId}>
                    <stop offset="70%" stopColor="#cfd8ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#cfd8ff" stopOpacity={0} />
                </radialGradient>
            </defs>

            <circle
                cx={50}
                cy={50}
                r={60}
                fill={`url(#${haloId})`}
                opacity={0.15 + 0.7 * illumination}
            />

            <g clipPath={`url(#${clipId})`}>
                <g transform={`rotate(${photoRotation + PHOTO_OFFSET_DEGREES} 50 50)`}>
                    <image
                        href={MOON_IMAGE}
                        x={-8}
                        y={-8}
                        width={116}
                        height={116}
                        preserveAspectRatio="xMidYMid slice"
                    />
                </g>

                <rect
                    x={-40}
                    y={-40}
                    width={180}
                    height={180}
                    fill="#070b1c"
                    fillOpacity={0.8}
                    mask={`url(#${maskId})`}
                />

                <circle cx={50} cy={50} r={48} fill={`url(#${sphereId})`} />
            </g>

            <circle
                cx={50}
                cy={50}
                r={48}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.12}
                strokeWidth={0.8}
            />
        </svg>
    );
}