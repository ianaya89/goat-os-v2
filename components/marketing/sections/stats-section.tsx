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
		<section id="stats" className="py-16">
			<div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
				{/* Header */}
				<div className="flex max-w-2xl flex-col gap-6">
					<div className="flex flex-col gap-2">
						<div className="text-sm font-semibold leading-7 text-marketing-fg-muted">
							En numeros
						</div>
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-10 tracking-tight",
								"text-marketing-fg",
								"sm:text-5xl sm:leading-14",
							)}
						>
							La plataforma elegida por los mejores
						</h2>
					</div>
					<div className="text-base leading-7 text-marketing-fg-muted text-pretty">
						<p>
							Equipos de elite alrededor del mundo confian en GOAT OS para
							llevar su rendimiento al siguiente nivel.
						</p>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="relative rounded-lg bg-marketing-card p-6"
						>
							<div className="text-3xl font-semibold tracking-tight text-marketing-fg sm:text-4xl">
								{stat.value}
							</div>
							<div className="mt-2 text-sm font-medium text-marketing-fg">
								{stat.label}
							</div>
							<p className="mt-1 text-sm text-marketing-fg-muted">
								{stat.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
