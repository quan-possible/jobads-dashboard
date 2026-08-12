"use client";

import { useAuth } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./explore.module.css";

/** Keeps the direct-access gate explanatory while giving verified sessions a
 * concise workspace frame. Explore remains absent from public navigation. */
export function ExploreHero() {
  const { authenticated } = useAuth();
  const { t } = useI18n();
  const copy = t.explore;

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.eyebrow}>{authenticated ? copy.teamEyebrow : copy.eyebrow}</div>
        <h1 className={styles.heroTitle}>{authenticated ? copy.teamHero : copy.hero}</h1>
        <p className={styles.heroLede}>{authenticated ? copy.teamLede : copy.lede}</p>
      </div>
    </section>
  );
}
