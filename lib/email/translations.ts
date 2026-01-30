/**
 * Email translations helper
 *
 * Loads translations for email templates based on locale.
 * This is separate from next-intl as emails are rendered outside of Next.js context.
 */

import enEmails from "@/messages/en/emails.json";
import esEmails from "@/messages/es/emails.json";

export type SupportedLocale = "es" | "en";

export type EmailTranslations = typeof esEmails;

const translations: Record<SupportedLocale, EmailTranslations> = {
	es: esEmails,
	en: enEmails,
};

/**
 * Get email translations for a specific locale
 */
export function getEmailTranslations(locale: string): EmailTranslations {
	const supportedLocale = isSupportedLocale(locale) ? locale : "es";
	return translations[supportedLocale];
}

/**
 * Check if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return locale === "es" || locale === "en";
}

/**
 * Interpolate variables in a translation string
 * Replaces {variable} with the corresponding value from params
 */
export function interpolate(
	template: string,
	params: Record<string, string | number>,
): string {
	return template.replace(/{(\w+)}/g, (_, key) => {
		const value = params[key];
		return value !== undefined ? String(value) : `{${key}}`;
	});
}

/**
 * Get a nested translation value by path
 * Example: getNestedValue(translations, "verifyEmail.subject") returns the subject string
 */
export function getNestedValue(
	obj: Record<string, unknown>,
	path: string,
): string {
	const keys = path.split(".");
	let current: unknown = obj;

	for (const key of keys) {
		if (current && typeof current === "object" && key in current) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return path; // Return the path if not found
		}
	}

	return typeof current === "string" ? current : path;
}

/**
 * Create a translation function for a specific locale and namespace
 */
export function createTranslator(locale: string, namespace?: string) {
	const t = getEmailTranslations(locale);

	return (key: string, params?: Record<string, string | number>): string => {
		const fullPath = namespace ? `${namespace}.${key}` : key;
		const value = getNestedValue(
			t as unknown as Record<string, unknown>,
			fullPath,
		);
		return params ? interpolate(value, params) : value;
	};
}
