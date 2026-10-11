import { windDirectionName } from "@/lib/windDirection";

type WindMarkerProps = {
    city: string;
    speed: number;
    direction: number;
};

export default function WindMarker({
    city,
    speed,
    direction,
}: WindMarkerProps) {
    const directionName = windDirectionName(direction);

    return (
        <div
            role="img"
            aria-label={`${city}: wind from ${directionName} at ${Math.round(speed)} kilometers per hour`}
            className="pointer-events-none relative size-0"
        >
            <div className="absolute top-0 left-0 flex size-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full bg-white shadow-lg">
                <span className="text-[7px] leading-none font-semibold tracking-wide text-gray-500">
                    {directionName}
                </span>

                <span className="text-[20px] leading-none font-bold text-[#2f7fd1]">
                    {Math.round(speed)}
                </span>

                <span className="text-[7px] leading-none font-semibold tracking-wide text-gray-500 uppercase">
                    km/h
                </span>
            </div>

            <span className="absolute top-6.5 left-0 -translate-x-1/2 text-[14px] font-medium whitespace-nowrap text-white/85 [text-shadow:0_0_3px_rgba(0,40,90,0.8)]">
                {city}
            </span>
        </div>
    );
}