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
		<section id="stats" className="relative py-24 overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-marketing-accent/5 to-transparent" />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				{/* Header - Centered */}
				<div className="flex flex-col items-center text-center gap-6">
					<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-marketing-accent/10 text-sm font-semibold text-marketing-accent uppercase tracking-wider">
						En numeros
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						La plataforma elegida por los mejores
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						Equipos de elite alrededor del mundo confian en GOAT OS para llevar
						su rendimiento al siguiente nivel.
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
					{stats.map((stat, index) => (
						<div
							key={stat.label}
							className={cn(
								"group relative rounded-2xl p-8 text-center",
								"bg-gradient-to-br from-marketing-card to-marketing-card-hover",
								"border border-marketing-border/50",
								"hover:border-marketing-accent/30 hover:shadow-2xl hover:shadow-marketing-accent/10",
								"hover:-translate-y-1 transition-all duration-500",
								"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
							)}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<div className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-marketing-accent to-blue-500 bg-clip-text text-transparent">
								{stat.value}
							</div>
							<div className="mt-4 text-lg font-bold text-marketing-fg">
								{stat.label}
							</div>
							<p className="mt-2 text-sm text-marketing-fg-muted leading-relaxed">
								{stat.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
