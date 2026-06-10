/** Shared loading skeleton rendered by each segment's loading.tsx (streaming). */
export function RouteLoading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24 flex items-center justify-center">
      <div
        className="h-8 w-8 rounded-full border-2 border-ink/20 border-t-ink animate-spin"
        role="status"
        aria-label="Уншиж байна"
      />
    </div>
  );
}
