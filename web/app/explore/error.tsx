"use client";

import { ErrorCard } from "@/components/ErrorCard";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorCard reset={reset} title="explore" body="service" />;
}
