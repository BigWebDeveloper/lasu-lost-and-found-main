from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    kind: Literal["lost", "found"]
    category: str = Field(min_length=2, max_length=40)
    location: str = Field(min_length=2, max_length=100)
    event_date: date
    photo_url: str | None = Field(default=None, max_length=255)
    contact: str = Field(min_length=3, max_length=254)


class ListingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    kind: str
    category: str
    location: str
    event_date: date
    photo_url: str | None
    contact: str
    resolved: bool
    created_at: datetime


class ListingCreated(ListingPublic):
    resolve_token: str


class ResolveRequest(BaseModel):
    token: str = Field(min_length=20, max_length=100)