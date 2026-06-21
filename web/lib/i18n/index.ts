// Pure dictionary composition — safe to import from both server and client
// (no next/headers here; that lives in ./server).

import { common } from "./dict/common";
import { filter } from "./dict/filter";
import { footer } from "./dict/footer";
import { nav } from "./dict/nav";
import { pages } from "./dict/pages";
import type { Locale } from "./locale";

export function getDictionary(locale: Locale) {
  return {
    common: common[locale],
    nav: nav[locale],
    filter: filter[locale],
    footer: footer[locale],
    explore: pages[locale].explore,
  };
}

export type Dict = ReturnType<typeof getDictionary>;

export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, isLocale } from "./locale";
export type { Locale } from "./locale";
