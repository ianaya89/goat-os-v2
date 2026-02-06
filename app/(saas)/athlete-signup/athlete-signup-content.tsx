"use client";

import {
	Activity,
	AlertCircleIcon,
	LoaderIcon,
	Shield,
	Target,
	TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { AthleteSignUpCard } from "@/components/auth/athlete-sign-up-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

const features = [
	{
		icon: Target,
		title: "Seguimiento personalizado",
		description: "Monitorea tu progreso con métricas detalladas",
	},
	{
		icon: TrendingUp,
		title: "Análisis de rendimiento",
		description: "Visualiza tu evolución a lo largo del tiempo",
	},
	{
		icon: Activity,
		title: "Gestión de entrenamientos",
		description: "Organiza y registra todas tus sesiones",
	},
	{
		icon: Shield,
		title: "Conecta con tu equipo",
		description: "Mantente en contacto con entrenadores",
	},
];

type AthleteSignupContentProps = {
	token?: string;
};

export function AthleteSignupContent({
	token,
}: AthleteSignupContentProps): React.JSX.Element {
	const t = useTranslations("auth.athleteSignup");

	const {
		data: linkData,
		isLoading: isValidating,
		error: tokenError,
	} = trpc.public.athleteSignupLink.validate.useQuery(
		{ token: token! },
		{ enabled: !!token, retry: false },
	);

	// Token is being validated
	if (token && isValidating) {
		return (
			<AuthSplitLayout
				title="Bienvenido a GOAT OS"
				subtitle="La plataforma integral para atletas que buscan llevar su rendimiento al siguiente nivel."
				features={features}
			>
				<Card className="flex w-full items-center justify-center border-0 bg-white/70 px-6 py-16 shadow-2xl shadow-primary/10 backdrop-blur-md dark:bg-card/70 dark:shadow-primary/5">
					<div className="flex flex-col items-center gap-3 text-center">
						<LoaderIcon className="size-6 animate-spin text-muted-foreground" />
						<p className="text-sm text-muted-foreground">{t("validating")}</p>
					</div>
				</Card>
			</AuthSplitLayout>
		);
	}

	// Token is invalid
	if (token && tokenError) {
		return (
			<AuthSplitLayout
				title="Bienvenido a GOAT OS"
				subtitle="La plataforma integral para atletas que buscan llevar su rendimiento al siguiente nivel."
				features={features}
			>
				<Card className="flex w-full flex-col items-center gap-4 border-0 bg-white/70 px-6 py-16 shadow-2xl shadow-primary/10 backdrop-blur-md dark:bg-card/70 dark:shadow-primary/5">
					<div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircleIcon className="size-8 text-destructive" />
					</div>
					<div className="space-y-1 text-center">
						<h2 className="font-semibold text-lg">{t("invalidLink")}</h2>
						<p className="text-sm text-muted-foreground">
							{t("invalidLinkDescription")}
						</p>
					</div>
				</Card>
			</AuthSplitLayout>
		);
	}

	return (
		<AuthSplitLayout
			title="Bienvenido a GOAT OS"
			subtitle="La plataforma integral para atletas que buscan llevar su rendimiento al siguiente nivel."
			features={features}
		>
			<AthleteSignUpCard
				signupToken={token}
				organizationName={linkData?.organizationName}
				organizationLogo={linkData?.organizationLogo}
				athleteGroupName={linkData?.athleteGroupName}
			/>
		</AuthSplitLayout>
	);
}
