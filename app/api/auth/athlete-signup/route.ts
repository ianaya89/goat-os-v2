import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CAPTCHA_RESPONSE_HEADER } from "@/lib/auth/constants";
import { db } from "@/lib/db";
import { athleteTable, userTable } from "@/lib/db/schema";
import { AthleteStatus } from "@/lib/db/schema/enums";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/utils";
import { athleteSignUpSchema } from "@/schemas/auth-schemas";

export const dynamic = "force-dynamic";

async function verifyCaptcha(token: string): Promise<boolean> {
	if (!env.TURNSTILE_SECRET_KEY) {
		return true;
	}

	const response = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				secret: env.TURNSTILE_SECRET_KEY,
				response: token,
			}),
		},
	);

	const data = await response.json();
	return data.success === true;
}

export async function POST(request: Request) {
	try {
		// Verify captcha if enabled
		const captchaToken = request.headers.get(CAPTCHA_RESPONSE_HEADER);
		if (env.TURNSTILE_SECRET_KEY) {
			if (!captchaToken) {
				return NextResponse.json(
					{ error: "Captcha requerido" },
					{ status: 400 },
				);
			}
			const captchaValid = await verifyCaptcha(captchaToken);
			if (!captchaValid) {
				return NextResponse.json(
					{ error: "Captcha inválido" },
					{ status: 400 },
				);
			}
		}

		// Parse and validate request body
		const body = await request.json();
		const validationResult = athleteSignUpSchema.safeParse(body);

		if (!validationResult.success) {
			const errors = validationResult.error.flatten();
			return NextResponse.json(
				{ error: "Datos inválidos", details: errors.fieldErrors },
				{ status: 400 },
			);
		}

		const data = validationResult.data;

		// Check if email already exists
		const existingUser = await db.query.userTable.findFirst({
			where: eq(userTable.email, data.email.toLowerCase()),
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "El email ya está registrado" },
				{ status: 400 },
			);
		}

		// Use Better Auth API to create the user (handles password hashing and verification email)
		const signUpResult = await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email.toLowerCase(),
				password: data.password,
				callbackURL: `${getBaseUrl()}/dashboard`,
			},
		});

		if (!signUpResult || !signUpResult.user) {
			return NextResponse.json(
				{ error: "Error al crear la cuenta" },
				{ status: 500 },
			);
		}

		const newUser = signUpResult.user;

		// Create athlete record
		const [newAthlete] = await db
			.insert(athleteTable)
			.values({
				userId: newUser.id,
				organizationId: null, // Athlete registers without organization
				sport: data.sport,
				birthDate: data.birthDate,
				level: data.level,
				status: AthleteStatus.active,
				phone: data.phone,
				currentClub: data.currentClub,
				category: data.category,
				position: data.position,
				secondaryPosition: null,
				jerseyNumber: data.jerseyNumber || null,
				yearsOfExperience: data.yearsOfExperience || null,
			})
			.returning();

		if (!newAthlete) {
			logger.error({ userId: newUser.id }, "Failed to create athlete record");
			return NextResponse.json(
				{ error: "Error al crear el perfil de atleta" },
				{ status: 500 },
			);
		}

		logger.info(
			{ userId: newUser.id, athleteId: newAthlete.id },
			"New athlete registered",
		);

		return NextResponse.json({
			success: true,
			message: "Cuenta creada exitosamente. Por favor verifica tu email.",
		});
	} catch (error) {
		logger.error({ error }, "Error in athlete signup");
		return NextResponse.json(
			{ error: "Error al crear la cuenta. Por favor intenta nuevamente." },
			{ status: 500 },
		);
	}
}
