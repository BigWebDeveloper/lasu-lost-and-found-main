import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Moon,
  PackageOpen,
  Plus,
  Search,
  Sun,
  X,
} from "lucide-react";
import { getListings } from "./api.js";
import ListingCard from "./components/ListingCard.jsx";
import CreateDialog from "./components/CreateDialog.jsx";
import DetailDialog from "./components/DetailDialog.jsx";
import { categories, today } from "./data/constants.js";
import { getInitialTheme } from "./utils/listing.js";

export default function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    kind: "",
    category: "",
    location: "",
    date_from: "",
    date_to: "",
  });
  const [draft, setDraft] = useState(filters);
  const [announcement, setAnnouncement] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("lasu-lost-found-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getListings(filters, controller.signal)
      .then(setListings)
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters]);

  function applyFilters(event) {
    event.preventDefault();
    setFilters({ ...draft });
  }

  function clearFilters() {
    const cleared = {
      q: "",
      kind: "",
      category: "",
      location: "",
      date_from: "",
      date_to: "",
    };
    setDraft(cleared);
    setFilters(cleared);
  }

  function updateKind(kind) {
    const updated = { ...draft, kind };
    setDraft(updated);
    setFilters(updated);
  }

  function handleCreated(listing, tokenSaved) {
    setDialog(null);
    setFilters((current) => ({ ...current, kind: "" }));
    setDraft((current) => ({ ...current, kind: "" }));
    setAnnouncement(
      tokenSaved
        ? "Your listing is live. You can resolve it from this browser."
        : "Listing posted, but this browser could not save its private resolve key.",
    );
  }

  function handleResolved(updated) {
    setListings((current) => current.filter((item) => item.id !== updated.id));
    setDialog(null);
    setAnnouncement("Listing marked as resolved.");
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          aria-label="LASU Lost and Found home"
          className="brand"
          href="#top"
          onClick={clearFilters}
        >
          <img
            alt="Lagos State University seal"
            className="brand-logo"
            src="/lasu-logo.png"
          />
          <span className="brand-name">
            <strong>LASU Lost &amp; Found</strong>
            <small>Campus community board</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="live-indicator">
            <span />
            Lagos State University
          </span>
          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "dark"}
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            type="button"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            aria-label="Post a lost or found item"
            className="primary-button top-post"
            onClick={() => setDialog({ type: "create" })}
            title="Post an item"
            type="button"
          >
            <Plus size={17} />
            Post an item
          </button>
        </div>
      </header>

      <main id="top">
        <section className="intro-band">
          <div className="intro-copy">
            <p className="eyebrow">
              <span>LAGOS STATE UNIVERSITY · CAMPUS BOARD</span>
              <span className="eyebrow-line" />
            </p>
            <h1>
              Lost something?
              <br />
              <em>Found something?</em>
            </h1>
            <p className="intro-subtitle">
              A little help goes a long way. Find your things or help them find
              their way home.
            </p>
          </div>
          <div className="intro-aside">
            <div className="aside-graphic">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <PackageOpen size={35} strokeWidth={1.35} />
            </div>
            <span>
              GOOD THINGS
              <br />
              MAKE THEIR WAY BACK.
            </span>
            <ArrowRight size={17} />
          </div>
        </section>

        <section aria-label="Find a listing" className="browse-section">
          <div className="browse-heading">
            <div>
              <p className="eyebrow section-eyebrow">BROWSE THE BOARD</p>
              <h2>Out there, somewhere.</h2>
            </div>
            <span className="result-count">
              {loading
                ? "…"
                : `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`}
            </span>
          </div>

          <form className="filters" onSubmit={applyFilters}>
            <label className="search-box">
              <Search size={19} />
              <input
                aria-label="Search listings"
                onChange={(event) =>
                  setDraft({ ...draft, q: event.target.value })
                }
                placeholder="Search items, places, details…"
                value={draft.q}
              />
              <button
                aria-label="Search"
                className="search-submit"
                type="submit"
              >
                <ArrowRight size={18} />
              </button>
            </label>
            <div className="filter-fields">
              <label className="filter-control">
                <span>Category</span>
                <span className="select-wrap">
                  <select
                    onChange={(event) =>
                      setDraft({ ...draft, category: event.target.value })
                    }
                    value={draft.category}
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>
              <label className="filter-control">
                <span>Campus location</span>
                <input
                  onChange={(event) =>
                    setDraft({ ...draft, location: event.target.value })
                  }
                  placeholder="Any place"
                  value={draft.location}
                />
              </label>
              <label className="filter-control date-control">
                <span>From</span>
                <input
                  aria-label="From date"
                  max={draft.date_to || today}
                  onChange={(event) =>
                    setDraft({ ...draft, date_from: event.target.value })
                  }
                  type="date"
                  value={draft.date_from}
                />
              </label>
              <label className="filter-control date-control">
                <span>To</span>
                <input
                  aria-label="To date"
                  max={today}
                  min={draft.date_from || undefined}
                  onChange={(event) =>
                    setDraft({ ...draft, date_to: event.target.value })
                  }
                  type="date"
                  value={draft.date_to}
                />
              </label>
              <button className="filter-submit" type="submit">
                Apply filters
              </button>
            </div>
          </form>

          <div className="board-toolbar">
            <div
              aria-label="Filter by listing type"
              className="type-tabs"
              role="group"
            >
              {[
                ["", "Everything"],
                ["lost", "Lost"],
                ["found", "Found"],
              ].map(([kind, label]) => (
                <button
                  aria-pressed={filters.kind === kind}
                  className={filters.kind === kind ? "active" : ""}
                  key={kind || "all"}
                  onClick={() => updateKind(kind)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="toolbar-meta">
              {activeFilters > 0 && (
                <button
                  className="clear-button"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters <X size={14} />
                </button>
              )}
              <span>
                <Clock3 size={14} />
                Latest first
              </span>
            </div>
          </div>

          {error ? (
            <div className="state-panel error-state">
              <AlertCircle size={24} />
              <h3>Couldn’t load the board</h3>
              <p>{error}</p>
              <button
                className="secondary-button"
                onClick={() => setFilters({ ...filters })}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div aria-label="Loading listings" className="listing-grid">
              {[0, 1, 2, 3].map((item) => (
                <div className="skeleton-card" key={item}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : listings.length ? (
            <div className="listing-grid">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onOpen={() => setDialog({ type: "detail", listing })}
                />
              ))}
            </div>
          ) : (
            <div className="state-panel empty-state">
              <div className="empty-graphic">
                <PackageOpen size={31} strokeWidth={1.5} />
              </div>
              <p className="eyebrow">NOTHING HERE JUST YET</p>
              <h3>No matching items.</h3>
              <p>Try a different search or leave a note on the board.</p>
              <button
                className="secondary-button"
                onClick={() => setDialog({ type: "create" })}
                type="button"
              >
                Post a listing <Plus size={16} />
              </button>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span className="footer-brand">
            <img alt="" src="/lasu-logo.png" />
            <strong>LASU Lost &amp; Found</strong>
          </span>
          <span className="footer-copy">© 2026 Cipher</span>
          <span className="logo-credit">
            Seal:{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Lagos_State_University_logo.png"
              rel="noreferrer"
              target="_blank"
            >
              Dhantegge
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              rel="noreferrer"
              target="_blank"
            >
              CC BY-SA 4.0
            </a>
          </span>
        </footer>
      </main>
      <div aria-live="polite" className="visually-hidden">
        {announcement}
      </div>
      {announcement && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {announcement}
          <button
            aria-label="Dismiss message"
            onClick={() => setAnnouncement("")}
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {dialog?.type === "create" && (
        <CreateDialog
          key="create"
          onClose={() => setDialog(null)}
          onCreated={handleCreated}
        />
      )}
      {dialog?.type === "detail" && (
        <DetailDialog
          key={dialog.listing.id}
          listing={dialog.listing}
          onClose={() => setDialog(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}
