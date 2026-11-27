const API_BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((entry) => entry.msg).join(" ")
      : detail;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export function getListings(filters = {}, signal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return request(`/api/listings?${params}`, { signal });
}

export function uploadPhoto(file) {
  const data = new FormData();
  data.append("image", file);
  return request("/api/uploads", { method: "POST", body: data });
}

export function createListing(listing) {
  return request("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listing),
  });
}

export function resolveListing(id, token) {
  return request(`/api/listings/${id}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export function imageUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export function tokenKey(id) {
  return `campus-lost-found-token-${id}`;
}
