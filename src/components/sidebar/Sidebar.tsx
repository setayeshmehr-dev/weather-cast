"use client";

import { MagnifyingGlass, SidebarSimple, XCircle } from "@phosphor-icons/react";
import { useState } from "react";
import type { KeyboardEvent } from "react";

import CityCard from "@/components/sidebar/CityCard";
import { useCitySearch } from"@/hooks/useCitySearch";
import { useCitySummaries } from "@/hooks/useCitySummaries";
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

// The part that matches what was typed is brighter, like in Apple Weather.
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
    onClose: () => void;
};

export default function Sidebar({
    cities,
    selectedCity,
    query,
    onQueryChange,
    onSelectCity,
    onRemoveCity,
    onClose,
}: SidebarProps) {
    const [focused, setFocused] = useState(false);

    const summaries = useCitySummaries(cities);
    const now = useNow();
    const search = useCitySearch(query);

    const trimmed = query.trim();
    const searching = focused || query !== "";

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            onQueryChange("");
            event.currentTarget.blur();
        }

        if (event.key === "Enter" && search.results.length > 0) {
            onSelectCity(search.results[0]);
        }
    };

    const renderContent = () => {
        if (!searching) {
            return (
                <ul className="flex flex-col gap-2">
                    {cities.map((city) => (
                        <li key={city.id}>
                            <CityCard
                                city={city}
                                summary={summaries[city.id]}
                                now={now}
                                selected={city.id === selectedCity.id}
                                canRemove={cities.length > 1}
                                onSelect={() => onSelectCity(city)}
                                onRemove={() => onRemoveCity(city.id)}
                            />
                        </li>
                    ))}
                </ul>
            );
        }

        if (trimmed.length < 2) {
            return <Message text="Type at least two letters to search for a city." />;
        }

        if (search.loading) {
            return <p className="px-2 py-3 text-sm text-white/60">Searching…</p>;
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
                            className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
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

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-white backdrop-blur-xl">
            <div className="flex h-11 shrink-0 items-center justify-end px-2">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Hide sidebar"
                    className="flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                >
                    <SidebarSimple size={20} />
                </button>
            </div>

            <div className="shrink-0 px-2 pb-2">
                <div className="flex h-9 items-center gap-2 rounded-xl bg-black/30 px-3 text-sm focus-within:ring-2 focus-within:ring-blue-500/80">
                    <MagnifyingGlass size={16} className="shrink-0 text-white/60" />

                    <input
                        type="text"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
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
                            // Keeps the focus in the input while clearing it.
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

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {renderContent()}
            </div>
        </div>
    );
}
