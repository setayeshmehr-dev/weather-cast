import type { ReactNode } from "react";

type WeatherCardProps = {
    title: string;
    icon?: ReactNode;
    divided?: boolean;
    className?: string;
    bodyClassName?: string;
    children?: ReactNode;
};

export default function WeatherCard({
    title,
    icon,
    divided = false,
    className = "",
    bodyClassName = "min-h-24",
    children,
}: WeatherCardProps) {
    return (
        <section
            aria-label={title}
            className={`min-w-0 overflow-hidden rounded-[22px] border border-white/20 bg-black/10 p-4 text-white backdrop-blur-lg ${className}`}
        >
            <h2
                className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60 ${
                    divided ? "border-b border-white/15 pb-2" : ""
                }`}
            >
                {icon}
                {title}
            </h2>

            <div className={`${divided ? "pt-3" : "mt-3"} ${bodyClassName}`}>
                {children}
            </div>
        </section>
    );
}