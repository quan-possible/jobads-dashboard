"use client";

import { useEffect, useRef, useState } from "react";
import { AuthError, fetchPosting } from "@/lib/explore";
import { fmtMonth, fmtWage } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locale";
import type { PostingDetail } from "@/lib/types";
import styles from "./explore.module.css";
import { useExploreLock } from "./lockContext";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  return <div className={styles.detailField}><dt className={styles.detailLabel}>{label}</dt><dd className={styles.detailValue}>{value}</dd></div>;
}

function wageLine(detail: PostingDetail, locale: Locale, perHour: string): string | null {
  if (detail.wage_hourly != null) return `${fmtWage(detail.wage_hourly, locale)}${perHour}`;
  if (detail.wage_min != null || detail.wage_max != null) {
    const low = detail.wage_min != null ? fmtWage(detail.wage_min, locale) : "—";
    const high = detail.wage_max != null ? fmtWage(detail.wage_max, locale) : "—";
    return `${low} – ${high}${detail.wage_unit ? ` ${detail.wage_unit}` : ""}`;
  }
  return null;
}

const DETAIL_VALUES_FR: Record<string, string> = {
  "full-time": "temps plein",
  "part-time": "temps partiel",
  "full-time or part-time": "temps plein ou partiel",
  "Unknown": "Inconnu",
  "Not reported": "Non indiqué",
  "Hybrid": "Hybride",
  "Remote": "Télétravail",
  "On-site / unspecified": "Sur place / non précisé",
  "Permanent": "Permanent",
  "Temporary": "Temporaire",
  "experience required": "expérience requise",
  "no experience required": "aucune expérience requise",
  "College Diploma or Certification": "Diplôme collégial ou certificat",
  "High School Completion": "Études secondaires",
  "Undergraduate Degree (Bachelors)": "Baccalauréat",
  "No Education Required": "Aucun diplôme requis",
  "Graduate Degree - Masters": "Maîtrise",
  "Post-Graduate Degree - Doctorate": "Doctorat",
  "en": "Anglais",
  "fr": "Français",
};

function detailValue(value: string | null, locale: Locale): string | null {
  return value && locale === "fr" ? DETAIL_VALUES_FR[value] ?? value : value;
}

export function PostingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t, locale } = useI18n();
  const lock = useExploreLock();
  const lockRef = useRef(lock);
  const [detail, setDetail] = useState<PostingDetail | null>(null);
  const [shownId, setShownId] = useState(id);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  if (id !== shownId) {
    setShownId(id);
    setDetail(null);
    setError(null);
  }

  useEffect(() => {
    onCloseRef.current = onClose;
    lockRef.current = lock;
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchPosting(id)
      .then((next) => { if (!cancelled) setDetail(next); })
      .catch((reason) => {
        if (cancelled) return;
        if (reason instanceof AuthError) {
          onCloseRef.current();
          lockRef.current();
          return;
        }
        setError(t.explore.loadingPostingError);
      });
    return () => { cancelled = true; };
  }, [id, t.explore.loadingPostingError]);

  useEffect(() => {
    if (!id) return;
    const panel = panelRef.current;
    const previousFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const focusables = () => panel
      ? Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null)
      : [];

    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocused?.focus?.();
    };
  }, [id]);

  if (!id) return null;

  const loading = shownId === id && !detail && !error;
  const wage = detail ? wageLine(detail, locale, t.explore.perHour) : null;

  return (
    <div className={styles.drawerBackdrop} role="dialog" aria-modal="true" aria-labelledby="posting-drawer-title">
      <button type="button" aria-label={t.common.close} tabIndex={-1} onClick={onClose} className="absolute inset-0" />
      <aside ref={panelRef} tabIndex={-1} className={styles.drawerPanel}>
        <span aria-hidden className={styles.drawerSeam} />
        <div className={styles.drawerHeader}>
          <div className="min-w-0">
            <div className={styles.drawerEyebrow}>{t.explore.drawerPosting}{detail ? ` · ${detail.posting_id}` : ""}</div>
            <h2 id="posting-drawer-title" className={styles.drawerTitle}>{detail?.job_title ?? (loading ? t.common.loading : t.explore.drawerPosting)}</h2>
            {detail?.employer && <p className={styles.drawerEmployer}>{detail.employer}</p>}
          </div>
          <button type="button" data-autofocus onClick={onClose} aria-label={t.common.close} className={styles.drawerClose}>×</button>
        </div>

        <div className={styles.drawerBody}>
          {loading && <div className={styles.drawerState}>{t.explore.loadingPosting}</div>}
          {error && <div className={`${styles.drawerState} ${styles.drawerStateError}`}>{error}</div>}
          {detail && (
            <div className={styles.drawerContent}>
              <div className={styles.chipList}>
                {detail.noc_code && <span className={styles.chip}>{t.explore.nocChip} {detail.noc_code}</span>}
                {detail.province && <span className={styles.chip}>{detail.province}{detail.market ? ` · ${detail.market}` : ""}</span>}
                {detail.employment_type && <span className={styles.chip}>{detailValue(detail.employment_type, locale)}</span>}
                {detail.remote_class && detail.remote_class !== "Not reported" && <span className={styles.chip}>{detailValue(detail.remote_class, locale)}</span>}
                {wage && <span className={`${styles.chip} ${styles.chipAccent}`}>{wage}</span>}
              </div>

              <dl className={styles.detailGrid}>
                <Field label={t.explore.fPosted} value={detail.date_found ? fmtMonth(detail.date_found, locale) : null} />
                <Field label={t.explore.fRefMonth} value={fmtMonth(detail.month, locale)} />
                <Field label={t.explore.fWage} value={wage} />
                <Field label={t.explore.fEmployment} value={detailValue(detail.employment_type, locale)} />
                <Field label={t.explore.fDuration} value={detailValue(detail.duration, locale)} />
                <Field label={t.explore.fExperience} value={detailValue(detail.experience, locale)} />
                <Field label={t.explore.fEducation} value={detailValue(detail.education, locale)} />
                <Field label={t.explore.fLanguage} value={detailValue(detail.primary_posting_language, locale)} />
                <Field label={t.explore.fOccupation} value={detail.noc_label} />
                <Field label={t.explore.fIndustry} value={detail.naics_label} />
              </dl>

              <div className={styles.description}>
                <div className={styles.descriptionHeading}>{t.explore.descHeading}</div>
                {detail.description_full ? <p className={styles.descriptionText}>{detail.description_full}</p> : <p className={styles.descriptionNote}>{t.explore.noDesc}</p>}
                {detail.description_full && <p className={styles.descriptionNote}>{t.explore.descNote}</p>}
              </div>
              {detail.data_source && <p className={styles.drawerSource}>{t.explore.source} · <strong>{detail.data_source}</strong></p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
