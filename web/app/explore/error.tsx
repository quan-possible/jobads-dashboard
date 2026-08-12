"use client";

import { ErrorCard } from "@/components/ErrorCard";
import styles from "@/components/explore/explore.module.css";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.exploreError}><ErrorCard reset={reset} title="explore" body="service" /></div>;
}
