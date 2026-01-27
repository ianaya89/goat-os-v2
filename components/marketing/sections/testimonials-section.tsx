"use client";

import { QuoteIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
	name: string;
	role: string;
	company: string;
	quote: string;
	avatar: string;
	sport?: string;
	featured?: boolean;
}

// Generate avatar placeholder with initials
function AvatarPlaceholder({ name, color }: { name: string; color: string }) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div
			className={cn(
				"flex items-center justify-center size-full text-white font-bold text-lg",
				color,
			)}
		>
			{initials}
		</div>
	);
}

// Monochromatic avatar colors
const avatarColors: [string, ...string[]] = [
	"bg-gradient-to-br from-slate-500 to-slate-600",
	"bg-gradient-to-br from-marketing-fg-muted to-marketing-fg",
	"bg-gradient-to-br from-slate-500 to-slate-600",
	"bg-gradient-to-br from-zinc-500 to-zinc-600",
	"bg-gradient-to-br from-neutral-500 to-neutral-600",
	"bg-gradient-to-br from-stone-500 to-stone-600",
];

function TestimonialCard({
	testimonial,
	index,
}: {
	testimonial: Testimonial;
	index: number;
}) {
	const isFeatured = testimonial.featured;

	return (
		<figure
			className={cn(
				"group relative flex flex-col justify-between gap-6 rounded-2xl p-6 lg:p-8",
				"bg-gradient-to-br from-marketing-card to-marketing-card-hover",
				"border border-marketing-border/50",
				"hover:border-marketing-accent/30",
				"transition-all duration-500",
				"animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
				isFeatured && "lg:col-span-2 lg:row-span-2",
			)}
			style={{ animationDelay: `${index * 100}ms` }}
		>
			{/* Background decoration */}
			<div className="absolute top-0 right-0 size-32 rounded-full bg-gradient-to-br from-marketing-accent/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

			{/* Quote icon */}
			<div className="flex items-start justify-between">
				<QuoteIcon className="size-8 text-marketing-accent/20" />
				{testimonial.sport && (
					<span className="px-3 py-1 rounded-full bg-marketing-accent/10 text-xs font-semibold text-marketing-accent uppercase tracking-wider">
						{testimonial.sport}
					</span>
				)}
			</div>

			{/* Quote */}
			<blockquote className="flex-1">
				<p
					className={cn(
						"leading-relaxed text-marketing-fg",
						isFeatured ? "text-xl lg:text-2xl" : "text-base",
					)}
				>
					"{testimonial.quote}"
				</p>
			</blockquote>

			{/* Rating stars */}
			<div className="flex gap-1">
				{[...Array(5)].map((_, i) => (
					<StarIcon key={i} className="size-4 fill-amber-400 text-amber-400" />
				))}
			</div>

			{/* Author */}
			<figcaption className="flex items-center gap-4 pt-4 border-t border-marketing-border/50">
				<div className="flex size-12 overflow-hidden rounded-full ring-2 ring-marketing-border">
					<AvatarPlaceholder
						name={testimonial.name}
						color={avatarColors[index % avatarColors.length] as string}
					/>
				</div>
				<div className="flex-1">
					<p className="font-semibold text-marketing-fg">{testimonial.name}</p>
					<p className="text-sm text-marketing-fg-muted">{testimonial.role}</p>
					<p className="text-sm font-medium text-marketing-accent">
						{testimonial.company}
					</p>
				</div>
			</figcaption>
		</figure>
	);
}

// Featured testimonial with larger layout
function FeaturedTestimonial({ testimonial }: { testimonial: Testimonial }) {
	return (
		<figure
			className={cn(
				"group relative flex flex-col lg:flex-row gap-8 rounded-2xl p-8 lg:p-12",
				"bg-gradient-to-br from-marketing-accent/10 via-marketing-card to-marketing-card",
				"border border-marketing-accent/20",
				"animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
			)}
		>
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 size-40 rounded-full bg-marketing-accent/10 blur-3xl" />
			<div className="absolute bottom-0 right-0 size-32 rounded-full bg-purple-500/10 blur-3xl" />

			{/* Left side - Avatar and info */}
			<div className="relative flex flex-col items-center lg:items-start gap-6 lg:w-1/3">
				<div className="relative">
					<div className="size-24 lg:size-32 overflow-hidden rounded-2xl ring-4 ring-marketing-accent/20">
						<AvatarPlaceholder
							name={testimonial.name}
							color="bg-gradient-to-br from-slate-500 to-blue-600"
						/>
					</div>
					{/* Verified badge */}
					<div className="absolute -bottom-2 -right-2 flex items-center justify-center size-8 rounded-full bg-slate-500 text-white">
						<svg
							className="size-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				</div>

				<div className="text-center lg:text-left">
					<p className="text-xl font-bold text-marketing-fg">
						{testimonial.name}
					</p>
					<p className="text-marketing-fg-muted">{testimonial.role}</p>
					<p className="font-semibold text-marketing-accent">
						{testimonial.company}
					</p>
				</div>

				{/* Stars */}
				<div className="flex gap-1">
					{[...Array(5)].map((_, i) => (
						<StarIcon
							key={i}
							className="size-5 fill-amber-400 text-amber-400"
						/>
					))}
				</div>
			</div>

			{/* Right side - Quote */}
			<div className="relative flex-1 flex flex-col justify-center">
				<QuoteIcon className="absolute -top-2 -left-2 size-12 text-marketing-accent/10" />
				<blockquote>
					<p className="text-xl lg:text-2xl xl:text-3xl leading-relaxed text-marketing-fg font-medium">
						"{testimonial.quote}"
					</p>
				</blockquote>

				{testimonial.sport && (
					<div className="mt-6 flex items-center gap-2">
						<span className="px-4 py-2 rounded-full bg-marketing-card border border-marketing-border text-sm font-semibold text-marketing-fg">
							{testimonial.sport}
						</span>
						<span className="text-sm text-marketing-fg-muted">
							Usuario verificado
						</span>
					</div>
				)}
			</div>
		</figure>
	);
}

export function TestimonialsSection() {
	const featuredTestimonial: Testimonial = {
		name: "Laura Fernandez",
		role: "Preparadora Fisica",
		company: "Seleccion Argentina de Futbol",
		quote:
			"GOAT OS transformo completamente nuestra metodologia de trabajo. El monitoreo de carga nos ayudo a reducir lesiones en un 40% y optimizar el rendimiento de cada jugador. Es una herramienta indispensable para cualquier equipo de alto nivel.",
		avatar: "/marketing/avatars/woman-44.jpg",
		sport: "Futbol",
		featured: true,
	};

	const testimonials: Testimonial[] = [
		{
			name: "Carlos Martinez",
			role: "Director Tecnico",
			company: "Club Atletico Nacional",
			quote:
				"Ahora tenemos datos precisos para cada decision tactica. La planificacion nunca fue tan eficiente.",
			avatar: "/marketing/avatars/man-32.jpg",
			sport: "Futbol",
		},
		{
			name: "Roberto Silva",
			role: "Entrenador Principal",
			company: "Academy Pro Sports",
			quote:
				"La visualizacion del progreso de cada atleta es increible. Mis jugadores estan mas motivados que nunca.",
			avatar: "/marketing/avatars/man-75.jpg",
			sport: "Basquet",
		},
		{
			name: "Ana Garcia",
			role: "Directora de Rendimiento",
			company: "Club Deportivo Elite",
			quote:
				"Integramos GOAT OS en toda nuestra organizacion. La coordinacion entre areas mejoro drasticamente.",
			avatar: "/marketing/avatars/woman-68.jpg",
			sport: "Voleibol",
		},
		{
			name: "Miguel Torres",
			role: "Fisioterapeuta",
			company: "Centro Alto Rendimiento",
			quote:
				"El historial de cada atleta esta siempre disponible. Facilita enormemente el seguimiento de recuperaciones.",
			avatar: "/marketing/avatars/man-46.jpg",
			sport: "Rugby",
		},
		{
			name: "Sofia Ruiz",
			role: "Coordinadora de Formativas",
			company: "Academia Futbol Total",
			quote:
				"Seguir el desarrollo de jovenes talentos nunca fue tan facil. GOAT OS es parte fundamental de nuestro exito.",
			avatar: "/marketing/avatars/woman-26.jpg",
			sport: "Futbol",
		},
		{
			name: "Diego Mendez",
			role: "Head Coach",
			company: "Natacion Elite Argentina",
			quote:
				"Los modulos especificos para natacion nos permiten analizar cada detalle tecnico de nuestros nadadores.",
			avatar: "/marketing/avatars/man-55.jpg",
			sport: "Natacion",
		},
	];

	return (
		<section
			id="testimonials"
			className="relative py-24 lg:py-32 overflow-hidden"
		>
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-marketing-bg via-marketing-accent/5 to-marketing-bg" />

			<div className="relative mx-auto flex max-w-2xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl lg:px-10">
				{/* Header */}
				<div className="flex flex-col items-center text-center gap-6">
					<span
						className={cn(
							"inline-flex items-center gap-2 px-4 py-2 rounded-full",
							"bg-marketing-card border border-marketing-border",
							"text-sm font-semibold text-marketing-fg-muted uppercase tracking-wider",
						)}
					>
						<QuoteIcon className="size-4 text-slate-500" />
						Testimonios
					</span>
					<h2
						className={cn(
							"text-pretty font-display text-4xl leading-tight tracking-tight",
							"text-marketing-fg",
							"sm:text-5xl lg:text-6xl",
						)}
					>
						Lo que dicen{" "}
						<span className="text-slate-500">los profesionales</span>
					</h2>
					<p className="max-w-2xl text-lg leading-relaxed text-marketing-fg-muted">
						Entrenadores, preparadores fisicos y directores tecnicos comparten
						su experiencia con GOAT OS.
					</p>
				</div>

				{/* Featured Testimonial */}
				<FeaturedTestimonial testimonial={featuredTestimonial} />

				{/* Testimonials Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonials.map((testimonial, index) => (
						<TestimonialCard
							key={testimonial.name}
							testimonial={testimonial}
							index={index}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
