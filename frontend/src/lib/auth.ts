import type { LoginResponse } from "@/lib/types";

const STORAGE_KEY = "cv_user";
const AUTH_CHANGE_EVENT = "cv-auth-change";

let cachedRaw: string | null = null;
let cachedUser: LoginResponse | null = null;

export function getStoredUser(): LoginResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    cachedUser = raw ? (JSON.parse(raw) as LoginResponse) : null;
    return cachedUser;
  } catch {
    cachedRaw = null;
    cachedUser = null;
    return null;
  }
}

export function getStoredUserServer(): null {
  return null;
}

export function setStoredUser(user: LoginResponse): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  cachedRaw = null;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedUser = null;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAuthToken(): string | null {
  return getStoredUser()?.token ?? null;
}

export function isAdminUser(): boolean {
  const roles = getStoredUser()?.roles || [];
  return roles.includes("ROLE_ADMIN");
}

export function subscribeAuthChange(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onChange = () => callback();
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}
