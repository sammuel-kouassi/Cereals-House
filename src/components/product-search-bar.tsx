import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Clock, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Suggestion = { label: string; type: "product" | "category" };

type Props = {
  value: string;
  onChange: (v: string) => void;
  suggestions: Suggestion[];
};

const STORAGE_KEY = "ch_search_history";
const MAX_HISTORY = 6;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(list: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

export function ProductSearchBar({ value, onChange, suggestions }: Props) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commitTimer = useRef<number | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!focused) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [focused]);

  // Debounced history commit
  useEffect(() => {
    if (commitTimer.current) window.clearTimeout(commitTimer.current);
    const q = value.trim();
    if (q.length < 2) return;
    commitTimer.current = window.setTimeout(() => {
      setHistory((prev) => {
        const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    }, 900);
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current);
    };
  }, [value]);

  const filteredSuggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    return suggestions
      .filter((s) => {
        const k = s.label.toLowerCase();
        if (seen.has(k)) return false;
        if (!k.includes(q) || k === q) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 6);
  }, [value, suggestions]);

  const pick = (v: string) => {
    onChange(v);
    setFocused(false);
    inputRef.current?.blur();
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const showPanel = focused && (filteredSuggestions.length > 0 || history.length > 0);

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <div
        className={cn(
          "group flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-sm transition-all",
          focused
            ? "border-gold shadow-gold ring-2 ring-gold/20"
            : "border-border hover:border-gold/40",
        )}
      >
        <Search className={cn("h-4 w-4 shrink-0 transition-colors", focused ? "text-gold" : "text-muted-foreground")} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={t("products.searchPlaceholder")}
          aria-label={t("products.searchAria")}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label={t("products.searchClear")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl motion-safe:animate-[fade-in_0.15s_ease-out]">
          {filteredSuggestions.length > 0 && (
            <div className="px-2 py-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3 w-3 text-gold" /> {t("products.searchSuggestions")}
              </div>
              <ul>
                {filteredSuggestions.map((s) => (
                  <li key={s.type + s.label}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(s.label)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-secondary"
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="ml-3 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.type === "category" ? "•" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {history.length > 0 && (
            <div className={cn("px-2 py-2", filteredSuggestions.length > 0 && "border-t border-border")}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Clock className="h-3 w-3" /> {t("products.searchRecent")}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearHistory}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3" /> {t("products.searchClearHistory")}
                </button>
              </div>
              <ul className="flex flex-wrap gap-1.5 px-2 pb-1">
                {history.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(h)}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground/80 transition hover:border-gold/40 hover:text-gold"
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}