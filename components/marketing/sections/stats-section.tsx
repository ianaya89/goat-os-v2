"use client";

import {
	BarChart3Icon,
	HeadphonesIcon,
	type LucideIcon,
	TrophyIcon,
	ZapIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Stat {
	value: number;
	suffix: string;
	label: string;
	description: string;
	icon: LucideIcon;
	color: "slate" | "muted";
}

// Monochromatic with slate accent
const colorStyles = {
	slate: {
		gradient: "from-slate-500 to-slate-600",
		bg: "bg-slate-500/10",
		text: "text-slate-500",
		glow: "shadow-slate-500/20",
	},
	muted: {
		gradient: "from-marketing-fg to-marketing-fg",
		bg: "bg-marketing-fg/5",
		text: "text-marketing-fg",
		glow: "shadow-marketing-fg/10",
	},
};

// Animated counter hook
function useCountUp(end: number, duration = 2000, startOnView = true) {
	const [count, setCount] = useState(0);
	const [hasStarted, setHasStarted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!startOnView) {
			setHasStarted(true);
		}
	}, [startOnView]);

	useEffect(() => {
		if (!startOnView) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && !hasStarted) {
					setHasStarted(true);
				}
			},
			{ threshold: 0.3 },
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, [hasStarted, startOnView]);

	useEffect(() => {
		if (!hasStarted) return;

		let startTime: number;
		let animationFrame: number;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);

			// Easing function for smooth animation
			const easeOutQuart = 1 - (1 - progress) ** 4;
			setCount(Math.floor(easeOutQuart * end));

			if (progress < 1) {
				animationFrame = requestAnimationFrame(animate);
			}
		};

		animationFrame = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationFrame);
	}, [end, duration, hasStarted]);

	return { count, ref };
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
	const { count, ref } = useCountUp(stat.value, 2000 + index * 200);
	const styles = colorStyles[stat.color];

	return (
		<div
			ref={ref}
			className={cn(
				"group relative overflow-hidden rounded-2xl p-6 sm:p-8",
				"bg-gradient-to-br from-marketing-card to-marketing-card-hover",
				"border border-marketing-border/50",
				"hover:border-marketing-accent/30",
				"transition-all duration-500",
				"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
			)}
			style={{ animationDelay: `${index * 100}ms` }}
		>
			{/* Background decoration */}
			<div
				className={cn(
					"absolute -top-10 -right-10 size-32 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-30",
					`bg-gradient-to-br ${styles.gradient}`,
				)}
			/>

			{/* Icon */}
			<div className="flex items-center gap-3 mb-4">
				<div
					className={cn(
						"flex items-center justify-center size-10 rounded-xl",
						styles.bg,
					)}
				>
					<stat.icon className={cn("size-5", styles.text)} />
				</div>
				<span
					className={cn(
						"text-xs font-bold uppercase tracking-wider",
						styles.text,
					)}
				>
					{stat.label}
				</span>
			</div>

			{/* Value */}
			<div className="relative">
				<div
					className={cn(
						"text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight tabular-nums",
						`bg-gradient-to-r ${styles.gradient} bg-clip-text text-transparent`,
					)}
				>
					{count.toLocaleString()}
					<span className="text-3xl sm:text-4xl lg:text-5xl">
						{stat.suffix}
					</span>
				</div>
			</div>

			{/* Description */}
			<p className="mt-3 text-sm text-marketing-fg-muted leading-relaxed">
				{stat.description}
			</p>

			{/* Progress bar decoration */}
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-marketing-border/30">
				<div
					className={cn(
						"h-full transition-all duration-1000 ease-out",
						`bg-gradient-to-r ${styles.gradient}`,
					)}
					style={{
						width: `${(count / stat.value) * 100}%`,
					}}
				/>
			</div>
		</div>
	);
}

// Decorative SVG background
function StatsBackground() {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Gradient mesh */}
			<div className="absolute inset-0 bg-gradient-to-b from-marketing-bg via-marketing-accent/5 to-marketing-bg" />

			{/* Animated grid pattern */}
			<div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
				<svg className="absolute inset-0 size-full">
					<defs>
						<pattern
							id="stats-grid"
							x="0"
							y="0"
							width="60"
							height="60"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 60 0 L 0 0 0 60"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								className="text-marketing-fg"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#stats-grid)" />
				</svg>
			</div>

			{/* Floating orbs */}
			<div
				className="absolute top-1/4 left-1/4 size-48 rounded-full bg-slate-500/10 blur-3xl"
				style={{ animation: "float 8s ease-in-out infinite" }}
			/>
			<div
				className="absolute bottom-1/4 right-1/4 size-48 rounded-full bg-slate-500/10 blur-3xl"
				style={{ animation: "float 6s ease-in-out infinite 1s" }}
			/>
		</div>
	);
}

export function StatsSection() {
	const stats: Stat[] = [
		{
			value: 15,
			suffix: "+",
			label: "Deportes Soportados",
			description: "Futbol, basquet, rugby, natacion y mas",
			icon: TrophyIcon,
			color: "slate",
		},
		{
			value: 50,
			suffix: "+",
			label: "Metricas",
			description: "Indicadores de rendimiento especializados",
			icon: BarChart3Icon,
			color: "muted",
		},
		{
			value: 99,
			suffix: "%",
			label: "Uptime",
			description: "Disponibilidad garantizada de la plataforma",
			icon: ZapIcon,
			color: "muted",
		},
		{
			value: 24,
			suffix: "/7",
			label: "Soporte",
			description: "Asistencia tecnica siempre disponible",
			icon: HeadphonesIcon,
			color: "muted",
		},
	];

	return (
		<section id="stats" className="relative py-24 lg:py-32 overflow-hidden">
			<StatsBackground />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				{/* Header - Centered */}
				<div className="flex flex-col items-center text-center gap-6">
					<span
						className={cn(
							"inline-flex items-center gap-2 px-4 py-2 rounded-full",
							"bg-marketing-card border border-marketing-border",
							"text-sm font-semibold text-marketing-fg-muted uppercase tracking-wider",
						)}
					>
						<span className="size-2 rounded-full bg-slate-500" />
						Plataforma
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						Disenado para{" "}
						<span className="text-slate-500">el alto rendimiento</span>
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						Una plataforma robusta con todas las herramientas que necesitas para
						gestionar tu equipo de manera profesional.
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map((stat, index) => (
						<StatCard key={stat.label} stat={stat} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
