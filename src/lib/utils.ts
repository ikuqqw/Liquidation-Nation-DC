import { clsx, type ClassValue } from "clsx";
import { STORAGE_BUCKET } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return usdFormatter.format(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toMoneyNumber(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeSalesBusinessDay(date = new Date()) {
  const nyParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const year = Number(nyParts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(nyParts.find((part) => part.type === "month")?.value ?? "1");
  const day = Number(nyParts.find((part) => part.type === "day")?.value ?? "1");
  const hour = Number(nyParts.find((part) => part.type === "hour")?.value ?? "0");

  const local = new Date(Date.UTC(year, month - 1, day));
  if (hour >= 22) {
    local.setUTCDate(local.getUTCDate() + 1);
  }

  const yyyy = local.getUTCFullYear();
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatBusinessDayLabel(value: string) {
  const [year, month, day] = value.split("-").map((chunk) => Number(chunk));
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}
