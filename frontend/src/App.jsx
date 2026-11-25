import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  KeyRound,
  Laptop,
  MapPin,
  Moon,
  PackageOpen,
  Plus,
  Search,
  Shirt,
  Smartphone,
  Sun,
  X,
} from "lucide-react";
import { createListing, getListings, imageUrl, resolveListing, tokenKey, uploadPhoto } from "./api.js";

const categories = ["Electronics", "Bags", "Clothing", "Books", "Keys", "Drinkware", "ID & Cards", "Other"];
const today = new Date().toLocaleDateString("en-CA");

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("lasu-lost-found-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    return "light";
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function categoryIcon(category) {
  if (/electronic|phone|laptop/i.test(category)) return Laptop;
  if (/bag/i.test(category)) return BriefcaseBusiness;
  if (/clothing/i.test(category)) return Shirt;
  if (/book/i.test(category)) return BookOpen;
  if (/key/i.test(category)) return KeyRound;
  if (/id|card/i.test(category)) return Smartphone;
  return PackageOpen;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function contactHref(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7) {
    return `tel:${value.replace(/[^+\d]/g, "")}`;
  }
  return null;
}

function ListingCard({ listing, onOpen }) {
  const Icon = categoryIcon(listing.category);
  return (
    <button className="listing-card" onClick={onOpen} type="button">
      <div className={`listing-art ${listing.photo_url ? "has-photo" : ""}`}>
        {listing.photo_url ? (
          <img alt="" loading="lazy" src={imageUrl(listing.photo_url)} />
        ) : (
          <>
            <div className="art-stamp"><Icon size={28} strokeWidth={1.5} /></div>
            <span className="art-word">{listing.kind === "found" ? "FOUND" : "MISSING"}</span>
            <span className="art-index">CAMPUS / {String(listing.id).padStart(3, "0")}</span>
          </>
        )}
        <span className={`kind-chip ${listing.kind}`}>
          <span />{listing.kind === "found" ? "Found" : "Lost"}
        </span>
        <span className="date-chip">{formatDate(listing.event_date)}</span>
      </div>
      <div className="listing-copy">
        <div className="listing-heading">
          <span className="item-category">{listing.category}</span>
          <ArrowRight className="card-arrow" size={17} />
        </div>
        <h3>{listing.title}</h3>
        <p className="listing-location"><MapPin size={14} />{listing.location}</p>
      </div>
    </button>
  );
}

function Dialog({ title, onClose, children, className = "" }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("dialog-open");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("dialog-open");
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-label={title} aria-modal="true" className={`dialog ${className}`} role="dialog">
        <header className="dialog-header">
          <span>{title}</span>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function CreateDialog({ onClose, onCreated }) {
  const [kind, setKind] = useState("lost");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      let photoUrl = null;
      if (file) {
        const uploaded = await uploadPhoto(file);
        photoUrl = uploaded.photo_url;
      }
      const listing = await createListing({
        title: form.get("title").trim(),
        description: form.get("description").trim(),
        kind,
        category: form.get("category"),
        location: form.get("location").trim(),
        event_date: form.get("event_date"),
        contact: form.get("contact").trim(),
        photo_url: photoUrl,
      });
      let tokenSaved = true;
      try {
        localStorage.setItem(tokenKey(listing.id), listing.resolve_token);
      } catch {
        tokenSaved = false;
      }
      onCreated(listing, tokenSaved);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog className="create-dialog" onClose={onClose} title="Add a listing">
      <form className="listing-form" onSubmit={submit}>
        <p className="form-intro">A few details help the right person find it.</p>
        <div aria-label="Listing type" className="kind-toggle" role="group">
          <button className={kind === "lost" ? "selected" : ""} onClick={() => setKind("lost")} type="button">I lost something</button>
          <button className={kind === "found" ? "selected" : ""} onClick={() => setKind("found")} type="button">I found something</button>
        </div>
        <label className="field-label">Item name
          <input autoFocus maxLength="100" minLength="3" name="title" placeholder="e.g. Blue water bottle" required />
        </label>
        <div className="form-row">
          <label className="field-label">Category
            <span className="select-wrap"><select defaultValue="" name="category" required>
              <option disabled value="">Choose one</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select><ChevronDown size={16} /></span>
          </label>
          <label className="field-label">Date
            <input defaultValue={today} max={today} name="event_date" required type="date" />
          </label>
        </div>
        <label className="field-label">Where on campus?
          <input maxLength="100" minLength="2" name="location" placeholder="Building, room, or nearby spot" required />
        </label>
        <label className="field-label">Description
          <textarea maxLength="2000" minLength="10" name="description" placeholder="Color, brand, or anything that helps identify it" required rows="3" />
        </label>
        <label className="field-label">How can someone reach you?
          <input autoComplete="email" maxLength="254" minLength="3" name="contact" placeholder="Email or phone number" required />
        </label>
        <label className={`photo-picker ${preview ? "photo-selected" : ""}`}>
          {preview ? <img alt="Selected item" src={preview} /> : <Camera size={19} />}
          <span>{file ? file.name : "Add a photo"}<small>JPG, PNG, or WebP · up to 5 MB</small></span>
          {file && <button aria-label="Remove photo" className="photo-remove" onClick={(event) => { event.preventDefault(); setFile(null); }} type="button"><X size={16} /></button>}
          <input accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
        </label>
        {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
        <div className="form-footer">
          <span>Your contact details will be visible on the listing.</span>
          <button className="primary-button" disabled={busy} type="submit">{busy ? "Posting…" : "Post listing"}<ArrowRight size={17} /></button>
        </div>
      </form>
    </Dialog>
  );
}

function DetailDialog({ listing, onClose, onResolved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem(tokenKey(listing.id));
  const contactLink = contactHref(listing.contact);
  const Icon = categoryIcon(listing.category);

  async function markResolved() {
    setBusy(true);
    setError("");
    try {
      const updated = await resolveListing(listing.id, token);
      onResolved(updated);
    } catch (resolveError) {
      setError(resolveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog className="detail-dialog" onClose={onClose} title="Listing details">
      <div className="detail-art">
        {listing.photo_url ? <img alt="" src={imageUrl(listing.photo_url)} /> : <div className="detail-placeholder"><Icon size={48} strokeWidth={1.35} /><span>{listing.kind === "found" ? "Found on campus" : "Last seen on campus"}</span></div>}
        <span className={`kind-chip ${listing.kind}`}><span />{listing.kind === "found" ? "Found" : "Lost"}</span>
      </div>
      <div className="detail-content">
        <div className="detail-kicker">{listing.category} <span>·</span> {formatDate(listing.event_date)}</div>
        <h2>{listing.title}</h2>
        <p className="detail-location"><MapPin size={16} />{listing.location}</p>
        <p className="detail-description">{listing.description}</p>
        <div className="contact-row">
          <div className="contact-mark"><span>{listing.contact.trim().charAt(0).toUpperCase()}</span></div>
          <div className="contact-copy"><small>CONTACT THE POSTER</small><span>{listing.contact}</span></div>
          {contactLink && <a className="contact-action" href={contactLink}>Contact <ArrowRight size={15} /></a>}
        </div>
        {listing.resolved ? (
          <div className="resolved-note"><CheckCircle2 size={17} />This listing has been resolved</div>
        ) : token ? (
          <button className="resolve-button" disabled={busy} onClick={markResolved} type="button"><Check size={17} />{busy ? "Updating…" : "Mark as resolved"}</button>
        ) : null}
        {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
      </div>
    </Dialog>
  );
}

export default function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ q: "", kind: "", category: "", location: "", date_from: "", date_to: "" });
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
    const cleared = { q: "", kind: "", category: "", location: "", date_from: "", date_to: "" };
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
    setAnnouncement(tokenSaved ? "Your listing is live. You can resolve it from this browser." : "Listing posted, but this browser could not save its private resolve key.");
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
        <a aria-label="LASU Lost and Found home" className="brand" href="#top" onClick={clearFilters}>
          <img alt="Lagos State University seal" className="brand-logo" src="/lasu-logo.png" />
          <span className="brand-name"><strong>LASU Lost &amp; Found</strong><small>Campus community board</small></span>
        </a>
        <div className="topbar-right">
          <span className="live-indicator"><span />Lagos State University</span>
          <button aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} aria-pressed={theme === "dark"} className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} type="button">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}<span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button aria-label="Post a lost or found item" className="primary-button top-post" onClick={() => setDialog({ type: "create" })} title="Post an item" type="button"><Plus size={17} />Post an item</button>
        </div>
      </header>

      <main id="top">
        <section className="intro-band">
          <div className="intro-copy">
            <p className="eyebrow"><span>LAGOS STATE UNIVERSITY · CAMPUS BOARD</span><span className="eyebrow-line" /></p>
            <h1>Lost something?<br /><em>Found something?</em></h1>
            <p className="intro-subtitle">A little help goes a long way. Find your things or help them find their way home.</p>
          </div>
          <div className="intro-aside">
            <div className="aside-graphic"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><PackageOpen size={35} strokeWidth={1.35} /></div>
            <span>GOOD THINGS<br />MAKE THEIR WAY BACK.</span>
            <ArrowRight size={17} />
          </div>
        </section>

        <section aria-label="Find a listing" className="browse-section">
          <div className="browse-heading">
            <div><p className="eyebrow section-eyebrow">BROWSE THE BOARD</p><h2>Out there, somewhere.</h2></div>
            <span className="result-count">{loading ? "…" : `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`}</span>
          </div>

          <form className="filters" onSubmit={applyFilters}>
            <label className="search-box"><Search size={19} /><input aria-label="Search listings" onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="Search items, places, details…" value={draft.q} /><button aria-label="Search" className="search-submit" type="submit"><ArrowRight size={18} /></button></label>
            <div className="filter-fields">
              <label className="filter-control"><span>Category</span><span className="select-wrap"><select onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={15} /></span></label>
              <label className="filter-control"><span>Campus location</span><input onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Any place" value={draft.location} /></label>
              <label className="filter-control date-control"><span>From</span><input aria-label="From date" max={draft.date_to || today} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} type="date" value={draft.date_from} /></label>
              <label className="filter-control date-control"><span>To</span><input aria-label="To date" max={today} min={draft.date_from || undefined} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} type="date" value={draft.date_to} /></label>
              <button className="filter-submit" type="submit">Apply filters</button>
            </div>
          </form>

          <div className="board-toolbar">
            <div aria-label="Filter by listing type" className="type-tabs" role="group">
              {[ ["", "Everything"], ["lost", "Lost"], ["found", "Found"] ].map(([kind, label]) => (
                <button aria-pressed={filters.kind === kind} className={filters.kind === kind ? "active" : ""} key={kind || "all"} onClick={() => updateKind(kind)} type="button">{label}</button>
              ))}
            </div>
            <div className="toolbar-meta">
              {activeFilters > 0 && <button className="clear-button" onClick={clearFilters} type="button">Clear filters <X size={14} /></button>}
              <span><Clock3 size={14} />Latest first</span>
            </div>
          </div>

          {error ? (
            <div className="state-panel error-state"><AlertCircle size={24} /><h3>Couldn’t load the board</h3><p>{error}</p><button className="secondary-button" onClick={() => setFilters({ ...filters })} type="button">Try again</button></div>
          ) : loading ? (
            <div aria-label="Loading listings" className="listing-grid">{[0, 1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div /><span /><span /></div>)}</div>
          ) : listings.length ? (
            <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} onOpen={() => setDialog({ type: "detail", listing })} />)}</div>
          ) : (
            <div className="state-panel empty-state"><div className="empty-graphic"><PackageOpen size={31} strokeWidth={1.5} /></div><p className="eyebrow">NOTHING HERE JUST YET</p><h3>No matching items.</h3><p>Try a different search or leave a note on the board.</p><button className="secondary-button" onClick={() => setDialog({ type: "create" })} type="button">Post a listing <Plus size={16} /></button></div>
          )}
        </section>

        <footer className="page-footer">
          <span className="footer-brand"><img alt="" src="/lasu-logo.png" /><strong>LASU Lost &amp; Found</strong></span>
          <span className="footer-copy">© 2026 Cipher</span>
          <span className="logo-credit">Seal: <a href="https://commons.wikimedia.org/wiki/File:Lagos_State_University_logo.png" rel="noreferrer" target="_blank">Dhantegge</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noreferrer" target="_blank">CC BY-SA 4.0</a></span>
        </footer>
      </main>
      <div aria-live="polite" className="visually-hidden">{announcement}</div>
      {announcement && <div className="toast"><CheckCircle2 size={17} />{announcement}<button aria-label="Dismiss message" onClick={() => setAnnouncement("")} type="button"><X size={15} /></button></div>}
      {dialog?.type === "create" && <CreateDialog key="create" onClose={() => setDialog(null)} onCreated={handleCreated} />}
      {dialog?.type === "detail" && <DetailDialog key={dialog.listing.id} listing={dialog.listing} onClose={() => setDialog(null)} onResolved={handleResolved} />}
    </div>
  );
}