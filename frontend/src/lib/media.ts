import { getPublicApiBaseUrl } from "@/lib/env";

export function resolveMediaUrl(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "/vercel.svg";
  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${getPublicApiBaseUrl()}${raw}`;
  return `${getPublicApiBaseUrl()}/${raw}`;
}
