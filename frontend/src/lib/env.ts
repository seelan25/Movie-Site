/** Gateway URL for server-side fetches (Next.js → Spring). */
const serverApiBase =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8080";

/** Public gateway URL used by browser for static media URLs. */
const publicApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://127.0.0.1:8080";

/**
 * Browser: empty string so requests hit `/api/...` and Next.js rewrites to the gateway.
 * Server: direct gateway URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return serverApiBase.replace(/\/$/, "");
}

export function getPublicApiBaseUrl(): string {
  return publicApiBase.replace(/\/$/, "");
}

export const env = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  get publicApiBaseUrl() {
    return getPublicApiBaseUrl();
  },
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
};
