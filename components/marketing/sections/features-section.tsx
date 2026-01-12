"use client";

import {
	ActivityIcon,
	ArrowRightIcon,
	BrainIcon,
	CalendarDaysIcon,
	type LucideIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { GradientCard } from "@/components/marketing/primitives/gradient-card";
import { cn } from "@/lib/utils";

interface Feature {
	title: string;
	description: string;
	link: string;
	linkText: string;
	color: "green" | "blue" | "purple" | "brown";
	placement: "bottom-right" | "bottom-left";
	icon: LucideIcon;
	image: {
		light: string;
		dark: string;
		width: number;
		height: number;
	};
}

const colorStyles = {
	blue: "from-blue-500 to-blue-600",
	purple: "from-purple-500 to-purple-600",
	green: "from-emerald-500 to-emerald-600",
	brown: "from-amber-500 to-amber-600",
};

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
	const Icon = feature.icon;

	return (
		<div
			className={cn(
				"group overflow-hidden rounded-2xl bg-marketing-card p-3",
				"border border-marketing-border/50",
				"hover:border-marketing-accent/30 hover:shadow-2xl hover:shadow-marketing-accent/10",
				"hover:-translate-y-1 transition-all duration-500",
				"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
			)}
			style={{ animationDelay: `${index * 150}ms` }}
		>
			{/* Screenshot */}
			<div className="relative overflow-hidden rounded-lg dark:after:absolute dark:after:inset-0 dark:after:rounded-lg dark:after:outline dark:after:outline-1 dark:after:-outline-offset-1 dark:after:outline-white/10 dark:after:content-['']">
				<GradientCard
					color={feature.color}
					placement={feature.placement}
					rounded="lg"
				>
					<img
						src={feature.image.light}
						alt={feature.title}
						width={feature.image.width}
						height={feature.image.height}
						className="dark:hidden w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
					/>
					<img
						src={feature.image.dark}
						alt={feature.title}
						width={feature.image.width}
						height={feature.image.height}
						className="hidden dark:block w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
					/>
				</GradientCard>
			</div>

			{/* Content */}
			<div className="flex flex-col gap-5 p-6 sm:p-8">
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex size-12 shrink-0 items-center justify-center rounded-xl",
							"bg-gradient-to-br shadow-lg",
							colorStyles[feature.color],
						)}
					>
						<Icon className="size-6 text-white" />
					</div>
					<div className="flex-1">
						<h3 className="text-xl font-bold leading-7 text-marketing-fg">
							{feature.title}
						</h3>
						<p className="mt-2 text-base leading-relaxed text-marketing-fg-muted">
							{feature.description}
						</p>
					</div>
				</div>
				<Link
					href={feature.link}
					className={cn(
						"group/link inline-flex items-center gap-2 text-sm font-bold",
						"text-marketing-accent hover:text-marketing-accent-hover",
						"transition-colors duration-300",
					)}
				>
					{feature.linkText}
					<ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
				</Link>
			</div>
		</div>
	);
}

export function FeaturesSection() {
	const features: Feature[] = [
		{
			title: "Planificacion de Entrenamientos",
			description:
				"Crea planes de entrenamiento personalizados para cada atleta. Organiza sesiones, define objetivos y ajusta la carga de trabajo en tiempo real.",
			link: "#",
			linkText: "Ver Planificacion",
			color: "blue",
			placement: "bottom-right",
			icon: CalendarDaysIcon,
			image: {
				light: "/marketing/placeholders/placeholder-light.webp",
				dark: "/marketing/placeholders/placeholder-dark.webp",
				width: 600,
				height: 400,
			},
		},
		{
			title: "Monitoreo de Rendimiento",
			description:
				"Analiza metricas de rendimiento con dashboards intuitivos. Seguimiento de progreso, deteccion de fatiga y recomendaciones basadas en datos.",
			link: "#",
			linkText: "Explorar Metricas",
			color: "purple",
			placement: "bottom-left",
			icon: ActivityIcon,
			image: {
				light: "/marketing/placeholders/placeholder-light.webp",
				dark: "/marketing/placeholders/placeholder-dark.webp",
				width: 600,
				height: 400,
			},
		},
		{
			title: "Gestion de Equipos",
			description:
				"Administra plantillas, divisiones y categorias desde un solo lugar. Control de asistencia, comunicacion directa y gestion de documentos.",
			link: "#",
			linkText: "Ver Equipos",
			color: "green",
			placement: "bottom-right",
			icon: UsersIcon,
			image: {
				light: "/marketing/placeholders/placeholder-light.webp",
				dark: "/marketing/placeholders/placeholder-dark.webp",
				width: 600,
				height: 400,
			},
		},
		{
			title: "Analisis con IA",
			description:
				"Inteligencia artificial que aprende de tus datos para predecir lesiones, optimizar cargas y recomendar estrategias de entrenamiento.",
			link: "#",
			linkText: "Descubrir IA",
			color: "brown",
			placement: "bottom-left",
			icon: BrainIcon,
			image: {
				light: "/marketing/placeholders/placeholder-light.webp",
				dark: "/marketing/placeholders/placeholder-dark.webp",
				width: 600,
				height: 400,
			},
		},
	];

	return (
		<section id="features" className="py-24 scroll-mt-14">
			<div className="mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				{/* Header - Centered */}
				<div className="flex flex-col items-center text-center gap-6">
					<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-marketing-accent/10 text-sm font-semibold text-marketing-accent uppercase tracking-wider">
						Funcionalidades
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						Todo lo que necesitas para el alto rendimiento
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						Herramientas profesionales para entrenadores, preparadores fisicos y
						equipos deportivos que buscan la excelencia.
					</p>
				</div>

				{/* Features Grid */}
				<div>
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{features.map((feature, index) => (
							<FeatureCard
								key={feature.title}
								feature={feature}
								index={index}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
