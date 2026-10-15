export type CardSkeletonVariant =
    | "stat"
    | "wide"
    | "bars"
    | "rows"
    | "strip"
    | "gauge";

const ROWS = Array.from({ length: 10 }, (_, index) => index);
const HOURS = Array.from({ length: 12 }, (_, index) => index);

function Bone({ className = "" }: { className?: string }) {
    return (
        <span
            className={`block animate-pulse rounded-md bg-white/20 ${className}`}
        />
    );
}

type CardSkeletonProps = {
    variant: CardSkeletonVariant;
};

export default function CardSkeleton({ variant }: CardSkeletonProps) {
    if (variant === "strip") {
        return (
            <div aria-hidden="true" className="flex items-center gap-1 overflow-hidden pb-2">
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="flex w-14 shrink-0 flex-col items-center gap-3"
                    >
                        <Bone className="h-3.5 w-8" />
                        <Bone className="size-10 rounded-full" />
                        <Bone className="h-5 w-9" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "rows") {
        return (
            <div aria-hidden="true" className="flex h-full flex-col">
                {ROWS.map((row) => (
                    <div
                        key={row}
                        className="flex flex-1 items-center gap-2 border-t border-white/10"
                    >
                        <Bone className="h-4 w-12" />
                        <Bone className="size-6 rounded-full" />
                        <Bone className="h-4 w-8" />
                        <Bone className="h-1.5 flex-1 rounded-full" />
                        <Bone className="h-4 w-8" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "wide") {
        return (
            <div
                aria-hidden="true"
                className="grid h-full grid-cols-[minmax(0,1fr)_34cqw] gap-x-[4.3cqw]"
            >
                <div className="flex h-full flex-col justify-around">
                    <Bone className="h-[5cqw] w-full" />
                    <Bone className="h-[5cqw] w-full" />
                    <Bone className="h-[5cqw] w-full" />
                </div>

                <Bone className="aspect-square w-full self-center rounded-full" />
            </div>
        );
    }

    if (variant === "bars") {
        return (
            <div aria-hidden="true" className="flex h-full flex-col justify-between">
                <Bone className="h-[7cqw] w-[32cqw]" />
                <Bone className="h-[2cqw] w-full rounded-full" />
                <div className="flex flex-col gap-[2cqw]">
                    <Bone className="h-[4cqw] w-full" />
                    <Bone className="h-[4cqw] w-[60%]" />
                </div>
            </div>
        );
    }

    if (variant === "gauge") {
        return (
            <div aria-hidden="true" className="flex h-full items-center justify-center">
                <Bone className="aspect-square h-full max-h-full rounded-full opacity-60" />
            </div>
        );
    }

    return (
        <div aria-hidden="true" className="flex h-full flex-col justify-between">
            <div className="flex flex-col gap-[3cqw]">
                <Bone className="h-[23cqw] w-[48cqw]" />
                <Bone className="h-[9cqw] w-[62cqw]" />
            </div>

            <div className="flex flex-col gap-[2.5cqw]">
                <Bone className="h-[8.5cqw] w-full" />
                <Bone className="h-[8.5cqw] w-[70%]" />
            </div>
        </div>
    );
}