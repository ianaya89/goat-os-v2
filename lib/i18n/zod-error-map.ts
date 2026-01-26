/**
 * Zod validation message translation utilities.
 *
 * Since Zod schemas are defined at module load time (before React context),
 * we use message keys in schemas and translate at display time.
 *
 * Pattern:
 * 1. Schema uses translation keys as messages: z.string().min(1, "name.required")
 * 2. TranslatedFormMessage component translates the key at render time
 */

/**
 * Creates a function that translates all Zod errors in a form state.
 * Useful for react-hook-form integration.
 */
export function createErrorTranslator(
	t: (key: string, values?: Record<string, unknown>) => string,
) {
	return (errors: Record<string, { message?: string }>) => {
		const translated: Record<string, string> = {};
		for (const [field, error] of Object.entries(errors)) {
			if (error?.message) {
				// Try to translate the message as a key, fallback to original
				try {
					const translatedMessage = t(error.message);
					translated[field] =
						translatedMessage !== error.message
							? translatedMessage
							: error.message;
				} catch {
					translated[field] = error.message;
				}
			}
		}
		return translated;
	};
}

/**
 * Common validation message keys for use in Zod schemas.
 * Use these as message parameters to enable translation.
 */
export const validationKeys = {
	required: "required",
	email: {
		invalid: "email.invalid",
		required: "email.required",
	},
	password: {
		required: "password.required",
		tooShort: "password.tooShort",
		tooLong: "password.tooLong",
		requirements: "password.requirements",
	},
	name: {
		required: "name.required",
		tooLong: "name.tooLong",
	},
	phone: {
		required: "phone.required",
		invalid: "phone.invalid",
	},
	minLength: "minLength",
	maxLength: "maxLength",
	min: "min",
	max: "max",
} as const;
