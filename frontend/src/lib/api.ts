import { getApiBaseUrl } from "@/lib/env";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function unwrapApiPayload<T>(value: unknown): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // Support common Spring response wrappers:
    // { data: ... }, { result: ... }, { payload: ... }, { value: ... }
    for (const key of ["data", "result", "payload", "value"]) {
      if (key in obj) {
        return obj[key] as T;
      }
    }
  }
  return value as T;
}

export function authHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem("cv_user");
    if (!raw) return {};
    const user = JSON.parse(raw) as { token?: string };
    if (!user?.token) return {};
    return { Authorization: `Bearer ${user.token}` };
  } catch {
    return {};
  }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (typeof error.body === "string" && error.body.trim()) {
      return error.body;
    }
    if (error.body && typeof error.body === "object") {
      const body = error.body as Record<string, unknown>;
      const msg = body.message ?? body.error ?? body.detail;
      if (typeof msg === "string" && msg.trim()) {
        return msg;
      }
    }
    if (error.status === 401 || error.status === 403) {
      return "Invalid email or password.";
    }
    if (error.status >= 500) {
      return "Server error. Make sure the API gateway and services are running.";
    }
    return `${fallback} (${error.status})`;
  }
  if (error instanceof TypeError) {
    return "Cannot reach the API. Start Eureka, user-service, movie-service, and api-gateway on port 8080.";
  }
  return fallback;
}

export async function apiFetch<T = Json>(
  path: string,
  options: RequestInit & { json?: unknown; formData?: FormData; auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.auth !== false) {
    const auth = authHeaders();
    if (auth && typeof auth === "object" && !Array.isArray(auth)) {
      Object.entries(auth as Record<string, string>).forEach(([k, v]) =>
        headers.set(k, v)
      );
    }
  }

  let body = options.body;
  if (options.json !== undefined && options.formData !== undefined) {
    throw new Error("Use either json or formData, not both.");
  }
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  } else if (options.formData !== undefined) {
    body = options.formData;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      body,
      cache: "no-store",
    });
  } catch (cause) {
    throw cause;
  }

  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text().catch(() => "");

  let parsed: unknown = rawText;
  if (rawText.length > 0 && contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      `API ${res.status} for ${path}`,
      res.status,
      parsed ?? null
    );
  }

  if (!rawText) {
    return undefined as T;
  }

  return unwrapApiPayload<T>(parsed);
}
