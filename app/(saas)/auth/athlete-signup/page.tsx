import type { Metadata } from "next";
import Link from "next/link";
import type * as React from "react";
import { AthleteSignUpCard } from "@/components/auth/athlete-sign-up-card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/custom/theme-toggle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "Registro de Atleta",
	description: "Crea tu cuenta como atleta",
};

export default function AthleteSignupPage(): React.JSX.Element {
	return (
		<main className="min-h-screen bg-neutral-50 px-4 py-12 dark:bg-background">
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<Link className="mx-auto block w-fit" href="/">
					<Logo />
				</Link>
				<AthleteSignUpCard />
			</div>
			<ThemeToggle className="fixed right-2 bottom-2 rounded-full" />
		</main>
	);
}
