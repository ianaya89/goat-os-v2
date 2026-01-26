"use client";

import { KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react";
import type * as React from "react";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

const authFeatures = [
	{
		icon: ShieldCheck,
		title: "Acceso seguro",
		description: "Protección avanzada para tu cuenta",
	},
	{
		icon: KeyRound,
		title: "Autenticación 2FA",
		description: "Capa extra de seguridad opcional",
	},
	{
		icon: Lock,
		title: "Datos encriptados",
		description: "Tu información siempre protegida",
	},
	{
		icon: Sparkles,
		title: "Experiencia fluida",
		description: "Accede desde cualquier dispositivo",
	},
];

export default function AuthLayout({
	children,
}: React.PropsWithChildren): React.JSX.Element {
	return (
		<AuthSplitLayout
			title="Tu plataforma deportiva"
			subtitle="Gestiona tu organización, atletas y entrenamientos en un solo lugar."
			features={authFeatures}
		>
			{children}
		</AuthSplitLayout>
	);
}
