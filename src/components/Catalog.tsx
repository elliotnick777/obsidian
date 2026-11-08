import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search, Star, X } from "lucide-react";
import { operations } from "../core/registry";
import { categoryIcons } from "./Icons";
import type { Category } from "../core/types";
interface Props {
  onAdd: (id: string) => void;
  favorites: string[];
  onFavorite: (id: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}
export function Catalog({ onAdd, favorites, onFavorite, searchRef }: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const filtered = operations.filter(
    (o) =>
      (tab === "all" || favorites.includes(o.id)) &&
      `${o.name} ${o.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <aside className="catalog panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">TOOLBOX</span>
          <h2>
            Operations <span className="count">48</span>
          </h2>
        </div>
        <span className="subtle-icon">
          <ScanGlyph />
        </span>
      </div>
      <div className="catalog-search">
        <Search size={15} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search operations…"
          aria-label="Search operations"
        />
        {query ? (
          <button
            className="icon-btn small"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <X size={13} />
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </div>
      <div className="catalog-tabs">
        <button
          className={tab === "all" ? "selected" : ""}
          onClick={() => setTab("all")}
        >
          All operations
        </button>
        <button
          className={tab === "favorites" ? "selected" : ""}
          onClick={() => setTab("favorites")}
        >
          <Star size={12} /> Favorites <span>{favorites.length}</span>
        </button>
      </div>
      <div className="catalog-scroll">
        {(Object.keys(categoryIcons) as Category[]).map((category) => {
          const list = filtered.filter((o) => o.category === category);
          if (!list.length) return null;
          const Icon = categoryIcons[category];
          const closed = collapsed.includes(category) && !query;
          return (
            <section className="operation-group" key={category}>
              <button
                className="category-heading"
                onClick={() =>
                  setCollapsed((a) =>
                    a.includes(category)
                      ? a.filter((c) => c !== category)
                      : [...a, category],
                  )
                }
              >
                <Icon size={14} />
                <span>{category}</span>
                <span className="group-count">{list.length}</span>
                {closed ? (
                  <ChevronRight size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>
              {!closed &&
                list.map((o) => (
                  <div className="operation-row" key={o.id}>
                    <button
                      className="operation-add"
                      onClick={() => onAdd(o.id)}
                      title={o.description}
                    >
                      <span>{o.name}</span>
                      {o.warning && o.category === "Hashing" && (
                        <span className="legacy">legacy</span>
                      )}
                      <Plus size={13} />
                    </button>
                    <button
                      className={`favorite-btn ${favorites.includes(o.id) ? "is-favorite" : ""}`}
                      title={`${favorites.includes(o.id) ? "Remove from" : "Add to"} favorites`}
                      aria-label={`${favorites.includes(o.id) ? "Unfavorite" : "Favorite"} ${o.name}`}
                      onClick={() => onFavorite(o.id)}
                    >
                      <Star
                        size={12}
                        fill={
                          favorites.includes(o.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                    <div className="operation-description">{o.description}</div>
                  </div>
                ))}
            </section>
          );
        })}
        {!filtered.length && (
          <div className="empty-small">
            <Search size={22} />
            <p>
              {tab === "favorites" && !query
                ? "Star operations to keep them here."
                : "No matching operations."}
            </p>
          </div>
        )}
      </div>
      <div className="catalog-footer">
        <span className="status-dot" />
        48 operations. Endless possibilities.
      </div>
    </aside>
  );
}
function ScanGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 7V3h4m6 0h4v4M3 13v4h4m6 0h4v-4M7 7h6v6H7z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
