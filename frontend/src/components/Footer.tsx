export function Footer() {
  return (
    <footer className="border-t border-cv-border bg-cv-elev/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="cv-panel-soft flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 font-semibold text-cv-text">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cv-accent text-xs font-black text-black">
                CV
              </span>
              <span>
                <span className="text-cv-accent">Cine</span>Vision
              </span>
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

