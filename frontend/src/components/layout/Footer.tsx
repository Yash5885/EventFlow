export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="page-container flex flex-col gap-2 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>EventFlow</span>
        <span>Redis-locked checkout for reserved seating</span>
      </div>
    </footer>
  );
}

