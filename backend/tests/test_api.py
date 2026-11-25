from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        with testing_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def listing_payload(**overrides):
    return {
        "title": "Blue water bottle",
        "description": "Found near the science library entrance.",
        "kind": "found",
        "category": "Drinkware",
        "location": "Science Library",
        "event_date": "2026-11-15",
        "contact": "student@example.edu",
        **overrides,
    }


def test_create_search_and_resolve_listing(client: TestClient):
    response = client.post("/api/listings", json=listing_payload())
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == "Blue water bottle"
    assert created["resolve_token"]
    assert "resolve_token" not in client.get("/api/listings").json()[0]

    matches = client.get("/api/listings", params={"q": "science", "kind": "found"})
    assert [item["id"] for item in matches.json()] == [created["id"]]
    assert client.get("/api/listings", params={"q": "not present"}).json() == []

    wrong_token = client.patch(
        f"/api/listings/{created['id']}/resolve", json={"token": "x" * 32}
    )
    assert wrong_token.status_code == 403
    resolved = client.patch(
        f"/api/listings/{created['id']}/resolve",
        json={"token": created["resolve_token"]},
    )
    assert resolved.status_code == 200
    assert resolved.json()["resolved"] is True
    assert client.get("/api/listings").json() == []
    assert len(client.get("/api/listings", params={"status": "resolved"}).json()) == 1


def test_rejects_invalid_listing(client: TestClient):
    response = client.post("/api/listings", json=listing_payload(title="x"))
    assert response.status_code == 422


def test_health_endpoint(client: TestClient):
    assert client.get("/api/health").json() == {"status": "ok"}