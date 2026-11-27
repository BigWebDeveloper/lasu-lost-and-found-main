import { useState } from "react";
import { AlertCircle, ArrowRight, Check, CheckCircle2, MapPin } from "lucide-react";
import { imageUrl, resolveListing, tokenKey } from "../api.js";
import { categoryIcon, contactHref, formatDate } from "../utils/listing.js";
import Dialog from "./Dialog.jsx";

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

export default DetailDialog;
