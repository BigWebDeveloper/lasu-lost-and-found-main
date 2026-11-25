import hashlib
import os
import secrets
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Listing
from .schemas import ListingCreate, ListingCreated, ListingPublic, ResolveRequest


UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_SIZE = 5 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Campus Lost & Found API", version="1.0.0", lifespan=lifespan)
origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/listings", response_model=list[ListingPublic])
def list_listings(
    db: Annotated[Session, Depends(get_db)],
    q: str | None = None,
    kind: Literal["lost", "found"] | None = None,
    category: str | None = None,
    location: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    listing_status: Annotated[Literal["active", "resolved", "all"], Query(alias="status")] = "active",
):
    query = select(Listing)
    if listing_status != "all":
        query = query.where(Listing.resolved == (listing_status == "resolved"))
    if q:
        term = f"%{q.strip()}%"
        query = query.where(
            Listing.title.ilike(term)
            | Listing.description.ilike(term)
            | Listing.location.ilike(term)
            | Listing.category.ilike(term)
        )
    if kind:
        query = query.where(Listing.kind == kind)
    if category:
        query = query.where(Listing.category == category)
    if location:
        query = query.where(Listing.location.ilike(f"%{location.strip()}%"))
    if date_from:
        query = query.where(Listing.event_date >= date_from)
    if date_to:
        query = query.where(Listing.event_date <= date_to)
    query = query.order_by(Listing.created_at.desc(), Listing.id.desc()).limit(100)
    return db.scalars(query).all()


@app.get("/api/listings/{listing_id}", response_model=ListingPublic)
def get_listing(listing_id: int, db: Annotated[Session, Depends(get_db)]):
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@app.post("/api/listings", response_model=ListingCreated, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreate, db: Annotated[Session, Depends(get_db)]):
    token = secrets.token_urlsafe(32)
    listing = Listing(**payload.model_dump(), resolve_token_hash=token_digest(token))
    db.add(listing)
    db.commit()
    db.refresh(listing)
    public_listing = ListingPublic.model_validate(listing)
    return ListingCreated(**public_listing.model_dump(), resolve_token=token)


@app.patch("/api/listings/{listing_id}/resolve", response_model=ListingPublic)
def resolve_listing(
    listing_id: int,
    payload: ResolveRequest,
    db: Annotated[Session, Depends(get_db)],
):
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not secrets.compare_digest(listing.resolve_token_hash, token_digest(payload.token)):
        raise HTTPException(status_code=403, detail="Resolve token is not valid for this listing")
    listing.resolved = True
    db.commit()
    db.refresh(listing)
    return listing


@app.post("/api/uploads", status_code=status.HTTP_201_CREATED)
async def upload_photo(image: Annotated[UploadFile, File()]):
    extension = IMAGE_TYPES.get(image.content_type or "")
    if extension is None:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WebP image")
    content = await image.read(MAX_IMAGE_SIZE + 1)
    if not content or len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Images must be smaller than 5 MB")
    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"photo_url": f"/uploads/{filename}"}