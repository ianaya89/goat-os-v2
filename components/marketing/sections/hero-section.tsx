"use client";

import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { GradientCard } from "@/components/marketing/primitives/gradient-card";
import { cn } from "@/lib/utils";

// Fade in animation styles
const fadeInUp =
	"animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both";
const fadeInScale =
	"animate-in fade-in zoom-in-95 duration-1000 fill-mode-both";

function HeroScreenshot() {
	return (
		<div
			className={cn("flex flex-col gap-32", fadeInScale)}
			style={{ animationDelay: "400ms" }}
		>
			{/* Mobile/Tablet Screenshot - visible below lg */}
			<GradientCard
				color="green"
				placement="bottom-right"
				className="lg:hidden hover:scale-[1.01] transition-transform duration-500"
				rounded="xl"
			>
				<img
					src="/marketing/placeholders/placeholder-hero-light.webp"
					alt="App screenshot"
					width={1328}
					height={727}
					className="dark:hidden w-full h-auto"
				/>
				<img
					src="/marketing/placeholders/placeholder-hero-dark.webp"
					alt="App screenshot"
					width={1328}
					height={727}
					className="hidden dark:block w-full h-auto"
				/>
			</GradientCard>

			{/* Desktop Screenshot - visible at lg and above */}
			<GradientCard
				color="green"
				placement="bottom"
				className="hidden lg:block hover:scale-[1.01] transition-transform duration-500"
				rounded="2xl"
			>
				<img
					src="/marketing/placeholders/placeholder-hero-light.webp"
					alt="App screenshot"
					width={1328}
					height={727}
					className="dark:hidden w-full h-auto"
				/>
				<img
					src="/marketing/placeholders/placeholder-hero-dark.webp"
					alt="App screenshot"
					width={1328}
					height={727}
					className="hidden dark:block w-full h-auto"
				/>
			</GradientCard>
		</div>
	);
}

export function HeroSection() {
	return (
		<section
			id="hero"
			className="relative py-24 lg:py-32 scroll-mt-14 overflow-hidden"
		>
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-marketing-accent/5 via-transparent to-purple-500/5 dark:from-marketing-accent/10 dark:to-purple-500/10" />
			<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-marketing-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
			<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-20 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				<div className="flex flex-col gap-24 lg:gap-32">
					<div className="flex flex-col items-start gap-10">
						{/* Announcement Pill */}
						<Link
							href="#"
							className={cn(
								"relative inline-flex items-center gap-3 overflow-hidden rounded-full px-4 py-2",
								"bg-gradient-to-r from-marketing-accent/20 to-purple-500/20",
								"border border-marketing-accent/30 dark:border-marketing-accent/20",
								"hover:border-marketing-accent/50 hover:shadow-lg hover:shadow-marketing-accent/10",
								"transition-all duration-300",
								fadeInUp,
							)}
							style={{ animationDelay: "0ms" }}
						>
							<span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
							<span className="text-sm font-medium">
								Potencia el rendimiento de tus atletas
							</span>
							<span className="inline-flex items-center gap-1 text-sm font-bold text-marketing-accent">
								Conoce mas
								<ChevronRightIcon className="size-4" />
							</span>
						</Link>

						{/* Headline */}
						<h1
							className={cn(
								"max-w-5xl font-display tracking-display-tight",
								"text-5xl sm:text-7xl lg:text-8xl",
								"leading-[1.05]",
								fadeInUp,
							)}
							style={{ animationDelay: "100ms" }}
						>
							<span className="text-marketing-fg">
								El sistema operativo para{" "}
							</span>
							<span className="bg-gradient-to-r from-marketing-accent via-blue-500 to-purple-600 bg-clip-text text-transparent">
								el deporte de alto rendimiento.
							</span>
						</h1>

						{/* Description */}
						<div
							className={cn(
								"flex max-w-2xl flex-col gap-4 text-xl leading-relaxed text-marketing-fg-muted",
								fadeInUp,
							)}
							style={{ animationDelay: "200ms" }}
						>
							<p>
								GOAT OS es la plataforma integral que transforma la gestion
								deportiva. Planifica entrenamientos, monitorea el rendimiento de
								tus atletas y toma decisiones basadas en datos en tiempo real.
							</p>
						</div>

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
									"inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold",
									"bg-gradient-to-r from-marketing-accent to-blue-600 text-white",
									"hover:shadow-2xl hover:shadow-marketing-accent/40 hover:scale-105",
									"transition-all duration-300",
								)}
							>
								Registrarme como Atleta
								<ArrowRightIcon className="size-5" />
							</Link>
							<Link
								href="/pricing"
								className={cn(
									"group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold",
									"border-2 border-marketing-border hover:border-marketing-accent",
									"text-marketing-fg hover:text-marketing-accent transition-all duration-300",
								)}
							>
								Ver Precios
								<ArrowRightIcon className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
							</Link>
						</div>
					</div>

					<HeroScreenshot />
				</div>
			</div>
		</section>
	);
}
