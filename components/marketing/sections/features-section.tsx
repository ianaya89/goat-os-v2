"use client";

import { ArrowRightIcon } from "lucide-react";
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
	image: {
		light: string;
		dark: string;
		width: number;
		height: number;
	};
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
	return (
		<div
			className={cn(
				"group overflow-hidden rounded-xl bg-marketing-card p-2",
				"hover:bg-marketing-card-hover transition-all duration-500",
				"hover:shadow-xl hover:shadow-marketing-accent/5",
				"animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
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
			<div className="flex flex-col gap-4 p-6 sm:p-8">
				<div>
					<h3 className="text-lg font-semibold leading-7 text-marketing-fg">
						{feature.title}
					</h3>
					<div className="mt-3 flex flex-col gap-4 text-sm leading-relaxed text-marketing-fg-muted">
						<p>{feature.description}</p>
					</div>
				</div>
				<Link
					href={feature.link}
					className="group/link inline-flex items-center gap-2 text-sm font-semibold text-marketing-accent hover:text-marketing-accent-hover transition-colors duration-300"
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
			image: {
				light: "/marketing/placeholders/placeholder-light.webp",
				dark: "/marketing/placeholders/placeholder-dark.webp",
				width: 600,
				height: 400,
			},
		},
	];

	return (
		<section id="features" className="py-20 scroll-mt-14">
			<div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
				{/* Header */}
				<div className="flex max-w-2xl flex-col gap-6">
					<div className="flex flex-col gap-3">
						<span className="inline-flex items-center gap-2 text-sm font-semibold text-marketing-accent uppercase tracking-wider">
							<span className="h-px w-8 bg-marketing-accent" />
							Funcionalidades
						</span>
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-tight tracking-tight",
								"text-marketing-fg",
								"sm:text-5xl sm:leading-[1.15]",
							)}
						>
							Todo lo que necesitas para el alto rendimiento
						</h2>
					</div>
					<div className="text-lg leading-relaxed text-marketing-fg-muted text-pretty">
						<p>
							Herramientas profesionales para entrenadores, preparadores fisicos
							y equipos deportivos que buscan la excelencia.
						</p>
					</div>
				</div>

				{/* Features Grid */}
				<div>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
