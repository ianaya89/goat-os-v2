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
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Feature {
	title: string;
	description: string;
	link: string;
	linkText: string;
	color: "slate" | "muted";
	icon: LucideIcon;
	illustration: ReactNode;
}

// Monochromatic palette with slate as the only accent
const colorStyles = {
	slate: {
		gradient: "from-slate-500 to-slate-600",
		bg: "bg-slate-500/10",
		border: "border-slate-500/20",
		text: "text-slate-600 dark:text-slate-400",
		glow: "shadow-slate-500/20",
	},
	muted: {
		gradient: "from-marketing-fg-muted to-marketing-fg",
		bg: "bg-marketing-fg/5",
		border: "border-marketing-border",
		text: "text-marketing-fg",
		glow: "shadow-marketing-fg/10",
	},
};

// Custom SVG illustrations for each feature
function TrainingPlanIllustration() {
	return (
		<svg viewBox="0 0 400 280" className="w-full h-auto">
			<defs>
				<linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.05" />
				</linearGradient>
			</defs>

			{/* Calendar grid */}
			<rect
				x="20"
				y="30"
				width="360"
				height="230"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>
			<rect
				x="20"
				y="30"
				width="360"
				height="230"
				rx="12"
				fill="url(#cal-grad)"
			/>

			{/* Header */}
			<rect
				x="20"
				y="30"
				width="360"
				height="45"
				rx="12"
				fill="#6b8fa3"
				opacity="0.1"
			/>
			<text
				x="40"
				y="58"
				fill="#6b8fa3"
				fontSize="14"
				fontWeight="600"
				className="font-sans"
			>
				Enero 2026
			</text>

			{/* Week days */}
			{["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
				<text
					key={day}
					x={50 + i * 50}
					y="95"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="11"
					textAnchor="middle"
				>
					{day}
				</text>
			))}

			{/* Calendar cells with training indicators */}
			{[
				[1, 2, 3, 4, 5, 6, 7],
				[8, 9, 10, 11, 12, 13, 14],
				[15, 16, 17, 18, 19, 20, 21],
				[22, 23, 24, 25, 26, 27, 28],
			].map((week, wi) =>
				week.map((day, di) => {
					const hasTraining = [
						1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26,
					].includes(day);
					const isToday = day === 15;
					return (
						<g key={day}>
							<rect
								x={30 + di * 50}
								y={105 + wi * 40}
								width="40"
								height="32"
								rx="6"
								fill={
									isToday ? "#6b8fa3" : hasTraining ? "#6b8fa3" : "transparent"
								}
								opacity={isToday ? 1 : hasTraining ? 0.15 : 0}
							/>
							<text
								x={50 + di * 50}
								y={125 + wi * 40}
								fill={isToday ? "white" : "currentColor"}
								className={isToday ? "" : "text-marketing-fg"}
								fontSize="12"
								textAnchor="middle"
								fontWeight={isToday ? "600" : "400"}
							>
								{day}
							</text>
							{hasTraining && !isToday && (
								<circle
									cx={50 + di * 50}
									cy={132 + wi * 40}
									r="2"
									fill="#6b8fa3"
								/>
							)}
						</g>
					);
				}),
			)}

			{/* Floating session card */}
			<g className="drop-shadow-lg">
				<rect
					x="260"
					y="10"
					width="130"
					height="70"
					rx="10"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<rect
					x="260"
					y="10"
					width="130"
					height="70"
					rx="10"
					stroke="#6b8fa3"
					strokeWidth="2"
					fill="none"
				/>
				<circle cx="280" cy="35" r="8" fill="#6b8fa3" opacity="0.2" />
				<circle cx="280" cy="35" r="5" fill="#6b8fa3" />
				<text
					x="295"
					y="38"
					fill="currentColor"
					className="text-marketing-fg"
					fontSize="10"
					fontWeight="600"
				>
					Sesion Fuerza
				</text>
				<text
					x="270"
					y="58"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					09:00 - 10:30
				</text>
				<rect
					x="340"
					y="50"
					width="40"
					height="18"
					rx="9"
					fill="#6b8fa3"
					opacity="0.2"
				/>
				<text
					x="360"
					y="62"
					fill="#6b8fa3"
					fontSize="8"
					textAnchor="middle"
					fontWeight="600"
				>
					Alta
				</text>
			</g>
		</svg>
	);
}

function PerformanceIllustration() {
	return (
		<svg viewBox="0 0 400 280" className="w-full h-auto">
			<defs>
				<linearGradient id="perf-area" x1="0%" y1="100%" x2="0%" y2="0%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.05" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.3" />
				</linearGradient>
				<linearGradient id="perf-line" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#6b8fa3" />
					<stop offset="100%" stopColor="#94a3b8" />
				</linearGradient>
			</defs>

			{/* Main card */}
			<rect
				x="20"
				y="20"
				width="360"
				height="240"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>

			{/* Grid lines */}
			{[0, 1, 2, 3, 4].map((i) => (
				<line
					key={i}
					x1="50"
					y1={70 + i * 40}
					x2="360"
					y2={70 + i * 40}
					stroke="currentColor"
					className="text-marketing-border"
					strokeWidth="1"
					strokeDasharray="4 4"
					opacity="0.5"
				/>
			))}

			{/* Area chart */}
			<path
				d="M 50 230 L 50 200 Q 100 180, 140 170 T 220 140 T 300 100 T 360 80 L 360 230 Z"
				fill="url(#perf-area)"
			/>

			{/* Line chart */}
			<path
				d="M 50 200 Q 100 180, 140 170 T 220 140 T 300 100 T 360 80"
				fill="none"
				stroke="url(#perf-line)"
				strokeWidth="3"
				strokeLinecap="round"
			/>

			{/* Data points */}
			{[
				{ x: 50, y: 200 },
				{ x: 140, y: 170 },
				{ x: 220, y: 140 },
				{ x: 300, y: 100 },
				{ x: 360, y: 80 },
			].map((point, i) => (
				<g key={i}>
					<circle cx={point.x} cy={point.y} r="6" fill="#6b8fa3" />
					<circle cx={point.x} cy={point.y} r="3" fill="white" />
				</g>
			))}

			{/* Metric cards */}
			<g>
				<rect
					x="40"
					y="30"
					width="80"
					height="50"
					rx="8"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="50"
					y="50"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					VO2 Max
				</text>
				<text x="50" y="68" fill="#6b8fa3" fontSize="16" fontWeight="bold">
					58.2
				</text>
			</g>
			<g>
				<rect
					x="130"
					y="30"
					width="80"
					height="50"
					rx="8"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="140"
					y="50"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					Carga RPE
				</text>
				<text x="140" y="68" fill="#6b8fa3" fontSize="16" fontWeight="bold">
					7.4
				</text>
			</g>
			<g>
				<rect
					x="220"
					y="30"
					width="80"
					height="50"
					rx="8"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="230"
					y="50"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					Fatiga
				</text>
				<text
					x="230"
					y="68"
					fill="currentColor"
					className="text-marketing-fg"
					fontSize="16"
					fontWeight="bold"
				>
					Media
				</text>
			</g>

			{/* Trend indicator */}
			<g>
				<rect
					x="310"
					y="30"
					width="60"
					height="50"
					rx="8"
					fill="#6b8fa3"
					opacity="0.1"
				/>
				<path
					d="M 330 65 L 340 50 L 350 55 L 360 45"
					fill="none"
					stroke="#6b8fa3"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<text x="345" y="40" fill="#6b8fa3" fontSize="10" textAnchor="middle">
					+12%
				</text>
			</g>
		</svg>
	);
}

function TeamManagementIllustration() {
	return (
		<svg viewBox="0 0 400 280" className="w-full h-auto">
			{/* Main container */}
			<rect
				x="20"
				y="20"
				width="360"
				height="240"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>

			{/* Team roster header */}
			<rect
				x="30"
				y="30"
				width="170"
				height="35"
				rx="8"
				fill="#6b8fa3"
				opacity="0.1"
			/>
			<text x="45" y="52" fill="#6b8fa3" fontSize="12" fontWeight="600">
				Equipo Principal
			</text>
			<circle cx="180" cy="47" r="10" fill="#6b8fa3" opacity="0.2" />
			<text x="180" y="51" fill="#6b8fa3" fontSize="10" textAnchor="middle">
				24
			</text>

			{/* Player cards */}
			{[
				{ name: "Martinez, J.", pos: "DEL", status: "active", y: 75 },
				{ name: "Rodriguez, C.", pos: "MED", status: "active", y: 115 },
				{ name: "Silva, A.", pos: "DEF", status: "injury", y: 155 },
				{ name: "Torres, M.", pos: "POR", status: "active", y: 195 },
			].map((player, i) => (
				<g key={i}>
					<rect
						x="30"
						y={player.y}
						width="170"
						height="35"
						rx="6"
						fill="currentColor"
						className="text-marketing-bg"
					/>
					{/* Avatar */}
					<circle
						cx="52"
						cy={player.y + 17}
						r="12"
						fill="#6b8fa3"
						opacity="0.2"
					/>
					<circle
						cx="52"
						cy={player.y + 12}
						r="5"
						fill="#6b8fa3"
						opacity="0.4"
					/>
					<ellipse
						cx="52"
						cy={player.y + 22}
						rx="8"
						ry="5"
						fill="#6b8fa3"
						opacity="0.4"
					/>

					<text
						x="70"
						y={player.y + 15}
						fill="currentColor"
						className="text-marketing-fg"
						fontSize="10"
						fontWeight="500"
					>
						{player.name}
					</text>
					<text
						x="70"
						y={player.y + 27}
						fill="currentColor"
						className="text-marketing-fg-muted"
						fontSize="9"
					>
						{player.pos}
					</text>

					<circle
						cx="180"
						cy={player.y + 17}
						r="5"
						fill={player.status === "active" ? "#6b8fa3" : "#94a3b8"}
					/>
				</g>
			))}

			{/* Right panel - Stats */}
			<rect
				x="210"
				y="30"
				width="160"
				height="200"
				rx="10"
				fill="currentColor"
				className="text-marketing-bg"
			/>
			<text
				x="225"
				y="55"
				fill="currentColor"
				className="text-marketing-fg"
				fontSize="11"
				fontWeight="600"
			>
				Resumen del Equipo
			</text>

			{/* Donut chart */}
			<g transform="translate(290, 110)">
				<circle
					r="35"
					fill="none"
					stroke="#6b8fa3"
					strokeWidth="8"
					strokeDasharray="165 220"
					transform="rotate(-90)"
					opacity="0.3"
				/>
				<circle
					r="35"
					fill="none"
					stroke="#6b8fa3"
					strokeWidth="8"
					strokeDasharray="140 220"
					transform="rotate(-90)"
				/>
				<text
					x="0"
					y="5"
					fill="currentColor"
					className="text-marketing-fg"
					fontSize="14"
					fontWeight="bold"
					textAnchor="middle"
				>
					92%
				</text>
			</g>

			<text
				x="290"
				y="165"
				fill="currentColor"
				className="text-marketing-fg-muted"
				fontSize="9"
				textAnchor="middle"
			>
				Disponibilidad
			</text>

			{/* Quick stats */}
			<g>
				<rect
					x="220"
					y="180"
					width="65"
					height="40"
					rx="6"
					fill="#6b8fa3"
					opacity="0.1"
				/>
				<text
					x="252"
					y="200"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
					textAnchor="middle"
				>
					Activos
				</text>
				<text
					x="252"
					y="214"
					fill="#6b8fa3"
					fontSize="14"
					fontWeight="bold"
					textAnchor="middle"
				>
					22
				</text>
			</g>
			<g>
				<rect
					x="295"
					y="180"
					width="65"
					height="40"
					rx="6"
					fill="currentColor"
					className="text-marketing-fg/5"
				/>
				<text
					x="327"
					y="200"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
					textAnchor="middle"
				>
					Lesiones
				</text>
				<text
					x="327"
					y="214"
					fill="currentColor"
					className="text-marketing-fg"
					fontSize="14"
					fontWeight="bold"
					textAnchor="middle"
				>
					2
				</text>
			</g>
		</svg>
	);
}

function AIAnalysisIllustration() {
	return (
		<svg viewBox="0 0 400 280" className="w-full h-auto">
			<defs>
				<linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.05" />
				</linearGradient>
				<filter id="ai-glow">
					<feGaussianBlur stdDeviation="2" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* Main container */}
			<rect
				x="20"
				y="20"
				width="360"
				height="240"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>
			<rect
				x="20"
				y="20"
				width="360"
				height="240"
				rx="12"
				fill="url(#ai-grad)"
			/>

			{/* Neural network visualization */}
			<g transform="translate(200, 140)" filter="url(#ai-glow)">
				{/* Center node */}
				<circle r="20" fill="#6b8fa3" opacity="0.3" />
				<circle r="12" fill="#6b8fa3" />

				{/* Connecting lines */}
				{[0, 60, 120, 180, 240, 300].map((angle, i) => {
					const x = Math.cos((angle * Math.PI) / 180) * 60;
					const y = Math.sin((angle * Math.PI) / 180) * 60;
					return (
						<g key={i}>
							<line
								x1="0"
								y1="0"
								x2={x}
								y2={y}
								stroke="#6b8fa3"
								strokeWidth="2"
								opacity="0.4"
							>
								<animate
									attributeName="stroke-opacity"
									values="0.2;0.6;0.2"
									dur={`${1.5 + i * 0.2}s`}
									repeatCount="indefinite"
								/>
							</line>
							<circle cx={x} cy={y} r="8" fill="#6b8fa3" opacity="0.5">
								<animate
									attributeName="r"
									values="6;10;6"
									dur={`${1.5 + i * 0.2}s`}
									repeatCount="indefinite"
								/>
							</circle>
							<circle cx={x} cy={y} r="4" fill="#6b8fa3" />
						</g>
					);
				})}

				{/* Outer ring */}
				{[30, 90, 150, 210, 270, 330].map((angle, i) => {
					const x = Math.cos((angle * Math.PI) / 180) * 90;
					const y = Math.sin((angle * Math.PI) / 180) * 90;
					return (
						<circle key={i} cx={x} cy={y} r="4" fill="#6b8fa3" opacity="0.3">
							<animate
								attributeName="opacity"
								values="0.2;0.5;0.2"
								dur={`${2 + i * 0.1}s`}
								repeatCount="indefinite"
							/>
						</circle>
					);
				})}
			</g>

			{/* Prediction cards */}
			<g>
				<rect
					x="30"
					y="30"
					width="130"
					height="55"
					rx="8"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="40"
					y="48"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					Riesgo de Lesion
				</text>
				<text x="40" y="68" fill="#6b8fa3" fontSize="18" fontWeight="bold">
					Bajo
				</text>
				<rect
					x="100"
					y="55"
					width="50"
					height="20"
					rx="10"
					fill="#6b8fa3"
					opacity="0.2"
				/>
				<text
					x="125"
					y="68"
					fill="#6b8fa3"
					fontSize="10"
					textAnchor="middle"
					fontWeight="600"
				>
					12%
				</text>
			</g>

			<g>
				<rect
					x="30"
					y="95"
					width="130"
					height="55"
					rx="8"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="40"
					y="113"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="9"
				>
					Carga Optima
				</text>
				<rect x="40" y="122" width="110" height="6" rx="3" fill="#e5e7eb" />
				<rect x="40" y="122" width="75" height="6" rx="3" fill="#6b8fa3" />
				<text x="40" y="143" fill="#6b8fa3" fontSize="10" fontWeight="600">
					68% recomendado
				</text>
			</g>

			{/* AI Insight card */}
			<g>
				<rect
					x="240"
					y="30"
					width="130"
					height="80"
					rx="8"
					fill="#6b8fa3"
					opacity="0.1"
				/>
				<rect x="250" y="40" width="20" height="20" rx="10" fill="#6b8fa3" />
				<text x="260" y="54" fill="white" fontSize="10" textAnchor="middle">
					AI
				</text>
				<text x="275" y="52" fill="#6b8fa3" fontSize="10" fontWeight="600">
					Insight
				</text>
				<text
					x="250"
					y="75"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
				>
					Reducir volumen en
				</text>
				<text
					x="250"
					y="88"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
				>
					proximas 48h
				</text>
				<text x="250" y="101" fill="#6b8fa3" fontSize="9" fontWeight="600">
					Confianza: 94%
				</text>
			</g>
		</svg>
	);
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
	const Icon = feature.icon;
	const styles = colorStyles[feature.color];

	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-2xl",
				"bg-gradient-to-br from-marketing-card to-marketing-card-hover",
				"border border-marketing-border/50",
				"hover:border-marketing-accent/30",
				"transition-all duration-500",
				"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
			)}
			style={{ animationDelay: `${index * 150}ms` }}
		>
			{/* Illustration area */}
			<div className="relative overflow-hidden bg-gradient-to-br from-marketing-bg to-marketing-card p-4 sm:p-6">
				<div className="relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
					{feature.illustration}
				</div>

				{/* Decorative corner accent */}
				<div
					className={cn(
						"absolute -top-20 -right-20 size-40 rounded-full blur-3xl opacity-20",
						`bg-gradient-to-br ${styles.gradient}`,
					)}
				/>
			</div>

			{/* Content */}
			<div className="flex flex-col gap-4 p-6 sm:p-8">
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex size-12 shrink-0 items-center justify-center rounded-xl",
							"bg-gradient-to-br shadow-lg",
							styles.gradient,
							styles.glow,
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
						"group/link inline-flex items-center gap-2 text-sm font-bold w-fit",
						styles.text,
						"transition-colors duration-300",
					)}
				>
					{feature.linkText}
					<ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
				</Link>
			</div>

			{/* Hover glow effect */}
			<div
				className={cn(
					"absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
					"bg-gradient-to-t from-transparent via-transparent to-white/5",
				)}
			/>
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
			linkText: "Ver mas",
			color: "slate",
			icon: CalendarDaysIcon,
			illustration: <TrainingPlanIllustration />,
		},
		{
			title: "Monitoreo de Rendimiento",
			description:
				"Analiza metricas de rendimiento con dashboards intuitivos. Seguimiento de progreso, deteccion de fatiga y recomendaciones basadas en datos.",
			link: "#",
			linkText: "Ver mas",
			color: "muted",
			icon: ActivityIcon,
			illustration: <PerformanceIllustration />,
		},
		{
			title: "Gestion de Equipos",
			description:
				"Administra plantillas, divisiones y categorias desde un solo lugar. Control de asistencia, comunicacion directa y gestion de documentos.",
			link: "#",
			linkText: "Ver mas",
			color: "muted",
			icon: UsersIcon,
			illustration: <TeamManagementIllustration />,
		},
		{
			title: "Analisis con IA",
			description:
				"Inteligencia artificial que aprende de tus datos para predecir lesiones, optimizar cargas y recomendar estrategias de entrenamiento.",
			link: "#",
			linkText: "Ver mas",
			color: "muted",
			icon: BrainIcon,
			illustration: <AIAnalysisIllustration />,
		},
	];

	return (
		<section
			id="features"
			className="relative py-24 lg:py-32 scroll-mt-14 overflow-hidden"
		>
			{/* Background decoration */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-1/4 -left-32 size-64 rounded-full bg-slate-500/5 blur-3xl" />
				<div className="absolute bottom-1/4 -right-32 size-64 rounded-full bg-slate-500/5 blur-3xl" />
			</div>

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
						Funcionalidades
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						Todo lo que necesitas para{" "}
						<span className="text-slate-500">el alto rendimiento</span>
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						Herramientas profesionales para entrenadores, preparadores fisicos y
						equipos deportivos que buscan la excelencia.
					</p>
				</div>

				{/* Features Grid */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{features.map((feature, index) => (
						<FeatureCard key={feature.title} feature={feature} index={index} />
					))}
				</div>
			</div>
		</section>
	);
}
