import { Activity, Shield, Target, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import { AthleteSignUpCard } from "@/components/auth/athlete-sign-up-card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/custom/theme-toggle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
	title: "Registro de Atleta",
	description: "Crea tu cuenta como atleta en GOAT OS",
};

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

export default function AthleteSignupPage(): React.JSX.Element {
	return (
		<div className="flex min-h-screen">
			{/* Left Panel - Branding */}
			<div className="relative hidden w-1/2 bg-primary lg:block">
				<div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
				<div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
					<Link href="/">
						<Logo className="text-primary-foreground" />
					</Link>

					<div className="max-w-md space-y-8">
						<div className="space-y-4">
							<h1 className="font-bold text-3xl leading-tight tracking-tight">
								Bienvenido a GOAT OS
							</h1>
							<p className="text-primary-foreground/80 text-lg">
								La plataforma integral para atletas que buscan llevar su
								rendimiento al siguiente nivel.
							</p>
						</div>

						<div className="space-y-4">
							{features.map((feature) => (
								<div key={feature.title} className="flex items-start gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
										<feature.icon className="size-4" />
									</div>
									<div>
										<p className="font-medium text-sm">{feature.title}</p>
										<p className="text-primary-foreground/70 text-sm">
											{feature.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<p className="text-primary-foreground/50 text-sm">
						&copy; {new Date().getFullYear()} GOAT OS. Todos los derechos
						reservados.
					</p>
				</div>
			</div>

			{/* Right Panel - Form */}
			<div className="flex w-full flex-col bg-background lg:w-1/2">
				{/* Mobile header */}
				<div className="flex items-center justify-between border-b p-4 lg:hidden">
					<Link href="/">
						<Logo />
					</Link>
				</div>

				{/* Form container */}
				<div className="flex flex-1 items-center justify-center p-6">
					<div className="w-full max-w-md">
						<AthleteSignUpCard />
					</div>
				</div>
			</div>

			<ThemeToggle className="fixed right-4 bottom-4 rounded-full" />
		</div>
	);
}
