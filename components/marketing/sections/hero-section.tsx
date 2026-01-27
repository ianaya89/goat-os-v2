"use client";

import { ArrowRightIcon, PlayIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { GradientCard } from "@/components/marketing/primitives/gradient-card";
import { cn } from "@/lib/utils";

// Fade in animation styles
const fadeInUp =
	"animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both";
const fadeInScale =
	"animate-in fade-in zoom-in-95 duration-1000 fill-mode-both";
const _fadeInLeft =
	"animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both";
const _fadeInRight =
	"animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both";

// Dynamic geometric background with sports-inspired shapes
function HeroBackground() {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Primary gradient mesh */}
			<div className="absolute inset-0 bg-gradient-to-br from-marketing-bg via-marketing-bg to-marketing-accent/5 dark:from-marketing-bg dark:via-marketing-bg dark:to-marketing-accent/10" />

			{/* Animated diagonal stripes - Athletic aesthetic */}
			<div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
				<svg className="absolute inset-0 size-full" preserveAspectRatio="none">
					<defs>
						<pattern
							id="hero-stripes"
							x="0"
							y="0"
							width="60"
							height="60"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(-45)"
						>
							<line
								x1="0"
								y1="0"
								x2="0"
								y2="60"
								stroke="currentColor"
								strokeWidth="2"
								className="text-marketing-accent"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#hero-stripes)" />
				</svg>
			</div>

			{/* Floating geometric shapes - monochromatic slate */}
			<div
				className="absolute top-20 right-[15%] size-64 rounded-full bg-gradient-to-br from-slate-500/15 to-slate-600/5 blur-3xl"
				style={{ animation: "float 8s ease-in-out infinite" }}
			/>
			<div
				className="absolute top-40 right-[5%] size-32 rounded-full bg-gradient-to-br from-slate-400/10 to-slate-500/5 blur-2xl"
				style={{ animation: "float 6s ease-in-out infinite 1s" }}
			/>
			<div
				className="absolute bottom-32 left-[10%] size-48 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/5 blur-3xl"
				style={{ animation: "float 7s ease-in-out infinite 0.5s" }}
			/>

			{/* Stadium-inspired arc at bottom */}
			<div className="absolute bottom-0 left-0 right-0 h-[400px] overflow-hidden">
				<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[800px] rounded-[100%] border-t border-marketing-border/30 dark:border-marketing-border/20" />
			</div>

			{/* Grid dots pattern */}
			<div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
				<svg className="absolute inset-0 size-full">
					<defs>
						<pattern
							id="hero-dots"
							x="0"
							y="0"
							width="32"
							height="32"
							patternUnits="userSpaceOnUse"
						>
							<circle
								cx="2"
								cy="2"
								r="1"
								fill="currentColor"
								className="text-marketing-fg"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#hero-dots)" />
				</svg>
			</div>
		</div>
	);
}

// Custom athletic illustration component
function HeroIllustration() {
	return (
		<div
			className={cn(
				"relative w-full aspect-[16/10] rounded-2xl overflow-hidden",
				fadeInScale,
			)}
			style={{ animationDelay: "500ms" }}
		>
			{/* Main container with gradient border */}
			<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 p-[2px]">
				<div className="relative size-full rounded-[14px] bg-marketing-bg overflow-hidden">
					{/* Inner gradient background */}
					<div className="absolute inset-0 bg-gradient-to-br from-marketing-card via-marketing-bg to-marketing-card" />

					{/* Abstract dashboard visualization */}
					<svg
						viewBox="0 0 800 500"
						className="relative size-full"
						preserveAspectRatio="xMidYMid slice"
					>
						{/* Grid background */}
						<defs>
							<pattern
								id="dashboard-grid"
								x="0"
								y="0"
								width="40"
								height="40"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 40 0 L 0 0 0 40"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.5"
									className="text-marketing-border/30"
								/>
							</pattern>
							<linearGradient
								id="chart-gradient"
								x1="0%"
								y1="100%"
								x2="0%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.1" />
								<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.4" />
							</linearGradient>
							<linearGradient
								id="bar-gradient"
								x1="0%"
								y1="100%"
								x2="0%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#6b8fa3" stopOpacity="0.6" />
								<stop offset="100%" stopColor="#6b8fa3" stopOpacity="0.9" />
							</linearGradient>
						</defs>

						<rect width="800" height="500" fill="url(#dashboard-grid)" />

						{/* Performance chart area */}
						<path
							d="M 60 350 Q 150 320, 200 280 T 340 260 T 480 200 T 620 180 T 760 140"
							fill="none"
							stroke="#6b8fa3"
							strokeWidth="3"
							strokeLinecap="round"
							className="drop-shadow-lg"
						>
							<animate
								attributeName="stroke-dasharray"
								from="0 1000"
								to="1000 0"
								dur="2s"
								fill="freeze"
							/>
						</path>
						<path
							d="M 60 350 Q 150 320, 200 280 T 340 260 T 480 200 T 620 180 T 760 140 V 400 H 60 Z"
							fill="url(#chart-gradient)"
							opacity="0.5"
						/>

						{/* Animated data points */}
						{[
							{ cx: 200, cy: 280 },
							{ cx: 340, cy: 260 },
							{ cx: 480, cy: 200 },
							{ cx: 620, cy: 180 },
							{ cx: 760, cy: 140 },
						].map((point, i) => (
							<g key={i}>
								<circle
									cx={point.cx}
									cy={point.cy}
									r="8"
									fill="#6b8fa3"
									className="drop-shadow-md"
								>
									<animate
										attributeName="r"
										values="6;10;6"
										dur="2s"
										begin={`${i * 0.3}s`}
										repeatCount="indefinite"
									/>
								</circle>
								<circle cx={point.cx} cy={point.cy} r="4" fill="white" />
							</g>
						))}

						{/* Bar chart on right */}
						{[
							{ x: 580, h: 120 },
							{ x: 620, h: 180 },
							{ x: 660, h: 150 },
							{ x: 700, h: 200 },
							{ x: 740, h: 160 },
						].map((bar, i) => (
							<rect
								key={i}
								x={bar.x}
								y={420 - bar.h}
								width="28"
								height={bar.h}
								rx="4"
								fill="url(#bar-gradient)"
								className="drop-shadow"
							>
								<animate
									attributeName="height"
									from="0"
									to={bar.h}
									dur="0.8s"
									begin={`${0.5 + i * 0.1}s`}
									fill="freeze"
								/>
								<animate
									attributeName="y"
									from="420"
									to={420 - bar.h}
									dur="0.8s"
									begin={`${0.5 + i * 0.1}s`}
									fill="freeze"
								/>
							</rect>
						))}

						{/* Athlete silhouette indicator */}
						<g transform="translate(100, 80)">
							<rect
								x="0"
								y="0"
								width="200"
								height="100"
								rx="12"
								fill="currentColor"
								className="text-marketing-card dark:text-marketing-card-hover"
							/>
							<circle cx="45" cy="50" r="25" fill="#6b8fa3" opacity="0.2" />
							<circle cx="45" cy="50" r="18" fill="#6b8fa3" opacity="0.3" />
							<text
								x="85"
								y="42"
								fill="currentColor"
								className="text-marketing-fg text-sm font-semibold"
								fontSize="14"
							>
								Rendimiento
							</text>
							<text
								x="85"
								y="65"
								fill="#6b8fa3"
								fontSize="20"
								fontWeight="bold"
							>
								94.2%
							</text>
						</g>

						{/* Secondary card */}
						<g transform="translate(340, 60)">
							<rect
								x="0"
								y="0"
								width="160"
								height="80"
								rx="12"
								fill="currentColor"
								className="text-marketing-card dark:text-marketing-card-hover"
							/>
							<text
								x="20"
								y="35"
								fill="currentColor"
								className="text-marketing-fg-muted"
								fontSize="12"
							>
								Sesiones Hoy
							</text>
							<text
								x="20"
								y="60"
								fill="currentColor"
								className="text-marketing-fg"
								fontSize="24"
								fontWeight="bold"
							>
								12
							</text>
							<circle cx="130" cy="45" r="18" fill="#6b8fa3" opacity="0.2" />
							<text x="124" y="50" fill="#6b8fa3" fontSize="16">
								+
							</text>
						</g>
					</svg>

					{/* Shimmer overlay */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
				</div>
			</div>
		</div>
	);
}

// Trust badges component - simplified, no fake metrics
function TrustBadges() {
	const badges = [
		{ text: "Sin tarjeta de credito" },
		{ text: "14 dias gratis" },
		{ text: "Cancela cuando quieras" },
	];

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-4 text-sm text-marketing-fg-muted",
				fadeInUp,
			)}
			style={{ animationDelay: "400ms" }}
		>
			{badges.map((badge, i) => (
				<div key={i} className="flex items-center gap-2">
					<span className="size-1.5 rounded-full bg-slate-500" />
					<span>{badge.text}</span>
				</div>
			))}
		</div>
	);
}

export function HeroSection() {
	return (
		<section
			id="hero"
			className="relative min-h-[90vh] lg:min-h-screen flex items-center py-16 lg:py-24 scroll-mt-14 overflow-hidden"
		>
			<HeroBackground />

			<div className="relative mx-auto w-full max-w-2xl px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
					{/* Left column - Content */}
					<div className="flex flex-col items-start gap-8">
						{/* Announcement Pill */}
						<Link
							href="#features"
							className={cn(
								"group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-1 pr-4 py-1",
								"bg-marketing-card border border-marketing-border",
								"hover:border-marketing-accent/50 hover:shadow-lg hover:shadow-marketing-accent/10",
								"transition-all duration-300",
								fadeInUp,
							)}
							style={{ animationDelay: "0ms" }}
						>
							<span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
								</span>
								Nuevo
							</span>
							<span className="text-sm text-marketing-fg-muted group-hover:text-marketing-fg transition-colors">
								Analisis con IA ahora disponible
							</span>
							<ArrowRightIcon className="size-4 text-marketing-fg-muted group-hover:text-marketing-accent group-hover:translate-x-1 transition-all" />
						</Link>

						{/* Headline */}
						<h1
							className={cn(
								"font-display tracking-display-tight",
								"text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
								"leading-[1.1]",
								fadeInUp,
							)}
							style={{ animationDelay: "100ms" }}
						>
							<span className="text-marketing-fg">
								El sistema operativo para{" "}
							</span>
							<span className="relative">
								<span className="relative z-10 text-slate-500">
									el deporte de alto rendimiento
								</span>
								{/* Underline accent */}
								<svg
									className="absolute -bottom-2 left-0 w-full h-3 text-slate-500/20"
									viewBox="0 0 200 12"
									preserveAspectRatio="none"
								>
									<path
										d="M0 6 Q 50 0, 100 6 T 200 6"
										fill="none"
										stroke="currentColor"
										strokeWidth="4"
										strokeLinecap="round"
									/>
								</svg>
							</span>
						</h1>

						{/* Description */}
						<p
							className={cn(
								"max-w-xl text-lg lg:text-xl leading-relaxed text-marketing-fg-muted",
								fadeInUp,
							)}
							style={{ animationDelay: "200ms" }}
						>
							Planifica entrenamientos personalizados, monitorea el rendimiento
							en tiempo real y potencia a tus atletas con inteligencia
							artificial.
						</p>

						{/* CTA Buttons */}
						<div
							className={cn(
								"flex flex-col sm:flex-row items-start sm:items-center gap-4",
								fadeInUp,
							)}
							style={{ animationDelay: "300ms" }}
						>
							<Link
								href="/athlete-signup"
								className={cn(
									"group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold",
									"bg-gradient-to-r from-slate-500 to-slate-600 text-white",
									"shadow-lg shadow-slate-500/25",
									"hover:shadow-xl hover:shadow-slate-500/30 hover:scale-[1.02]",
									"active:scale-[0.98]",
									"transition-all duration-300",
								)}
							>
								<span>Comenzar Gratis</span>
								<ArrowRightIcon className="size-5 group-hover:translate-x-1 transition-transform" />
								{/* Shine effect */}
								<div className="absolute inset-0 rounded-full overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
								</div>
							</Link>
							<Link
								href="#features"
								className={cn(
									"group inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold",
									"text-marketing-fg hover:text-marketing-accent transition-colors",
								)}
							>
								<div className="flex items-center justify-center size-10 rounded-full bg-marketing-card border border-marketing-border group-hover:border-marketing-accent/50 transition-colors">
									<PlayIcon className="size-4 ml-0.5" />
								</div>
								<span>Ver Demo</span>
							</Link>
						</div>

						{/* Trust badges */}
						<TrustBadges />
					</div>

					{/* Right column - Illustration */}
					<div className="relative lg:pl-8">
						<HeroIllustration />
					</div>
				</div>
			</div>
		</section>
	);
}
