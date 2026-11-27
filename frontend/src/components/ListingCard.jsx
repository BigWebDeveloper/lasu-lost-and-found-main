import { ArrowRight, MapPin } from "lucide-react";
import { imageUrl } from "../api.js";
import { categoryIcon, formatDate } from "../utils/listing.js";

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

export default ListingCard;
