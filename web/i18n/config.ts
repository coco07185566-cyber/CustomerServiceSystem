export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en-US"
export const LOCALE_STORAGE_KEY = "cs_ai_agent_locale"
const LOCALE_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60 // 1 year

const LOCALE_ALIASES: Record<string, AppLocale> = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  zh_cn: "zh-CN",
  "zh-hans": "zh-CN",
  en: "en-US",
  "en-us": "en-US",
  en_us: "en-US",
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return normalizeSupportedLocale(value) ?? DEFAULT_LOCALE
}

function normalizeSupportedLocale(
  value: string | null | undefined
): AppLocale | null {
  if (!value) {
    return null
  }
  const key = value.trim().toLowerCase()
  return LOCALE_ALIASES[key] ?? null
}

export function isSupportedLocale(
  value: string | null | undefined
): value is AppLocale {
  if (!value) {
    return false
  }
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function resolveBrowserLocale({
  storedLocale,
  navigatorLanguages,
}: {
  storedLocale?: string | null
  navigatorLanguages?: readonly string[] | null
}): AppLocale {
  if (isSupportedLocale(storedLocale)) {
    return storedLocale
  }

  for (const locale of navigatorLanguages ?? []) {
    const normalized = normalizeSupportedLocale(locale)
    if (normalized) {
      return normalized
    }
  }

  return DEFAULT_LOCALE
}

/** Detect locale from Accept-Language header on the server. */
export function detectServerLocale(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE
  }

  // Parse Accept-Language: "zh-CN,zh;q=0.9,en;q=0.8"
  const parsed = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q = "1"] = part.trim().split(";q=")
      return { lang: lang.trim(), q: parseFloat(q) || 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of parsed) {
    const normalized = normalizeSupportedLocale(lang)
    if (normalized) {
      return normalized
    }
  }

  return DEFAULT_LOCALE
}

/** Detect initial locale from a cookie value (set by the client on locale switch). */
export function detectCookieLocale(cookieValue: string | null): AppLocale | null {
  if (!cookieValue) {
    return null
  }
  return normalizeSupportedLocale(decodeURIComponent(cookieValue))
}

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE
  }
  return resolveBrowserLocale({
    storedLocale: window.localStorage.getItem(LOCALE_STORAGE_KEY),
    navigatorLanguages: window.navigator.languages,
  })
}

export function writeStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  // Also persist as a cookie so SSR can read it on subsequent requests
  document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(locale)};max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS};path=/;SameSite=Lax`
}
