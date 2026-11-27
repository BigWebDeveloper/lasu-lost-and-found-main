import {
  BriefcaseBusiness,
  BookOpen,
  KeyRound,
  Laptop,
  PackageOpen,
  Shirt,
  Smartphone,
} from "lucide-react";

export function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("lasu-lost-found-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    return "light";
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function categoryIcon(category) {
  if (/electronic|phone|laptop/i.test(category)) return Laptop;
  if (/bag/i.test(category)) return BriefcaseBusiness;
  if (/clothing/i.test(category)) return Shirt;
  if (/book/i.test(category)) return BookOpen;
  if (/key/i.test(category)) return KeyRound;
  if (/id|card/i.test(category)) return Smartphone;
  return PackageOpen;
}

export function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function contactHref(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7) {
    return `tel:${value.replace(/[^+\d]/g, "")}`;
  }
  return null;
}
