import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Camera, ChevronDown, X } from "lucide-react";
import { createListing, tokenKey, uploadPhoto } from "../api.js";
import { categories, today } from "../data/constants.js";
import Dialog from "./Dialog.jsx";

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

export default CreateDialog;
