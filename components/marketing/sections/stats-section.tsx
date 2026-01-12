"use client";

import { cn } from "@/lib/utils";

interface Stat {
	value: string;
	label: string;
	description: string;
}

export function StatsSection() {
	const stats: Stat[] = [
		{
			value: "500+",
			label: "Equipos Activos",
			description: "Clubes y selecciones confian en nosotros",
		},
		{
			value: "50K+",
			label: "Atletas",
			description: "Monitoreados en nuestra plataforma",
		},
		{
			value: "1M+",
			label: "Sesiones",
			description: "De entrenamiento planificadas",
		},
		{
			value: "15+",
			label: "Deportes",
			description: "Cubiertos con modulos especializados",
		},
	];

	return (
		<section id="stats" className="py-20">
			<div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
				{/* Header */}
				<div className="flex max-w-2xl flex-col gap-6">
					<div className="flex flex-col gap-3">
						<span className="inline-flex items-center gap-2 text-sm font-semibold text-marketing-accent uppercase tracking-wider">
							<span className="h-px w-8 bg-marketing-accent" />
							En numeros
						</span>
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-tight tracking-tight",
								"text-marketing-fg",
								"sm:text-5xl sm:leading-[1.15]",
							)}
						>
							La plataforma elegida por los mejores
						</h2>
					</div>
					<div className="text-lg leading-relaxed text-marketing-fg-muted text-pretty">
						<p>
							Equipos de elite alrededor del mundo confian en GOAT OS para
							llevar su rendimiento al siguiente nivel.
						</p>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
					{stats.map((stat, index) => (
						<div
							key={stat.label}
							className={cn(
								"group relative rounded-xl bg-marketing-card p-6 lg:p-8",
								"hover:bg-marketing-card-hover transition-all duration-500",
								"hover:shadow-lg hover:shadow-marketing-accent/5",
								"animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
							)}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className="text-4xl font-bold tracking-tight text-marketing-accent sm:text-5xl">
								{stat.value}
							</div>
							<div className="mt-3 text-base font-semibold text-marketing-fg">
								{stat.label}
							</div>
							<p className="mt-1 text-sm text-marketing-fg-muted leading-relaxed">
								{stat.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
