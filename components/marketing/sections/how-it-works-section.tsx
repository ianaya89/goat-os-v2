"use client";

import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Step {
	number: string;
	title: string;
	description: string;
	features: string[];
	illustration: React.ReactNode;
}

// Step illustrations as SVG components
function Step1Illustration() {
	return (
		<svg viewBox="0 0 300 200" className="w-full h-auto">
			<defs>
				<linearGradient id="step1-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.05" />
				</linearGradient>
			</defs>

			{/* Main card */}
			<rect
				x="20"
				y="20"
				width="260"
				height="160"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>
			<rect
				x="20"
				y="20"
				width="260"
				height="160"
				rx="12"
				fill="url(#step1-grad)"
			/>

			{/* Form fields */}
			<rect
				x="40"
				y="45"
				width="100"
				height="12"
				rx="6"
				fill="#6b8fa3"
				opacity="0.2"
			/>
			<rect
				x="40"
				y="65"
				width="220"
				height="30"
				rx="6"
				fill="currentColor"
				className="text-marketing-bg"
			/>
			<text
				x="50"
				y="85"
				fill="currentColor"
				className="text-marketing-fg-muted"
				fontSize="10"
			>
				Nombre del equipo...
			</text>

			<rect
				x="40"
				y="105"
				width="100"
				height="12"
				rx="6"
				fill="#6b8fa3"
				opacity="0.2"
			/>
			<rect
				x="40"
				y="125"
				width="220"
				height="30"
				rx="6"
				fill="currentColor"
				className="text-marketing-bg"
			/>

			{/* Button */}
			<rect x="160" y="165" width="100" height="30" rx="15" fill="#6b8fa3" />
			<text x="185" y="184" fill="white" fontSize="10" fontWeight="600">
				Crear Cuenta
			</text>

			{/* Decorative checkmarks */}
			<circle cx="250" cy="50" r="15" fill="#6b8fa3" opacity="0.1" />
			<path
				d="M 243 50 L 248 55 L 257 45"
				fill="none"
				stroke="#6b8fa3"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function Step2Illustration() {
	return (
		<svg viewBox="0 0 300 200" className="w-full h-auto">
			<defs>
				<linearGradient id="step2-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.2" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.05" />
				</linearGradient>
			</defs>

			{/* Main card */}
			<rect
				x="20"
				y="20"
				width="260"
				height="160"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>
			<rect
				x="20"
				y="20"
				width="260"
				height="160"
				rx="12"
				fill="url(#step2-grad)"
			/>

			{/* Team member cards */}
			{[
				{ y: 40, name: "Martinez, J.", role: "Delantero" },
				{ y: 80, name: "Rodriguez, C.", role: "Mediocampista" },
				{ y: 120, name: "Silva, A.", role: "Defensor" },
			].map((member, i) => (
				<g key={i}>
					<rect
						x="35"
						y={member.y}
						width="150"
						height="32"
						rx="8"
						fill="currentColor"
						className="text-marketing-bg"
					/>
					<circle
						cx="55"
						cy={member.y + 16}
						r="10"
						fill="#6b8fa3"
						opacity="0.2"
					/>
					<text
						x="72"
						y={member.y + 13}
						fill="currentColor"
						className="text-marketing-fg"
						fontSize="9"
						fontWeight="500"
					>
						{member.name}
					</text>
					<text
						x="72"
						y={member.y + 25}
						fill="currentColor"
						className="text-marketing-fg-muted"
						fontSize="8"
					>
						{member.role}
					</text>
				</g>
			))}

			{/* Add button */}
			<circle cx="220" cy="100" r="25" fill="#6b8fa3" opacity="0.1" />
			<circle cx="220" cy="100" r="18" fill="#6b8fa3" />
			<line
				x1="212"
				y1="100"
				x2="228"
				y2="100"
				stroke="white"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<line
				x1="220"
				y1="92"
				x2="220"
				y2="108"
				stroke="white"
				strokeWidth="2"
				strokeLinecap="round"
			/>

			{/* Counter badge */}
			<rect
				x="195"
				y="145"
				width="70"
				height="25"
				rx="12"
				fill="#6b8fa3"
				opacity="0.15"
			/>
			<text
				x="230"
				y="162"
				fill="#6b8fa3"
				fontSize="10"
				fontWeight="600"
				textAnchor="middle"
			>
				24 atletas
			</text>
		</svg>
	);
}

function Step3Illustration() {
	return (
		<svg viewBox="0 0 300 200" className="w-full h-auto">
			<defs>
				<linearGradient id="step3-area" x1="0%" y1="100%" x2="0%" y2="0%">
					<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.05" />
					<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.3" />
				</linearGradient>
			</defs>

			{/* Main card */}
			<rect
				x="20"
				y="20"
				width="260"
				height="160"
				rx="12"
				fill="currentColor"
				className="text-marketing-card"
			/>

			{/* Chart area */}
			<path
				d="M 40 150 L 40 130 Q 80 120, 100 100 T 160 90 T 220 60 T 260 50 L 260 150 Z"
				fill="url(#step3-area)"
			/>
			<path
				d="M 40 130 Q 80 120, 100 100 T 160 90 T 220 60 T 260 50"
				fill="none"
				stroke="#6b8fa3"
				strokeWidth="2"
				strokeLinecap="round"
			/>

			{/* Data points */}
			{[
				{ x: 100, y: 100 },
				{ x: 160, y: 90 },
				{ x: 220, y: 60 },
				{ x: 260, y: 50 },
			].map((point, i) => (
				<g key={i}>
					<circle cx={point.x} cy={point.y} r="5" fill="#6b8fa3" />
					<circle cx={point.x} cy={point.y} r="2" fill="white" />
				</g>
			))}

			{/* Metric cards */}
			<g>
				<rect
					x="35"
					y="35"
					width="70"
					height="40"
					rx="6"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="45"
					y="52"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
				>
					Rendimiento
				</text>
				<text x="45" y="66" fill="#6b8fa3" fontSize="12" fontWeight="bold">
					+23%
				</text>
			</g>
			<g>
				<rect
					x="115"
					y="35"
					width="70"
					height="40"
					rx="6"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="125"
					y="52"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
				>
					Lesiones
				</text>
				<text x="125" y="66" fill="#6b8fa3" fontSize="12" fontWeight="bold">
					-40%
				</text>
			</g>
			<g>
				<rect
					x="195"
					y="35"
					width="70"
					height="40"
					rx="6"
					fill="currentColor"
					className="text-marketing-bg"
				/>
				<text
					x="205"
					y="52"
					fill="currentColor"
					className="text-marketing-fg-muted"
					fontSize="8"
				>
					Eficiencia
				</text>
				<text x="205" y="66" fill="#f59e0b" fontSize="12" fontWeight="bold">
					94%
				</text>
			</g>
		</svg>
	);
}

function StepCard({ step, index }: { step: Step; index: number }) {
	const isEven = index % 2 === 0;

	return (
		<div
			className={cn(
				"grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center",
				"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
			)}
			style={{ animationDelay: `${index * 150}ms` }}
		>
			{/* Content */}
			<div className={cn("flex flex-col gap-6", !isEven && "lg:order-2")}>
				{/* Step number */}
				<div className="flex items-center gap-4">
					<div className="flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold text-lg shadow-lg shadow-slate-500/25">
						{step.number}
					</div>
					<div className="h-px flex-1 bg-gradient-to-r from-slate-500/50 to-transparent" />
				</div>

				{/* Title and description */}
				<div className="flex flex-col gap-3">
					<h3 className="text-2xl sm:text-3xl font-bold text-marketing-fg">
						{step.title}
					</h3>
					<p className="text-lg text-marketing-fg-muted leading-relaxed">
						{step.description}
					</p>
				</div>

				{/* Features list */}
				<ul className="flex flex-col gap-3">
					{step.features.map((feature) => (
						<li key={feature} className="flex items-center gap-3">
							<div className="flex items-center justify-center size-6 rounded-full bg-slate-500/10">
								<CheckIcon className="size-4 text-slate-500" />
							</div>
							<span className="text-marketing-fg-muted">{feature}</span>
						</li>
					))}
				</ul>
			</div>

			{/* Illustration */}
			<div
				className={cn(
					"relative p-4 rounded-2xl",
					"bg-gradient-to-br from-marketing-card to-marketing-card-hover",
					"border border-marketing-border/50",
					!isEven && "lg:order-1",
				)}
			>
				{step.illustration}
			</div>
		</div>
	);
}

export function HowItWorksSection() {
	const steps: Step[] = [
		{
			number: "1",
			title: "Crea tu cuenta en minutos",
			description:
				"Registrate gratis y configura tu organizacion. El proceso es simple y no requiere tarjeta de credito.",
			features: [
				"Registro rapido con email o Google",
				"Configuracion guiada paso a paso",
				"14 dias de prueba con todas las funciones",
			],
			illustration: <Step1Illustration />,
		},
		{
			number: "2",
			title: "Agrega tu equipo y atletas",
			description:
				"Importa tu plantilla actual o crea perfiles individuales. Organiza por categorias, divisiones o grupos.",
			features: [
				"Importacion masiva desde Excel/CSV",
				"Perfiles detallados de cada atleta",
				"Organizacion flexible y personalizable",
			],
			illustration: <Step2Illustration />,
		},
		{
			number: "3",
			title: "Analiza y optimiza el rendimiento",
			description:
				"Comienza a planificar entrenamientos, monitorear metricas y tomar decisiones basadas en datos reales.",
			features: [
				"Dashboards en tiempo real",
				"Alertas automaticas de fatiga y riesgo",
				"Recomendaciones con IA integrada",
			],
			illustration: <Step3Illustration />,
		},
	];

	return (
		<section
			id="how-it-works"
			className="relative py-24 lg:py-32 overflow-hidden"
		>
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-marketing-accent/5 via-marketing-bg to-marketing-bg" />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-20 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				{/* Header */}
				<div className="flex flex-col items-center text-center gap-6">
					<span
						className={cn(
							"inline-flex items-center gap-2 px-4 py-2 rounded-full",
							"bg-marketing-card border border-marketing-border",
							"text-sm font-semibold text-marketing-fg-muted uppercase tracking-wider",
						)}
					>
						<span className="size-2 rounded-full bg-slate-500" />
						Como Funciona
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						Empieza en <span className="text-slate-500">3 simples pasos</span>
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						De cero a resultados en minutos. Sin complicaciones, sin curva de
						aprendizaje pronunciada.
					</p>
				</div>

				{/* Steps */}
				<div className="flex flex-col gap-20 lg:gap-32">
					{steps.map((step, index) => (
						<StepCard key={step.number} step={step} index={index} />
					))}
				</div>

				{/* Bottom CTA */}
				<div className="flex flex-col items-center gap-6 pt-8">
					<p className="text-marketing-fg-muted text-center">
						Listo para transformar la gestion de tu equipo?
					</p>
					<Link
						href="/athlete-signup"
						className={cn(
							"group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold",
							"bg-gradient-to-r from-slate-500 to-slate-600 text-white",
							"shadow-lg shadow-slate-500/25",
							"hover:shadow-xl hover:shadow-slate-500/30 hover:scale-[1.02]",
							"active:scale-[0.98]",
							"transition-all duration-300",
						)}
					>
						<span>Comenzar Ahora</span>
						<ArrowRightIcon className="size-5 group-hover:translate-x-1 transition-transform" />
					</Link>
				</div>
			</div>
		</section>
	);
}
