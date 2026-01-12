import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type * as React from "react";
import { withQuery } from "ufo";
import { SignUpCard } from "@/components/auth/sign-up-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authConfig } from "@/config/auth.config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "Crear cuenta",
};

export type SignupPageProps = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
		invitationId?: string;
	}>;
};

export default async function SignupPage({
	searchParams,
}: SignupPageProps): Promise<React.JSX.Element> {
	const params = await searchParams;
	const { invitationId } = params;

	// If there's an invitation, show the signup form
	if (invitationId) {
		const invitation = await db.query.invitationTable.findFirst({
			where: (i, { eq }) => eq(i.id, invitationId),
			with: {
				organization: true,
			},
		});

		if (
			!invitation ||
			invitation.status !== "pending" ||
			invitation.expiresAt.getTime() < Date.now()
		) {
			return redirect(withQuery("/auth/sign-in", params));
		}

		return <SignUpCard prefillEmail={invitation.email} />;
	}

	// If signup is enabled (for admins/testing), show regular signup
	if (authConfig.enableSignup) {
		return <SignUpCard />;
	}

	// Otherwise, show invitation-only message with link to athlete signup
	return (
		<Card className="w-full border-transparent px-4 py-8 dark:border-border">
			<CardHeader>
				<CardTitle className="text-base lg:text-lg">
					Registro Restringido
				</CardTitle>
				<CardDescription>
					El registro general está disponible solo por invitación.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p className="text-muted-foreground text-sm">
					Si eres un <strong>atleta</strong>, puedes registrarte directamente:
				</p>
				<Link
					href="/athlete-signup"
					className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				>
					Registrarme como Atleta
				</Link>
				<p className="text-muted-foreground text-sm">
					Para otros tipos de cuenta, contacta al administrador de tu
					organización para recibir una invitación.
				</p>
			</CardContent>
			<CardFooter className="flex justify-center gap-1 text-muted-foreground text-sm">
				<span>¿Ya tienes una cuenta?</span>
				<Link className="text-foreground underline" href="/auth/sign-in">
					Iniciar sesión
				</Link>
			</CardFooter>
		</Card>
	);
}
