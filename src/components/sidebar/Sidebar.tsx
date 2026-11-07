
"use client";

import {
    Check,
    MagnifyingGlass,
    PencilSimple,
    SidebarSimple,
    XCircle,
} from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import CityCard from "@/components/sidebar/CityCard";
import CityEditList from "@/components/sidebar/CityEditList";
import { useCitySearch } from "@/hooks/useCitySearch";
import { useCitySummaries } from "@/hooks/useCitySummaries";
import { useDragReorder } from "@/hooks/useDragReorder";
import { useNow } from "@/hooks/useNow";
import { formatCityLabel } from "@/lib/cities";
import type { City } from "@/lib/cities";

function stripDiacritics(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type SuggestionLabelProps = {
    label: string;
    query: string;
};

function SuggestionLabel({ label, query }: SuggestionLabelProps) {
    const typed = query.trim();

    const matches =
        stripDiacritics(label.slice(0, typed.length)).toLowerCase() ===
        stripDiacritics(typed).toLowerCase();

    if (!matches) return <span className="text-white/60">{label}</span>;

    return (
        <>
            <span className="text-white">{label.slice(0, typed.length)}</span>
            <span className="text-white/60">{label.slice(typed.length)}</span>
        </>
    );
}

type MessageProps = {
    title?: string;
    text: string;
};

function Message({ title, text }: MessageProps) {
    return (
        <div className="flex flex-col items-center gap-2 px-4 pt-16 text-center">
            <MagnifyingGlass size={44} className="text-white/40" />
            {title && <p className="text-lg font-semibold text-white">{title}</p>}
            <p className="text-sm text-white/60">{text}</p>
        </div>
    );
}

type SidebarProps = {
    cities: City[];
    selectedCity: City;
    query: string;
    onQueryChange: (query: string) => void;
    onSelectCity: (city: City) => void;
    onRemoveCity: (id: string) => void;
    onReorderCities: (from: number, to: number) => void;
    onClose: () => void;
};

export default function Sidebar({
    cities,
    selectedCity,
    query,
    onQueryChange,
    onSelectCity,
    onRemoveCity,
    onReorderCities,
    onClose,
}: SidebarProps) {
    const [focused, setFocused] = useState(false);
    const [editing, setEditing] = useState(false);

    const summaries = useCitySummaries(cities);
    const now = useNow();
    const search = useCitySearch(query);
    const drag = useDragReorder(cities, onReorderCities);

    const trimmed = query.trim();
    const searching = focused || query !== "";

    const handleClose = () => {
        setEditing(false);
        onClose();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            onQueryChange("");
            event.currentTarget.blur();
        }

        if (event.key === "Enter" && search.results.length > 0) {
            onSelectCity(search.results[0]);
        }
    };

    const draggingId = drag.draggingId;
    const dropIndex = drag.dropIndex ?? -1;

    const filteredCities = draggingId
        ? cities.filter((city) => city.id !== draggingId)
        : cities;

    const renderContent = () => {
        if (!searching) {
            if (editing) {
                return (
                    <CityEditList
                        cities={cities}
                        selectedCity={selectedCity}
                        summaries={summaries}
                        now={now}
                        onMove={onReorderCities}
                        onRemove={onRemoveCity}
                    />
                );
            }

            return (
                <ul className="flex flex-col gap-5">
                    {filteredCities.map((city, index) => (
                        <Fragment key={city.id}>
                            {index === dropIndex && (
                                <li
                                    className="h-24 list-none"
                                    aria-hidden="true"
                                />
                            )}

                            <li
                                data-draggable-id={city.id}
                                className="list-none"
                            >
                                <div
                                    onPointerDown={(event) =>
                                        drag.onItemPointerDown(city.id, event)
                                    }
                                >
                                    <CityCard
                                        city={city}
                                        summary={summaries[city.id]}
                                        now={now}
                                        selected={city.id === selectedCity.id}
                                        canRemove={cities.length > 1}
                                        onSelect={() => onSelectCity(city)}
                                        onRemove={() => onRemoveCity(city.id)}
                                        suppressClick={drag.wasDragging}
                                    />
                                </div>
                            </li>
                        </Fragment>
                    ))}

                    {dropIndex === filteredCities.length && dropIndex >= 0 && (
                        <li
                            className="h-24 list-none"
                            aria-hidden="true"
                        />
                    )}
                </ul>
            );
        }

        if (trimmed.length < 2) {
            return (
                <Message text="Type at least two letters to search for a city." />
            );
        }

        if (search.loading) {
            return (
                <p className="px-2 py-3 text-sm text-white/60">
                    Searching…
                </p>
            );
        }

        if (search.error) {
            return (
                <Message
                    title="Search unavailable"
                    text="Check your connection and try again."
                />
            );
        }

        if (search.results.length === 0) {
            return (
                <Message
                    title="No Results"
                    text={`No results found for “${trimmed}”.`}
                />
            );
        }

        return (
            <ul className="flex flex-col">
                {search.results.map((city) => (
                    <li key={city.id}>
                        <button
                            type="button"
                            onClick={() => onSelectCity(city)}
                            className={`mt-2 w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                                city.id === selectedCity.id
                                    ? "bg-white/15"
                                    : "hover:bg-white/10"
                            }`}
                        >
                            <SuggestionLabel
                                label={formatCityLabel(city)}
                                query={query}
                            />
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    const draggedCity =
        drag.draggingId !== null
            ? cities.find((city) => city.id === drag.draggingId) ?? null
            : null;

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-white backdrop-blur-xl">
            <div className="flex h-11 shrink-0 items-center justify-end gap-1 px-2">
                <button
                    type="button"
                    onClick={() => setEditing((value) => !value)}
                    aria-label={editing ? "Done editing" : "Edit list"}
                    aria-pressed={editing}
                    className={`flex size-8 items-center justify-center rounded-lg hover:bg-white/10 ${
                        editing
                            ? "bg-white/15 text-white"
                            : "text-white/80"
                    }`}
                >
                    {editing ? (
                        <Check size={20} weight="bold" />
                    ) : (
                        <PencilSimple size={20} />
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Hide sidebar"
                    className="flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                >
                    <SidebarSimple size={20} />
                </button>
            </div>

            <div className="shrink-0 px-2 pb-2">
                <div className="flex h-9 items-center gap-2 rounded-xl bg-black/30 px-3 text-sm focus-within:ring-2 focus-within:ring-blue-500/80">
                    <MagnifyingGlass
                        size={16}
                        className="shrink-0 text-white/60"
                    />

                    <input
                        type="text"
                        value={query}
                        onChange={(event) =>
                            onQueryChange(event.target.value)
                        }
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search"
                        aria-label="Search for a city"
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/50"
                    />

                    {query !== "" && (
                        <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onQueryChange("")}
                            aria-label="Clear search"
                            className="shrink-0 text-white/60 hover:text-white"
                        >
                            <XCircle size={18} weight="fill" />
                        </button>
                    )}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-2">
                {renderContent()}
            </div>

            {drag.draggingId !== null &&
                drag.pointerPosition !== null &&
                drag.cardRect !== null &&
                draggedCity &&
                createPortal(
                    <div
                        className="pointer-events-none fixed z-50"
                        style={{
                            left:
                                drag.pointerPosition.x -
                                drag.pointerOffset.x,
                            top:
                                drag.pointerPosition.y -
                                drag.pointerOffset.y,
                            width: drag.cardRect.width,
                            transform: "scale(1.05)",
                            transformOrigin: "top left",
                            filter:
                                "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45))",
                            opacity: 0.95,
                        }}
                    >
                        <CityCard
                            city={draggedCity}
                            summary={summaries[draggedCity.id]}
                            now={now}
                            selected={draggedCity.id === selectedCity.id}
                            canRemove={false}
                            onSelect={() => {}}
                            onRemove={() => {}}
                        />
                    </div>,
                    document.body
                )}
        </div>
    );
}
