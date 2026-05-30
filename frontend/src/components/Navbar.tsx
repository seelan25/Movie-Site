import Link from "next/link";
import { NavbarAuth } from "@/components/NavbarAuth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-cv-border bg-cv-elev/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-cv-text hover:opacity-90 sm:text-lg"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cv-accent text-sm font-black text-black">CV</span>
          <span className="text-cv-accent">Cine</span>Vision
        </Link>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-1 rounded-full border border-cv-border bg-cv-deep/70 p-1 text-xs sm:gap-2 sm:text-sm">
          <Link
            href="/search"
            className="rounded-full px-3 py-2 text-cv-muted transition hover:bg-cv-border hover:text-cv-text"
          >
            Search
          </Link>
          <NavbarAuth />
        </nav>
      </div>
    </header>
  );
}
