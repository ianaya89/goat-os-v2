"use client";

import { cn } from "@/lib/utils";

interface Testimonial {
	name: string;
	role: string;
	company: string;
	quote: string;
	avatar: string;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
	return (
		<figure className="flex flex-col justify-between gap-10 rounded-md bg-marketing-card p-6 text-sm">
			<blockquote className="flex flex-col gap-4">
				<p>"{testimonial.quote}"</p>
			</blockquote>
			<figcaption className="flex items-center gap-4">
				<div className="flex size-12 overflow-hidden rounded-full outline -outline-offset-1 outline-black/5 dark:outline-white/5">
					<img
						src={testimonial.avatar}
						alt={testimonial.name}
						width={160}
						height={160}
						className="size-full object-cover bg-white/75 dark:bg-black/75"
					/>
				</div>
				<div>
					<p className="font-semibold text-marketing-fg">{testimonial.name}</p>
					<p className="text-marketing-fg-muted">
						{testimonial.role} at {testimonial.company}
					</p>
				</div>
			</figcaption>
		</figure>
	);
}

export function TestimonialsSection() {
	const testimonials: Testimonial[] = [
		{
			name: "Carlos Martinez",
			role: "Director Tecnico",
			company: "Club Atletico Nacional",
			quote:
				"GOAT OS revoluciono nuestra forma de planificar. Ahora tenemos datos precisos para cada decision tactica.",
			avatar: "/marketing/avatars/man-32.jpg",
		},
		{
			name: "Laura Fernandez",
			role: "Preparadora Fisica",
			company: "Seleccion Argentina",
			quote:
				"El monitoreo de carga de entrenamiento nos ayudo a reducir lesiones en un 40%. Herramienta indispensable.",
			avatar: "/marketing/avatars/woman-44.jpg",
		},
		{
			name: "Roberto Silva",
			role: "Entrenador Principal",
			company: "Academy Pro Sports",
			quote:
				"La visualizacion del progreso de cada atleta es increible. Mis jugadores estan mas motivados que nunca.",
			avatar: "/marketing/avatars/man-75.jpg",
		},
		{
			name: "Ana Garcia",
			role: "Directora de Rendimiento",
			company: "Club Deportivo Elite",
			quote:
				"Integramos GOAT OS en toda nuestra organizacion. La coordinacion entre areas mejoro drasticamente.",
			avatar: "/marketing/avatars/woman-68.jpg",
		},
		{
			name: "Miguel Torres",
			role: "Fisioterapeuta",
			company: "Centro Alto Rendimiento",
			quote:
				"El historial de cada atleta esta siempre disponible. Facilita enormemente el seguimiento de recuperaciones.",
			avatar: "/marketing/avatars/man-46.jpg",
		},
		{
			name: "Sofia Ruiz",
			role: "Coordinadora de Formativas",
			company: "Academia Futbol Total",
			quote:
				"Seguir el desarrollo de jovenes talentos nunca fue tan facil. GOAT OS es parte fundamental de nuestro exito.",
			avatar: "/marketing/avatars/woman-26.jpg",
		},
	];

	return (
		<section id="testimonials" className="py-16">
			<div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 md:max-w-3xl lg:max-w-7xl lg:gap-16 lg:px-10">
				{/* Header */}
				<div className="flex max-w-2xl flex-col gap-6">
					<div className="flex flex-col gap-2">
						<h2
							className={cn(
								"text-pretty font-display text-[2rem] leading-10 tracking-tight",
								"text-marketing-fg",
								"sm:text-5xl sm:leading-14",
							)}
						>
							Lo que dicen los profesionales
						</h2>
					</div>
					<div className="text-base leading-7 text-marketing-fg-muted text-pretty">
						<p>
							Entrenadores, preparadores fisicos y directores tecnicos comparten
							su experiencia con GOAT OS.
						</p>
					</div>
				</div>

				{/* Testimonials Grid */}
				<div>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{testimonials.map((testimonial) => (
							<TestimonialCard
								key={testimonial.name}
								testimonial={testimonial}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
