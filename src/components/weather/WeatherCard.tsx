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
    bodyClassName = "",
    children,
}: WeatherCardProps) {
    return (
        <section
            aria-label={title}
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-white/20 bg-black/10 p-3 text-white backdrop-blur-lg min-[656px]:p-2.5 ${className}`}
        >
            <h2
                className={`flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60 ${
                    divided ? "border-b border-white/15 pb-2" : ""
                }`}
            >
                {icon}
                {title}
            </h2>

            <div
                className={`min-h-0 flex-1 ${
                    divided ? "pt-3" : "mt-3"
                } ${bodyClassName}`}
            >
                {children}
            </div>
        </section>
    );
}