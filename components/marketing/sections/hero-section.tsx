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
		<section id="hero" className="py-16 scroll-mt-14">
			<div className="mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				<div className="flex flex-col gap-32">
					<div className="flex flex-col items-start gap-8">
						{/* Announcement Pill */}
						<Link
							href="#"
							className={cn(
								"relative inline-flex max-w-full items-center gap-3 overflow-hidden rounded-md px-3.5 py-2 text-sm",
								"bg-marketing-card",
								"hover:bg-marketing-card-hover transition-all duration-300",
								"dark:ring-inset dark:ring-1 dark:ring-white/5",
								"sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:px-3 sm:py-0.5",
								fadeInUp,
							)}
							style={{ animationDelay: "0ms" }}
						>
							<span className="truncate text-pretty sm:truncate">
								Potencia el rendimiento de tus atletas
							</span>
							<span className="hidden h-3 w-px bg-marketing-card-hover sm:block" />
							<span className="inline-flex shrink-0 items-center gap-1 font-semibold text-marketing-accent">
								Conoce mas
								<ChevronRightIcon className="size-3" />
							</span>
						</Link>

						{/* Headline */}
						<h1
							className={cn(
								"max-w-5xl text-balance font-display text-5xl tracking-display-tight",
								"text-marketing-fg",
								"sm:text-6xl sm:leading-[1.1]",
								"lg:text-[5.5rem] lg:leading-[1.05]",
								fadeInUp,
							)}
							style={{ animationDelay: "100ms" }}
						>
							El sistema operativo para el deporte de alto rendimiento.
						</h1>

						{/* Description */}
						<div
							className={cn(
								"flex max-w-3xl flex-col gap-4 text-lg leading-8 text-marketing-fg-muted",
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
							className={cn("flex items-center gap-4", fadeInUp)}
							style={{ animationDelay: "300ms" }}
						>
							<Link
								href="/auth/sign-up"
								className={cn(
									"inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-6 py-3 text-sm font-semibold",
									"bg-marketing-accent text-marketing-accent-fg",
									"hover:bg-marketing-accent-hover hover:scale-[1.02]",
									"transition-all duration-300 shadow-lg shadow-marketing-accent/25",
								)}
							>
								Comenzar Ahora
							</Link>
							<Link
								href="/pricing"
								className={cn(
									"group inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
									"text-marketing-fg hover:bg-marketing-card-hover transition-all duration-300",
								)}
							>
								Ver Precios
								<ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
							</Link>
						</div>
					</div>

					<HeroScreenshot />
				</div>
			</div>
		</section>
	);
}
