import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
	defaultLocale,
	LOCALE_COOKIE_NAME,
	type Locale,
	locales,
} from "./lib/i18n/config";

// Re-export for backwards compatibility
export { LOCALE_COOKIE_NAME, defaultLocale, locales, type Locale };

export default getRequestConfig(async () => {
	// Get cookies using next/headers (only works in server components/actions)
	let locale: Locale = defaultLocale;

	try {
		const cookieStore = await cookies();
		const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);

		if (localeCookie?.value && locales.includes(localeCookie.value as Locale)) {
			locale = localeCookie.value as Locale;
		}
	} catch {
		// Fallback to default locale if cookies are not available
		locale = defaultLocale;
	}

	// Dynamically import all namespace files for the locale
	const messages = {
		common: (await import(`./messages/${locale}/common.json`)).default,
		auth: (await import(`./messages/${locale}/auth.json`)).default,
		validation: (await import(`./messages/${locale}/validation.json`)).default,
		errors: (await import(`./messages/${locale}/errors.json`)).default,
		dashboard: (await import(`./messages/${locale}/dashboard.json`)).default,
		organization: (await import(`./messages/${locale}/organization.json`))
			.default,
		athletes: (await import(`./messages/${locale}/athletes.json`)).default,
		coaches: (await import(`./messages/${locale}/coaches.json`)).default,
		training: (await import(`./messages/${locale}/training.json`)).default,
		ageCategories: (await import(`./messages/${locale}/ageCategories.json`))
			.default,
		locations: (await import(`./messages/${locale}/locations.json`)).default,
		events: (await import(`./messages/${locale}/events.json`)).default,
		finance: (await import(`./messages/${locale}/finance.json`)).default,
		settings: (await import(`./messages/${locale}/settings.json`)).default,
		admin: (await import(`./messages/${locale}/admin.json`)).default,
		marketing: (await import(`./messages/${locale}/marketing.json`)).default,
		users: (await import(`./messages/${locale}/users.json`)).default,
	};

	return {
		locale,
		messages,
	};
});
