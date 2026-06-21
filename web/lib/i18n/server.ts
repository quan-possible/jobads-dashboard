// Server-only locale resolution. Reads the locale cookie. Pages call
// `const locale = await getLocale()` then `getDictionary(locale)`.

import { cookies } from "next/headers";
import { getDictionary } from "./index";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getServerDict() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
