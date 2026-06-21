"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <div className="eyebrow mb-2">Something went wrong</div>
        <h1 className="h-section mb-3">Explore couldn’t load</h1>
        <p className="mb-5 text-ink-soft">
          The data service may be unavailable. Confirm the API is running on port 8530, then try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="control border border-card-border px-4 py-2 text-[0.8rem] font-bold uppercase tracking-[0.02em] text-navy transition-colors hover:border-orange hover:text-orange"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
