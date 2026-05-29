"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearStoredUser, getStoredUser, getStoredUserServer, subscribeAuthChange } from "@/lib/auth";

export function NavbarAuth() {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeAuthChange, getStoredUser, getStoredUserServer);

  function signOut() {
    clearStoredUser();
    router.push("/");
    router.refresh();
  }

  if (user) {
    const isAdmin = user.roles?.includes("ROLE_ADMIN");
    return (
      <>
        {isAdmin ? (
          <>
            <Link
              href="/admin"
              className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
            >
              Admin
            </Link>
            <Link
              href="/movies/import"
              className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
            >
              Import
            </Link>
          </>
        ) : (
          <Link
            href="/booking"
            className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
          >
            Booking
          </Link>
        )}
        <span className="hidden max-w-[120px] truncate rounded-full border border-cv-border px-2.5 py-2 text-xs text-cv-muted sm:inline md:max-w-[160px] md:text-sm">
          {user.fullName || user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/booking"
        className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
      >
        Booking
      </Link>
      <Link
        href="/auth/sign-in"
        className="rounded-full px-3 py-2 text-xs text-cv-muted hover:bg-cv-border hover:text-cv-text sm:text-sm"
      >
        Sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className="rounded-full bg-cv-accent px-3 py-2 text-xs font-semibold text-black hover:opacity-90 sm:px-4 sm:text-sm"
      >
        Sign up
      </Link>
    </>
  );
}
