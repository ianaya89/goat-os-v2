export const locales = ["es", "en"] as const;
export const defaultLocale = "es" as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
