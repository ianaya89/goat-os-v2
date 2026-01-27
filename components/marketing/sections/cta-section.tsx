"use client";

import { ArrowRightIcon, CheckCircleIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CtaContent {
	headline: string;
	description: string;
	primaryCta: {
		text: string;
		href: string;
	};
	secondaryCta: {
		text: string;
		href: string;
	};
}

interface CtaSectionProps {
	centered?: boolean;
	content: CtaContent;
}

// Animated background with sports-inspired elements
function CtaBackground() {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Main gradient - monochromatic slate */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900" />

			{/* Overlay pattern - diagonal stripes */}
			<div className="absolute inset-0 opacity-10">
				<svg className="absolute inset-0 size-full" preserveAspectRatio="none">
					<defs>
						<pattern
							id="cta-stripes"
							x="0"
							y="0"
							width="40"
							height="40"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(-45)"
						>
							<line
								x1="0"
								y1="0"
								x2="0"
								y2="40"
								stroke="white"
								strokeWidth="2"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#cta-stripes)" />
				</svg>
			</div>

			{/* Floating orbs - monochromatic */}
			<div
				className="absolute top-0 left-1/4 size-64 rounded-full bg-white/10 blur-3xl"
				style={{ animation: "float 8s ease-in-out infinite" }}
			/>
			<div
				className="absolute bottom-0 right-1/4 size-48 rounded-full bg-slate-300/10 blur-3xl"
				style={{ animation: "float 6s ease-in-out infinite 1s" }}
			/>

			{/* Noise texture */}
			<div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
		</div>
	);
}

// Features list for the CTA
function CtaFeatures() {
	const features = [
		"14 dias de prueba gratis",
		"Sin tarjeta de credito",
		"Soporte 24/7",
		"Cancelacion en cualquier momento",
	];

	return (
		<div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
			{features.map((feature) => (
				<div key={feature} className="flex items-center gap-2 text-white/80">
					<CheckCircleIcon className="size-5 text-slate-300" />
					<span className="text-sm">{feature}</span>
				</div>
			))}
		</div>
	);
}

export function CtaSection({
	centered: _centered = false,
	content,
}: CtaSectionProps) {
	const { headline, description, primaryCta, secondaryCta } = content;

	return (
		<section id="cta" className="relative py-24 lg:py-32 overflow-hidden">
			<CtaBackground />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-5xl lg:px-10 items-center text-center">
				{/* Badge */}
				<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
					<SparklesIcon className="size-4 text-slate-300" />
					<span className="text-sm font-medium text-white">
						Comienza tu transformacion hoy
					</span>
				</div>

				{/* Content */}
				<div className="flex flex-col items-center gap-6">
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-white",
							"sm:text-5xl lg:text-6xl xl:text-7xl",
						)}
					>
						{headline}
					</h2>
					<p className="max-w-2xl text-lg lg:text-xl leading-relaxed text-white/80">
						{description}
					</p>
				</div>

				{/* Buttons */}
				<div className="flex flex-col sm:flex-row items-center gap-4">
					<Link
						href={primaryCta.href}
						className={cn(
							"group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold",
							"bg-white text-slate-700",
							"shadow-xl shadow-black/20",
							"hover:shadow-2xl hover:scale-[1.02]",
							"active:scale-[0.98]",
							"transition-all duration-300",
						)}
					>
						<span>{primaryCta.text}</span>
						<ArrowRightIcon className="size-5 group-hover:translate-x-1 transition-transform" />
						{/* Shine effect */}
						<div className="absolute inset-0 rounded-full overflow-hidden">
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
						</div>
					</Link>
					<Link
						href={secondaryCta.href}
						className={cn(
							"group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold",
							"text-white border-2 border-white/30",
							"hover:bg-white/10 hover:border-white/50",
							"transition-all duration-300",
						)}
					>
						{secondaryCta.text}
						<ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>

				{/* Features */}
				<CtaFeatures />
			</div>
		</section>
	);
}
