export function Footer() {
  return (
    <footer className="border-t border-cv-border bg-cv-void">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-cv-text">
              <span className="text-cv-accent">Cine</span>Vision
            </p>
            <p className="mt-1 text-sm text-cv-muted">
              Suggestions, search, showtimes, and booking.
            </p>
          </div>
          <div className="text-sm text-cv-muted">
            <p>© {new Date().getFullYear()} CineVision. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

