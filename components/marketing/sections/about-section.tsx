"use client";

import {
	ArrowRightIcon,
	ShieldCheckIcon,
	TargetIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

const values = [
	{
		title: "Innovacion Constante",
		description:
			"Desarrollamos tecnologia de vanguardia para el deporte de alto rendimiento.",
		icon: TrendingUpIcon,
	},
	{
		title: "Enfoque en el Atleta",
		description:
			"Cada funcionalidad esta disenada pensando en maximizar el potencial deportivo.",
		icon: TargetIcon,
	},
	{
		title: "Trabajo en Equipo",
		description:
			"Facilitamos la colaboracion entre entrenadores, preparadores fisicos y atletas.",
		icon: UsersIcon,
	},
	{
		title: "Confianza y Seguridad",
		description:
			"Protegemos los datos de tus atletas con los mas altos estandares.",
		icon: ShieldCheckIcon,
	},
];

export function AboutSection() {
	return (
		<main className="isolate overflow-clip">
			{/* Hero Section */}
			<section className="py-16 pt-32 lg:pt-40" id="hero">
				<div className="mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
					<div className="flex flex-col items-start gap-6">
						<h1
							className={cn(
								"text-balance font-display text-5xl leading-12 tracking-tight",
								"text-marketing-fg",
								"sm:text-[5rem] sm:leading-20",
							)}
						>
							Transformando el deporte con tecnologia
						</h1>
						<div className="flex max-w-3xl flex-col gap-4 text-lg leading-8 text-marketing-fg-muted">
							<p>
								En {appConfig.appName}, creemos que cada atleta merece las
								mejores herramientas para alcanzar su maximo potencial.
								Combinamos ciencia del deporte, analisis de datos e inteligencia
								artificial para revolucionar la forma en que los equipos
								entrenan y compiten.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Mission Section */}
			<section className="py-16" id="mission">
				<div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
					<div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
						<div className="flex flex-col gap-6">
							<div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
								Nuestra Mision
							</div>
							<h2
								className={cn(
									"text-pretty font-display text-[2rem] leading-10 tracking-tight",
									"text-marketing-fg",
									"sm:text-4xl sm:leading-12",
								)}
							>
								Democratizar el acceso a herramientas de alto rendimiento
							</h2>
							<div className="text-base leading-7 text-marketing-fg-muted text-pretty">
								<p>
									Nuestra mision es brindar a clubes, academias y organizaciones
									deportivas de todos los tamaños acceso a la misma tecnologia
									que usan los equipos de elite. Creemos que la innovacion no
									deberia estar limitada por el presupuesto.
								</p>
							</div>
						</div>
						<div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8 lg:p-12">
							<div className="flex flex-col gap-6">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-full bg-slate-500/10">
										<TargetIcon className="size-6 text-slate-500" />
									</div>
									<div>
										<div className="text-2xl font-bold text-marketing-fg">
											Vision
										</div>
									</div>
								</div>
								<p className="text-marketing-fg-muted leading-relaxed">
									Ser la plataforma de referencia para la gestion deportiva en
									Latinoamerica, impulsando el desarrollo de atletas y equipos a
									traves de la tecnologia.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Values Section */}
			<section className="py-16" id="values">
				<div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
					<div className="flex max-w-2xl flex-col gap-6">
						<div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
							Nuestros Valores
						</div>
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-10 tracking-tight",
								"text-marketing-fg",
								"sm:text-4xl sm:leading-12",
							)}
						>
							Los principios que nos guian
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
						{values.map((value) => (
							<div
								key={value.title}
								className="relative rounded-2xl bg-marketing-card p-6 border border-marketing-border/50"
							>
								<div className="flex size-10 items-center justify-center rounded-xl bg-slate-500/10 mb-4">
									<value.icon className="size-5 text-slate-500" />
								</div>
								<p className="font-semibold text-marketing-fg">{value.title}</p>
								<p className="mt-2 text-sm text-marketing-fg-muted">
									{value.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16" id="cta">
				<div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
					<div className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-8 lg:p-12 text-center">
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-10 tracking-tight",
								"text-white",
								"sm:text-4xl sm:leading-12",
							)}
						>
							Listo para transformar tu equipo?
						</h2>
						<p className="mt-4 max-w-2xl mx-auto text-slate-200">
							Unite a las organizaciones deportivas que ya estan usando{" "}
							{appConfig.appName}
							para potenciar el rendimiento de sus atletas.
						</p>
						<div className="flex items-center justify-center gap-4 mt-8">
							<Link
								href="/athlete-signup"
								className={cn(
									"inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-6 py-3 text-sm font-semibold",
									"bg-white text-slate-700 hover:bg-slate-100",
									"transition-colors",
								)}
							>
								Comenzar Gratis
							</Link>
							<Link
								href="/contact"
								className={cn(
									"group inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
									"text-white border border-white/30 hover:bg-white/10",
									"transition-colors",
								)}
							>
								Contactanos
								<ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
