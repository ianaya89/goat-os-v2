"use client";

import { Activity, Shield, Target, TrendingUp } from "lucide-react";
import type * as React from "react";
import { AthleteSignUpCard } from "@/components/auth/athlete-sign-up-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

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

export function AthleteSignupContent(): React.JSX.Element {
	return (
		<AuthSplitLayout
			title="Bienvenido a GOAT OS"
			subtitle="La plataforma integral para atletas que buscan llevar su rendimiento al siguiente nivel."
			features={features}
		>
			<AthleteSignUpCard />
		</AuthSplitLayout>
	);
}
